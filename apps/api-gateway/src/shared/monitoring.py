#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive Monitoring & Logging Setup
Sentry, Prometheus, ELK integration
"""

import logging
import os

# ============================================
# SENTRY SETUP (Error Tracking)
# ============================================


def init_sentry():
    """Initialize Sentry for error tracking"""
    try:
        import sentry_sdk
        from sentry_sdk.integrations.celery import CeleryIntegration
        from sentry_sdk.integrations.flask import FlaskIntegration

        sentry_dsn = os.getenv("SENTRY_DSN")
        if not sentry_dsn:
            logging.warning("⚠️  Sentry DSN not configured")
            return None

        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[FlaskIntegration(), CeleryIntegration()],
            traces_sample_rate=0.1,  # 10% of transactions
            profiles_sample_rate=0.1,
            environment=os.getenv("FLASK_ENV", "development"),
            release="2.1.0",
        )

        logging.info("✅ Sentry initialized successfully")
        return True
    except ImportError:
        logging.warning(
            "⚠️  sentry-sdk not installed. Install with: pip install sentry-sdk"
        )
        return False
    except Exception as e:
        logging.error(f"❌ Sentry initialization error: {e}")
        return False


# ============================================
# PROMETHEUS METRICS
# ============================================


def init_prometheus(app):
    """Initialize Prometheus metrics"""
    try:
        from prometheus_client import (
            CollectorRegistry,
            Counter,
            Gauge,
            Histogram,
            generate_latest,
        )
        from prometheus_flask_exporter import PrometheusMetrics

        metrics = PrometheusMetrics(app)

        # Custom metrics
        request_count = Counter(
            "api_requests_total", "Total API requests", ["method", "endpoint", "status"]
        )

        request_duration = Histogram(
            "api_request_duration_seconds",
            "API request duration",
            ["method", "endpoint"],
            buckets=(0.1, 0.5, 1.0, 2.5, 5.0, 10.0),
        )

        db_connection_pool = Gauge(
            "mongodb_connections_active", "Active MongoDB connections"
        )

        cache_hits = Counter("cache_hits_total", "Total cache hits", ["cache_type"])

        cache_misses = Counter(
            "cache_misses_total", "Total cache misses", ["cache_type"]
        )

        logging.info("✅ Prometheus metrics initialized")
        return {
            "metrics": metrics,
            "request_count": request_count,
            "request_duration": request_duration,
            "db_connection_pool": db_connection_pool,
            "cache_hits": cache_hits,
            "cache_misses": cache_misses,
        }
    except ImportError:
        logging.warning(
            "⚠️  prometheus-client not installed. Install with: pip install prometheus-client prometheus-flask-exporter"
        )
        return None
    except Exception as e:
        logging.error(f"❌ Prometheus initialization error: {e}")
        return None


# ============================================
# STRUCTURED LOGGING
# ============================================


class StructuredLogger:
    """Structured logging with JSON output"""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def log_event(self, level: str, event: str, **kwargs):
        """Log structured event"""
        import json
        from datetime import datetime

        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level.upper(),
            "event": event,
            "service": "api-gateway",
            "version": "2.1.0",
            **kwargs,
        }

        if level.lower() == "info":
            self.logger.info(json.dumps(log_entry))
        elif level.lower() == "warning":
            self.logger.warning(json.dumps(log_entry))
        elif level.lower() == "error":
            self.logger.error(json.dumps(log_entry))
        elif level.lower() == "debug":
            self.logger.debug(json.dumps(log_entry))

    def log_request(
        self, method: str, path: str, status: int, duration: float, **kwargs
    ):
        """Log API request"""
        self.log_event(
            "info",
            "api_request",
            method=method,
            path=path,
            status=status,
            duration_ms=duration * 1000,
            **kwargs,
        )

    def log_error(self, error: str, error_type: str, **kwargs):
        """Log error"""
        self.log_event(
            "error", "error_occurred", error=error, error_type=error_type, **kwargs
        )

    def log_database_operation(
        self, operation: str, collection: str, duration: float, **kwargs
    ):
        """Log database operation"""
        self.log_event(
            "info",
            "database_operation",
            operation=operation,
            collection=collection,
            duration_ms=duration * 1000,
            **kwargs,
        )

    def log_cache_operation(self, operation: str, cache_type: str, hit: bool, **kwargs):
        """Log cache operation"""
        self.log_event(
            "info",
            "cache_operation",
            operation=operation,
            cache_type=cache_type,
            hit=hit,
            **kwargs,
        )


# ============================================
# DATADOG INTEGRATION (Optional)
# ============================================


def init_datadog():
    """Initialize Datadog APM"""
    try:
        from ddtrace import config, patch_all

        datadog_key = os.getenv("DATADOG_API_KEY")
        if not datadog_key:
            logging.warning("⚠️  Datadog API key not configured")
            return None

        config.analytics_enabled = True
        patch_all()

        logging.info("✅ Datadog APM initialized")
        return True
    except ImportError:
        logging.warning("⚠️  ddtrace not installed. Install with: pip install ddtrace")
        return False
    except Exception as e:
        logging.error(f"❌ Datadog initialization error: {e}")
        return False


# ============================================
# ALERTING
# ============================================


class AlertManager:
    """Manage alerts and notifications"""

    def __init__(self):
        self.slack_webhook = os.getenv("SLACK_WEBHOOK_URL")
        self.email_config = {
            "smtp_host": os.getenv("SMTP_HOST"),
            "smtp_port": os.getenv("SMTP_PORT"),
            "sender": os.getenv("EMAIL_FROM"),
        }

    def send_slack_alert(self, message: str, severity: str = "warning"):
        """Send Slack alert"""
        if not self.slack_webhook:
            logging.warning("No Slack webhook configured")
            return False

        try:
            import requests

            color_map = {"info": "#36a64f", "warning": "#ff9800", "critical": "#f44336"}

            payload = {
                "attachments": [
                    {
                        "color": color_map.get(severity, "#999999"),
                        "title": f"{severity.upper()} Alert",
                        "text": message,
                        "footer": "Ultrarslanoglu API Gateway",
                        "ts": int(time.time()),
                    }
                ]
            }

            response = requests.post(self.slack_webhook, json=payload)
            return response.status_code == 200
        except Exception as e:
            logging.error(f"Error sending Slack alert: {e}")
            return False

    def send_email_alert(self, subject: str, message: str, recipients: list):
        """Send email alert"""
        try:
            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            smtp_host = self.email_config.get("smtp_host")
            smtp_port = int(self.email_config.get("smtp_port", 587))

            if not smtp_host:
                logging.warning("SMTP not configured")
                return False

            msg = MIMEMultipart()
            msg["From"] = self.email_config.get("sender")
            msg["To"] = ", ".join(recipients)
            msg["Subject"] = subject

            msg.attach(MIMEText(message, "plain"))

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
                server.send_message(msg)

            return True
        except Exception as e:
            logging.error(f"Error sending email alert: {e}")
            return False


# ============================================
# HEALTH CHECK METRICS
# ============================================


def get_system_health() -> dict:
    """Get system health metrics"""
    try:
        import psutil

        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent,
            "uptime_seconds": int(time.time() - psutil.boot_time()),
        }
    except ImportError:
        logging.warning("⚠️  psutil not installed for system metrics")
        return {}


# ============================================
# INITIALIZATION FUNCTION
# ============================================


def init_monitoring(app):
    """Initialize all monitoring services"""
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    monitoring = {}

    # Sentry
    if init_sentry():
        monitoring["sentry"] = True

    # Prometheus
    prometheus_metrics = init_prometheus(app)
    if prometheus_metrics:
        monitoring["prometheus"] = prometheus_metrics

    # Datadog
    if init_datadog():
        monitoring["datadog"] = True

    # Alert manager
    monitoring["alerts"] = AlertManager()

    # Structured logging
    monitoring["logger"] = StructuredLogger("api-gateway")

    logging.info(f"✅ Monitoring initialized: {list(monitoring.keys())}")

    return monitoring


# For Flask integration
def register_monitoring_blueprints(app, monitoring):
    """Register monitoring endpoints"""
    from flask import Blueprint, jsonify

    bp = Blueprint("monitoring", __name__)

    @bp.route("/metrics", methods=["GET"])
    def metrics():
        """Prometheus metrics endpoint"""
        if "prometheus" in monitoring:
            from prometheus_client import generate_latest

            return generate_latest(), 200, {"Content-Type": "text/plain; charset=utf-8"}
        return {"error": "Prometheus not configured"}, 503

    @bp.route("/health", methods=["GET"])
    def health():
        """Health check endpoint"""
        return jsonify(
            {
                "status": "healthy",
                "version": "2.1.0",
                "service": "api-gateway",
                "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            }
        ), 200

    @bp.route("/health/detailed", methods=["GET"])
    def detailed_health():
        """Detailed health check"""
        health_data = get_system_health()
        health_data.update(
            {
                "status": "healthy",
                "version": "2.1.0",
                "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
            }
        )
        return jsonify(health_data), 200

    app.register_blueprint(bp)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logging.info("Monitoring utilities loaded successfully")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IoT Devices Module
- Controls lights, sound system, and screen via MQTT
- REST endpoints for quick actions
"""

import json
import os
from typing import Any, Dict

import paho.mqtt.publish as publish
from flask import Blueprint, jsonify, request
from loguru import logger

from ..shared.auth import require_auth
from ..shared.error_handler import (
    create_error_response,
    create_success_response,
)


def _mqtt_config() -> Dict[str, Any]:
    return {
        "broker": os.getenv("MQTT_BROKER", "localhost"),
        "port": int(os.getenv("MQTT_PORT", "1883")),
        "username": os.getenv("MQTT_USERNAME"),
        "password": os.getenv("MQTT_PASSWORD"),
        "topic_prefix": os.getenv("MQTT_TOPIC_PREFIX", "stadium/devices"),
        "client_id": os.getenv("MQTT_CLIENT_ID", "ultrarslanoglu-api"),
    }


def _publish(topic: str, payload: Dict[str, Any]) -> None:
    cfg = _mqtt_config()
    auth = None
    if cfg.get("username"):
        auth = {"username": cfg["username"], "password": cfg.get("password")}

    full_topic = f"{cfg['topic_prefix']}/{topic}".strip("/")

    logger.info(f"MQTT publish -> topic={full_topic} payload={payload}")
    publish.single(
        full_topic,
        payload=json.dumps(payload),
        hostname=cfg["broker"],
        port=cfg["port"],
        auth=auth,
        client_id=cfg["client_id"],
        qos=1,
        retain=False,
    )


iot_bp = Blueprint("iot", __name__, url_prefix="/api/iot")


@iot_bp.route("/lights/on", methods=["POST"])
@require_auth
def lights_on():
    data = request.get_json(silent=True) or {}
    brightness = data.get("brightness", 80)
    if not isinstance(brightness, (int, float)) or brightness < 0 or brightness > 100:
        response, status = create_error_response(
            "VAL_004", "Brightness must be between 0-100"
        )
        return jsonify(response), status

    try:
        _publish("lights/on", {"brightness": int(brightness)})
        return jsonify(
            create_success_response({"status": "on", "brightness": int(brightness)})
        )
    except Exception as exc:
        logger.error(f"Lights on error: {exc}")
        response, status = create_error_response("SERVER_003", "MQTT publish failed")
        return jsonify(response), status


@iot_bp.route("/lights/off", methods=["POST"])
@require_auth
def lights_off():
    try:
        _publish("lights/off", {"status": "off"})
        return jsonify(create_success_response({"status": "off"}))
    except Exception as exc:
        logger.error(f"Lights off error: {exc}")
        response, status = create_error_response("SERVER_003", "MQTT publish failed")
        return jsonify(response), status


@iot_bp.route("/sound/play", methods=["POST"])
@require_auth
def sound_play():
    data = request.get_json(silent=True) or {}
    track = data.get("track")
    volume = data.get("volume", 70)

    if not track:
        response, status = create_error_response("VAL_002", "track is required")
        return jsonify(response), status
    if not isinstance(volume, (int, float)) or volume < 0 or volume > 100:
        response, status = create_error_response(
            "VAL_004", "Volume must be between 0-100"
        )
        return jsonify(response), status

    try:
        _publish("sound/play", {"track": track, "volume": int(volume)})
        return jsonify(
            create_success_response(
                {"status": "playing", "track": track, "volume": int(volume)}
            )
        )
    except Exception as exc:
        logger.error(f"Sound play error: {exc}")
        response, status = create_error_response("SERVER_003", "MQTT publish failed")
        return jsonify(response), status


@iot_bp.route("/screen/show", methods=["POST"])
@require_auth
def screen_show():
    data = request.get_json(silent=True) or {}
    content = data.get("content")
    duration = data.get("duration", 10)

    if not content:
        response, status = create_error_response("VAL_002", "content is required")
        return jsonify(response), status
    if not isinstance(duration, (int, float)) or duration <= 0 or duration > 300:
        response, status = create_error_response(
            "VAL_004", "Duration must be between 1-300 seconds"
        )
        return jsonify(response), status

    try:
        _publish("screen/show", {"content": content, "duration": int(duration)})
        return jsonify(
            create_success_response({"status": "showing", "duration": int(duration)})
        )
    except Exception as exc:
        logger.error(f"Screen show error: {exc}")
        response, status = create_error_response("SERVER_003", "MQTT publish failed")
        return jsonify(response), status


# Optional: simple ping for diagnostics
@iot_bp.route("/ping", methods=["GET"])
@require_auth
def iot_ping():
    cfg = _mqtt_config()
    return jsonify(
        create_success_response(
            {
                "broker": cfg.get("broker"),
                "port": cfg.get("port"),
                "topic_prefix": cfg.get("topic_prefix"),
            }
        )
    )

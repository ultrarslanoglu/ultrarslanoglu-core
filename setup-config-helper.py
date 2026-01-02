#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configuration Management Helper
Helps set up and verify configurations for different environments
"""

import os
import sys
from typing import Dict, List, Tuple


class ConfigValidator:
    """Validate configuration files"""

    # Required keys for each environment
    REQUIRED_KEYS = {
        "all": [
            "MONGO_PASSWORD",
            "JWT_SECRET",
            "REDIS_URL",
        ],
        "production": [
            "NEXTAUTH_URL",
            "NEXT_PUBLIC_SITE_URL",
            "FACEBOOK_APP_ID",
            "GOOGLE_CLIENT_ID",
            "TIKTOK_CLIENT_KEY",
        ],
        "development": [
            "DEBUG",
        ],
    }

    @staticmethod
    def validate_env_file(
        env_path: str, environment: str = "development"
    ) -> Tuple[bool, List[str]]:
        """
        Validate environment file
        Returns: (is_valid, missing_keys)
        """
        if not os.path.exists(env_path):
            return False, [f"File not found: {env_path}"]

        # Read file
        config = {}
        try:
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        config[key.strip()] = value.strip()
        except Exception as e:
            return False, [f"Error reading file: {e}"]

        # Check required keys
        required = ConfigValidator.REQUIRED_KEYS["all"].copy()
        if environment in ConfigValidator.REQUIRED_KEYS:
            required.extend(ConfigValidator.REQUIRED_KEYS[environment])

        missing = [key for key in required if key not in config]

        if missing:
            return False, missing

        # Check for empty values (optional but warn)
        warnings = []
        for key in required:
            if config.get(key) == "" or config.get(key, "").startswith("CHANGE_ME"):
                warnings.append(f"⚠️  {key} is not properly configured")

        return True, warnings

    @staticmethod
    def print_validation_report(env_path: str, environment: str = "development"):
        """Print validation report"""
        print(f"\n{'=' * 60}")
        print(f"Validating: {env_path}")
        print(f"Environment: {environment}")
        print(f"{'=' * 60}\n")

        is_valid, messages = ConfigValidator.validate_env_file(env_path, environment)

        if is_valid:
            print("✅ Configuration is valid!")
            if messages:
                print("\n⚠️  Warnings:")
                for msg in messages:
                    print(f"  - {msg}")
        else:
            print("❌ Configuration is invalid!")
            print("\nMissing keys:")
            for key in messages:
                print(f"  - {key}")

        print(f"\n{'=' * 60}\n")
        return is_valid


class ConfigGenerator:
    """Generate configuration templates"""

    @staticmethod
    def generate_secrets(environment: str = "development") -> Dict[str, str]:
        """Generate random secrets for configuration"""
        import secrets
        import string

        def random_secret(length: int = 32) -> str:
            alphabet = string.ascii_letters + string.digits
            return "".join(secrets.choice(alphabet) for _ in range(length))

        secrets_dict = {
            "JWT_SECRET": random_secret(64),
            "SESSION_SECRET": random_secret(64),
            "NEXTAUTH_SECRET": random_secret(64),
        }

        if environment == "production":
            secrets_dict.update(
                {
                    "MONGO_PASSWORD": random_secret(32),
                    "REDIS_PASSWORD": random_secret(32),
                }
            )

        return secrets_dict

    @staticmethod
    def print_generated_secrets(environment: str = "development"):
        """Print generated secrets"""
        secrets = ConfigGenerator.generate_secrets(environment)

        print(f"\n{'=' * 60}")
        print(f"Generated Secrets for {environment}")
        print(f"{'=' * 60}\n")

        for key, value in secrets.items():
            print(f"{key}={value}")

        print(f"\n{'=' * 60}\n")
        print("⚠️  IMPORTANT:")
        print("  1. Copy these values to your .env file")
        print("  2. Store safely (preferably in secret management system)")
        print("  3. Never commit to version control")
        print(f"\n{'=' * 60}\n")


class SetupGuide:
    """Interactive setup guide"""

    @staticmethod
    def print_docker_setup():
        """Print Docker setup instructions"""
        print("""
╔════════════════════════════════════════════════════════════════════╗
║           DOCKER SETUP INSTRUCTIONS                                ║
╚════════════════════════════════════════════════════════════════════╝

📋 STEP 1: Configure Environment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Choose your environment:
1. Development (local machine)
2. Testing (CI/CD)
3. Production (cloud)

$ source scripts/select-env.sh
$ # Follow prompts


📋 STEP 2: Set Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Edit your selected .env file:

$ nano .env.development  # or .env.production

Required configurations:
  - MONGO_PASSWORD
  - JWT_SECRET
  - GITHUB_TOKEN
  - Social media credentials (Facebook, Google, TikTok)


📋 STEP 3: Start Services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Development:
$ docker-compose --env-file .env.development up -d

Production:
$ docker-compose --env-file .env.production up -d

Testing:
$ docker-compose --env-file .env.testing up -d


📋 STEP 4: Verify
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check container status:
$ docker-compose ps

Test health endpoint:
$ curl http://localhost:5000/health

View logs:
$ docker-compose logs -f api-gateway

Run tests:
$ pytest api-gateway/test_comprehensive.py -v


📋 STEP 5: Common Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stop services:
$ docker-compose down

Restart services:
$ docker-compose restart

Remove all data:
$ docker-compose down -v

Rebuild images:
$ docker-compose build --no-cache

╚════════════════════════════════════════════════════════════════════╝
        """)

    @staticmethod
    def print_kubernetes_setup():
        """Print Kubernetes setup instructions"""
        print("""
╔════════════════════════════════════════════════════════════════════╗
║         KUBERNETES SETUP INSTRUCTIONS                              ║
╚════════════════════════════════════════════════════════════════════╝

📋 STEP 1: Prerequisites
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Required tools:
  - kubectl (configured with cluster access)
  - helm (optional but recommended)

Check configuration:
$ kubectl config current-context
$ kubectl get nodes


📋 STEP 2: Create Namespace and Secrets
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$ kubectl create namespace ultrarslanoglu

$ kubectl create secret generic api-gateway-secrets \\
  --from-literal=JWT_SECRET=your-secret \\
  --from-literal=MONGODB_URI=mongodb://... \\
  -n ultrarslanoglu


📋 STEP 3: Deploy Infrastructure
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Deploy all resources:
$ kubectl apply -f k8s/

Or deploy individual components:
$ kubectl apply -f k8s/01-api-gateway.yaml
$ kubectl apply -f k8s/02-mongodb.yaml
$ kubectl apply -f k8s/03-redis.yaml
$ kubectl apply -f k8s/04-networking.yaml
$ kubectl apply -f k8s/05-monitoring.yaml


📋 STEP 4: Verify Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Check pod status:
$ kubectl get pods -n ultrarslanoglu

Wait for rollout:
$ kubectl rollout status deployment/api-gateway -n ultrarslanoglu

View logs:
$ kubectl logs -f deployment/api-gateway -n ultrarslanoglu

Port forward (testing):
$ kubectl port-forward service/api-gateway 5000:5000 -n ultrarslanoglu


📋 STEP 5: Configure Ingress
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Update DNS records to point to ingress IP:
$ kubectl get ingress -n ultrarslanoglu

Update k8s/04-networking.yaml with your domain


📋 STEP 6: Setup SSL/TLS (cert-manager)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Install cert-manager (if not installed):
$ helm repo add jetstack https://charts.jetstack.io
$ helm install cert-manager jetstack/cert-manager \\
  --namespace cert-manager --create-namespace

Verify SSL setup:
$ kubectl get certificate -n ultrarslanoglu


📋 STEP 7: Common Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Scale deployment:
$ kubectl scale deployment api-gateway --replicas=5 -n ultrarslanoglu

Update image:
$ kubectl set image deployment/api-gateway \\
  api-gateway=docker.io/ultrarslanoglu/api-gateway:v2.1.0 \\
  -n ultrarslanoglu

Delete namespace (cleanup):
$ kubectl delete namespace ultrarslanoglu

View resource usage:
$ kubectl top nodes
$ kubectl top pods -n ultrarslanoglu

╚════════════════════════════════════════════════════════════════════╝
        """)


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("""
Usage: python setup-config.py <command>

Commands:
  validate <env>          - Validate .env file
  generate-secrets <env>  - Generate random secrets
  docker-guide            - Print Docker setup guide
  k8s-guide              - Print Kubernetes setup guide
  check-all              - Validate all .env files

Examples:
  python setup-config.py validate development
  python setup-config.py validate production
  python setup-config.py generate-secrets production
  python setup-config.py check-all
        """)
        return

    command = sys.argv[1]

    if command == "validate":
        env = sys.argv[2] if len(sys.argv) > 2 else "development"
        env_file = f".env.{env}"
        ConfigValidator.print_validation_report(env_file, env)

    elif command == "generate-secrets":
        env = sys.argv[2] if len(sys.argv) > 2 else "development"
        ConfigGenerator.print_generated_secrets(env)

    elif command == "docker-guide":
        SetupGuide.print_docker_setup()

    elif command == "k8s-guide":
        SetupGuide.print_kubernetes_setup()

    elif command == "check-all":
        for env in ["development", "testing", "production"]:
            ConfigValidator.print_validation_report(f".env.{env}", env)

    else:
        print(f"Unknown command: {command}")


if __name__ == "__main__":
    main()

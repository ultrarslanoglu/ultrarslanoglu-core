# Deployment Guide - Galatasaray Analytics

## 🚀 Üretim Ortamına Dağıtma

### Seçenek 1: Azure App Service

#### Adım 1: Uygulamayı Hazırla
```bash
# Azure CLI'yi yükle
# https://learn.microsoft.com/cli/azure/install-azure-cli

# Login yap
az login

# Resource Group oluştur (varsa atla)
az group create --name galatasaray-rg --location eastus
```

#### Adım 2: App Service Planı Oluştur
```bash
az appservice plan create \
  --name galatasaray-plan \
  --resource-group galatasaray-rg \
  --sku B2 --is-linux
```

#### Adım 3: Web App Oluştur
```bash
az webapp create \
  --resource-group galatasaray-rg \
  --plan galatasaray-plan \
  --name gs-analytics-app \
  --runtime "PYTHON|3.11"
```

#### Adım 4: Kod Deploy Et
```bash
# GitHub'dan deploy (varsa)
az webapp deployment github-actions add \
  --repo-url https://github.com/youruser/ultrarslanoglu-core \
  --resource-group galatasaray-rg \
  --name gs-analytics-app \
  --runtime python

# Veya ZIP ile
zip -r app.zip .
az webapp deployment source config-zip \
  --resource-group galatasaray-rg \
  --name gs-analytics-app \
  --src-path app.zip
```

#### Adım 5: Environment Variables Ayarla
```bash
az webapp config appsettings set \
  --name gs-analytics-app \
  --resource-group galatasaray-rg \
  --settings \
    FLASK_ENV=production \
    USE_COSMOS_DB=true \
    COSMOS_ENDPOINT="https://your-cosmos.documents.azure.com:443/" \
    COSMOS_KEY="your-cosmos-key" \
    TWITTER_BEARER_TOKEN="your-token" \
    META_ACCESS_TOKEN="your-token" \
    YOUTUBE_API_KEY="your-key"
```

#### Adım 6: Cosmos DB Oluştur
```bash
az cosmosdb create \
  --resource-group galatasaray-rg \
  --name galatasaray-cosmos \
  --kind GlobalDocumentDB \
  --enable-free-tier
```

#### Adım 7: Kontrol Et
```bash
# App URL'sini al
az webapp show --resource-group galatasaray-rg \
  --name gs-analytics-app --query defaultHostName

# Test et
curl https://gs-analytics-app.azurewebsites.net/health
```

---

### Seçenek 2: Docker Container (ACI)

#### Adım 1: Docker Image Oluştur
```bash
docker build -t gs-analytics:latest .
```

#### Adım 2: Azure Container Registry'ye Push Et
```bash
# Registry oluştur (varsa atla)
az acr create \
  --resource-group galatasaray-rg \
  --name gsanalyticsacr \
  --sku Basic

# Login yap
az acr login --name gsanalyticsacr

# Tag ve Push
docker tag gs-analytics:latest \
  gsanalyticsacr.azurecr.io/gs-analytics:latest

docker push gsanalyticsacr.azurecr.io/gs-analytics:latest
```

#### Adım 3: Container Instance Oluştur
```bash
az container create \
  --resource-group galatasaray-rg \
  --name gs-analytics-container \
  --image gsanalyticsacr.azurecr.io/gs-analytics:latest \
  --registry-login-server gsanalyticsacr.azurecr.io \
  --registry-username <username> \
  --registry-password <password> \
  --cpu 2 \
  --memory 2 \
  --ports 5002 \
  --environment-variables \
    FLASK_ENV=production \
    USE_COSMOS_DB=true \
    COSMOS_ENDPOINT="https://your-cosmos.documents.azure.com:443/" \
    COSMOS_KEY="your-key" \
  --dns-name-label gs-analytics
```

#### Kontrol Et
```bash
az container show \
  --resource-group galatasaray-rg \
  --name gs-analytics-container \
  --query ipAddress.fqdn

# FQDN'ye erişim
curl http://gs-analytics.<region>.azurecontainer.io:5002/health
```

---

### Seçenek 3: Kubernetes (AKS)

#### Adım 1: AKS Cluster Oluştur
```bash
az aks create \
  --resource-group galatasaray-rg \
  --name gs-analytics-aks \
  --node-count 2 \
  --enable-managed-identity \
  --network-plugin azure
```

#### Adım 2: kubectl Bağlantısını Konfigure Et
```bash
az aks get-credentials \
  --resource-group galatasaray-rg \
  --name gs-analytics-aks
```

#### Adım 3: Deployment YAML'ı Oluştur
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gs-analytics
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gs-analytics
  template:
    metadata:
      labels:
        app: gs-analytics
    spec:
      containers:
      - name: gs-analytics
        image: gsanalyticsacr.azurecr.io/gs-analytics:latest
        ports:
        - containerPort: 5002
        env:
        - name: FLASK_ENV
          value: "production"
        - name: USE_COSMOS_DB
          value: "true"
        - name: COSMOS_ENDPOINT
          valueFrom:
            secretKeyRef:
              name: cosmos-secret
              key: endpoint
        - name: COSMOS_KEY
          valueFrom:
            secretKeyRef:
              name: cosmos-secret
              key: key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5002
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: gs-analytics-service
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 5002
  selector:
    app: gs-analytics
```

#### Adım 4: Deploy Et
```bash
# Secret oluştur
kubectl create secret generic cosmos-secret \
  --from-literal=endpoint="https://your-cosmos.documents.azure.com:443/" \
  --from-literal=key="your-key"

# Deployment yap
kubectl apply -f deployment.yaml

# Kontrol et
kubectl get pods
kubectl get service gs-analytics-service
```

---

## 🔐 Güvenlik Ayarları

### 1. Environment Variables Yönetimi
```bash
# Azure Key Vault oluştur
az keyvault create \
  --resource-group galatasaray-rg \
  --name gsanalyticskeyvault

# Secrets ekle
az keyvault secret set \
  --vault-name gsanalyticskeyvault \
  --name twitter-bearer-token \
  --value "your-token"

# App Service'e Key Vault access ver
az webapp identity assign \
  --resource-group galatasaray-rg \
  --name gs-analytics-app

az keyvault set-policy \
  --name gsanalyticskeyvault \
  --object-id <app-identity-id> \
  --secret-permissions get list
```

### 2. Network Security
```bash
# Virtual Network oluştur
az network vnet create \
  --resource-group galatasaray-rg \
  --name gs-vnet \
  --subnet-name gs-subnet

# NSG Rules ekle
az network nsg rule create \
  --resource-group galatasaray-rg \
  --nsg-name gs-nsg \
  --name allow-https \
  --priority 100 \
  --source-address-prefixes '*' \
  --destination-address-prefixes '*' \
  --destination-port-ranges 443 \
  --access Allow \
  --protocol Tcp
```

### 3. API Rate Limiting
```python
# main.py'de
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/api/collect')
@limiter.limit("10 per hour")
def collect_data():
    # ...
```

---

## 📊 Monitoring ve Logging

### Application Insights ile Monitoring
```bash
# Application Insights oluştur
az monitor app-insights component create \
  --app gs-analytics-insights \
  --location eastus \
  --resource-group galatasaray-rg

# App Service'e bağla
az webapp config appsettings set \
  --name gs-analytics-app \
  --resource-group galatasaray-rg \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY="your-key" \
    ApplicationInsightsAgent_EXTENSION_VERSION="~3"
```

### Log Analytics
```python
# main.py'de
from azure.monitor.opentelemetry import configure_azure_monitor

configure_azure_monitor()

logger.info("Application started")
```

### Alertler Oluştur
```bash
# CPU alert
az monitor metrics alert create \
  --name high-cpu \
  --resource-group galatasaray-rg \
  --scopes /subscriptions/{subscription}/resourceGroups/galatasaray-rg/providers/Microsoft.Web/sites/gs-analytics-app \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m \
  --evaluation-frequency 1m

# Downtime alert
az monitor metrics alert create \
  --name app-down \
  --resource-group galatasaray-rg \
  --scopes /subscriptions/{subscription}/resourceGroups/galatasaray-rg/providers/Microsoft.Web/sites/gs-analytics-app \
  --condition "total AvailabilityScore < 100" \
  --window-size 5m \
  --evaluation-frequency 1m
```

---

## 🔄 Continuous Deployment

### GitHub Actions Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt

    - name: Run tests
      run: |
        pytest tests/

    - name: Build and push Docker image
      uses: docker/build-push-action@v2
      with:
        context: .
        push: true
        registry: gsanalyticsacr.azurecr.io
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
        tags: gs-analytics:${{ github.sha }}

    - name: Deploy to Azure
      run: |
        az login --service-principal \
          -u ${{ secrets.AZURE_CLIENT_ID }} \
          -p ${{ secrets.AZURE_CLIENT_SECRET }} \
          --tenant ${{ secrets.AZURE_TENANT_ID }}
        
        # Deployment commands
```

---

## 📈 Performance Tuning

### Veritabanı Optimizasyonu
```python
# Cosmos DB RU ayarlama
COSMOS_RU_THROUGHPUT = 400  # Başla, ihtiyaca göre arttır

# Index optimization
COSMOS_INDEXING_POLICY = {
    "indexing_mode": "consistent",
    "included_paths": [
        {"path": "/*"},
        {"path": "/platform/?"},
        {"path": "/created_at/?"}
    ]
}
```

### Caching Stratejisi
```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@app.route('/api/metrics')
@cache.cached(timeout=3600)  # 1 saat cache
def get_metrics():
    # ...
```

---

## 🚨 Backup ve Recovery

### Cosmos DB Backup
```bash
# Otomatik backup enable et
az cosmosdb show \
  --resource-group galatasaray-rg \
  --name galatasaray-cosmos \
  --query properties.backupPolicy
```

### Manual Backup
```bash
# MongoDB'yi dump et
docker exec gs-mongodb mongodump \
  --db galatasaray_analytics \
  --out /backup

# Restore et
docker exec gs-mongodb mongorestore \
  --db galatasaray_analytics \
  /backup/galatasaray_analytics
```

---

**🎉 Üretim ortamında canlı!**

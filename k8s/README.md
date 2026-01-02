# Kubernetes Deployment Guide

Bu rehber, Ultrarslanoglu-Core projesini Kubernetes cluster'ına deploy etmek için gerekli adımları içerir.

## 📋 Ön Koşullar

- `kubectl` kurulu ve configured
- Aktif Kubernetes cluster (AKS, GKE, EKS, minikube vb.)
- `helm` (opsiyonel ama önerilir)

## 🚀 Deployment Adımları

### 1. Namespace Oluştur
```bash
kubectl create namespace ultrarslanoglu
```

### 2. Secrets'ı Ayarla
```bash
# MongoDB credentials
kubectl create secret generic mongodb-secret \
  --from-literal=root-username=admin \
  --from-literal=root-password=YOUR_MONGODB_PASSWORD \
  -n ultrarslanoglu

# API Gateway secrets
kubectl create secret generic api-gateway-secrets \
  --from-literal=JWT_SECRET=YOUR_JWT_SECRET \
  --from-literal=MONGODB_URI=mongodb://admin:YOUR_PASSWORD@mongodb:27017/ultrarslanoglu?authSource=admin \
  --from-literal=REDIS_URL=redis://redis:6379/0 \
  --from-literal=GITHUB_TOKEN=YOUR_GITHUB_TOKEN \
  -n ultrarslanoglu
```

### 3. MongoDB Deploy Et
```bash
kubectl apply -f k8s/02-mongodb.yaml
kubectl rollout status deployment/mongodb -n ultrarslanoglu
```

### 4. Redis Deploy Et
```bash
kubectl apply -f k8s/03-redis.yaml
kubectl rollout status deployment/redis -n ultrarslanoglu
```

### 5. API Gateway Deploy Et
```bash
kubectl apply -f k8s/01-api-gateway.yaml
kubectl rollout status deployment/api-gateway -n ultrarslanoglu
```

### 6. Networking Ve Ingress Deploy Et
```bash
kubectl apply -f k8s/04-networking.yaml
```

### 7. Monitoring Deploy Et (Opsiyonel)
```bash
kubectl apply -f k8s/05-monitoring.yaml
```

## ✅ Verification

### Pod Durumu Kontrol Et
```bash
kubectl get pods -n ultrarslanoglu

# Beklenen output:
# NAME                            READY   STATUS    RESTARTS
# api-gateway-xxxxxxxxxx-xxxxx   1/1     Running   0
# mongodb-xxxxxxxxxx-xxxxx       1/1     Running   0
# redis-xxxxxxxxxx-xxxxx         1/1     Running   0
```

### Pod Logs'ları Görüntüle
```bash
# API Gateway logs
kubectl logs -f deployment/api-gateway -n ultrarslanoglu

# MongoDB logs
kubectl logs -f deployment/mongodb -n ultrarslanoglu

# Redis logs
kubectl logs -f deployment/redis -n ultrarslanoglu
```

### API Gateway'i Test Et
```bash
# Service IP'sini bul
kubectl get service api-gateway -n ultrarslanoglu

# Pod'a port-forward yap
kubectl port-forward service/api-gateway 5000:5000 -n ultrarslanoglu

# Test et
curl http://localhost:5000/health
```

## 📊 Monitoring

### Prometheus
```bash
kubectl port-forward service/prometheus 9090:9090 -n ultrarslanoglu
# http://localhost:9090 adresinde erişin
```

### Pod Durumunu Kontrol Et
```bash
kubectl describe pod <POD_NAME> -n ultrarslanoglu
```

## 🔄 Scaling

### Manual Scaling
```bash
# API Gateway replicas'ını 5'e çıkar
kubectl scale deployment api-gateway --replicas=5 -n ultrarslanoglu
```

### Horizontal Pod Autoscaling (Otomatik)
HPA zaten yapılandırılmış (min: 2, max: 10 replicas, %70 CPU threshold)

Durumunu görüntüle:
```bash
kubectl get hpa -n ultrarslanoglu
kubectl describe hpa api-gateway-hpa -n ultrarslanoglu
```

## 🔐 Security Best Practices

### Network Policies
Network policies zaten uygulanmış:
- API Gateway sadece MongoDB ve Redis'e erişebilir
- MongoDB sadece API Gateway'den bağlantı kabul eder
- Redis sadece API Gateway'den bağlantı kabul eder

Kontrol et:
```bash
kubectl get networkpolicies -n ultrarslanoglu
```

### Pod Security
```bash
# Pod security standards'ı kontrol et
kubectl label namespace ultrarslanoglu pod-security.kubernetes.io/enforce=restricted
```

## 🔄 Updates ve Deployments

### Yeni Image Versiyonu Deploy Et
```bash
kubectl set image deployment/api-gateway \
  api-gateway=docker.io/ultrarslanoglu/api-gateway:v2.1.0 \
  -n ultrarslanoglu

# Rollout durumunu izle
kubectl rollout status deployment/api-gateway -n ultrarslanoglu
```

### Önceki Versiyona Dön (Rollback)
```bash
kubectl rollout undo deployment/api-gateway -n ultrarslanoglu
```

### Rollout Geçmişini Görüntüle
```bash
kubectl rollout history deployment/api-gateway -n ultrarslanoglu
```

## 🐛 Troubleshooting

### Pod Başlamıyor
```bash
# Detaylı event'leri görüntüle
kubectl describe pod <POD_NAME> -n ultrarslanoglu

# Pod içindeki logs'a bak
kubectl logs <POD_NAME> -n ultrarslanoglu
```

### Database Bağlantı Hatası
```bash
# MongoDB erişilebiliyor mu?
kubectl exec -it deployment/api-gateway -n ultrarslanoglu \
  -- mongosh "mongodb://admin:PASSWORD@mongodb:27017/ultrarslanoglu?authSource=admin"

# Redis erişilebiliyor mu?
kubectl exec -it deployment/api-gateway -n ultrarslanoglu \
  -- redis-cli -h redis ping
```

### Resource Sorunları
```bash
# Node resources'ları görüntüle
kubectl top nodes

# Pod resource usage'ını görüntüle
kubectl top pods -n ultrarslanoglu
```

## 📈 Performance Tuning

### Resource Limits'i Ayarla
```yaml
# k8s/01-api-gateway.yaml içinde
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Replica Count'ı Ayarla
```bash
# Spec.replicas'ı değiştir
kubectl patch deployment api-gateway -p '{"spec":{"replicas":5}}' -n ultrarslanoglu
```

## 🗑️ Cleanup

Tüm resources'ları sil:
```bash
kubectl delete namespace ultrarslanoglu
```

Sadece deployment'i sil (data korunur):
```bash
kubectl delete deployment api-gateway -n ultrarslanoglu
```

## 📞 Destek

Sorun yaşarsanız:
1. Logs'ları kontrol edin: `kubectl logs -f <POD_NAME> -n ultrarslanoglu`
2. Pod durumunu kontrol edin: `kubectl describe pod <POD_NAME> -n ultrarslanoglu`
3. Events'leri kontrol edin: `kubectl get events -n ultrarslanoglu`

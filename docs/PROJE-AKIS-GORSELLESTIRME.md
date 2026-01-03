# 🎯 ULTRARSLANOGLU CORE - SİSTEM AKIŞI VE MİMARİ

**Tarih**: 3 Ocak 2026  
**Version**: 3.0.0 (Monorepo)

---

## 🏗️ 1. SİSTEM MİMARİSİ

```mermaid
graph TB
    subgraph "🌐 Frontend Layer"
        WEB[🎨 Website<br/>Next.js 14<br/>Port: 3001]
        MOBILE[📱 Mobile App<br/>React Native<br/>Coming Soon]
    end

    subgraph "🚪 API Gateway Layer"
        GATEWAY[🚀 API Gateway<br/>Flask + Python<br/>Port: 5000]
    end

    subgraph "⚡ Microservices"
        VIDEO[🎬 Video Service<br/>AI Editor + Pipeline]
        ANALYTICS[📊 Analytics Service<br/>Dashboard + Reports]
        AUTOMATION[🤖 Automation Service<br/>Social Media Tools]
        AUTH[🔐 Auth Service<br/>JWT + OAuth]
        CONTENT[📝 Content Service<br/>CMS + Scheduler]
    end

    subgraph "💾 Data Layer"
        MONGO[(🍃 MongoDB<br/>Port: 27017)]
        REDIS[(🔴 Redis<br/>Port: 6379)]
        POSTGRES[(🐘 PostgreSQL<br/>Port: 5432)]
    end

    subgraph "🔧 Background Jobs"
        CELERY[⚙️ Celery Workers<br/>Async Tasks]
        QUEUE[📬 Task Queue<br/>Redis]
    end

    subgraph "🤖 AI/ML Layer"
        OLLAMA[🧠 Ollama<br/>Gemma 3 + Embeddings]
        PYTORCH[🔥 PyTorch<br/>Video Processing]
    end

    subgraph "☁️ External Services"
        GITHUB[GitHub API]
        GOOGLE[Google AI]
        SOCIAL[Social Media APIs]
        CLOUD[Cloud Storage]
    end

    WEB --> GATEWAY
    MOBILE --> GATEWAY
    GATEWAY --> VIDEO
    GATEWAY --> ANALYTICS
    GATEWAY --> AUTOMATION
    GATEWAY --> AUTH
    GATEWAY --> CONTENT

    VIDEO --> MONGO
    VIDEO --> REDIS
    VIDEO --> PYTORCH
    ANALYTICS --> POSTGRES
    ANALYTICS --> MONGO
    AUTOMATION --> REDIS
    AUTOMATION --> SOCIAL
    AUTH --> POSTGRES
    CONTENT --> MONGO

    VIDEO --> CELERY
    AUTOMATION --> CELERY
    CONTENT --> CELERY
    CELERY --> QUEUE
    QUEUE --> REDIS

    VIDEO --> OLLAMA
    ANALYTICS --> OLLAMA
    CONTENT --> OLLAMA

    GATEWAY --> GITHUB
    GATEWAY --> GOOGLE
    AUTOMATION --> CLOUD

    style WEB fill:#FFD700,stroke:#8B0000,stroke-width:3px,color:#000
    style GATEWAY fill:#8B0000,stroke:#FFD700,stroke-width:3px,color:#fff
    style VIDEO fill:#4169E1,stroke:#000,stroke-width:2px,color:#fff
    style ANALYTICS fill:#32CD32,stroke:#000,stroke-width:2px,color:#fff
    style AUTOMATION fill:#FF6347,stroke:#000,stroke-width:2px,color:#fff
    style MONGO fill:#4DB33D,stroke:#000,stroke-width:2px,color:#fff
    style REDIS fill:#DC382D,stroke:#000,stroke-width:2px,color:#fff
    style OLLAMA fill:#9370DB,stroke:#000,stroke-width:2px,color:#fff
```

---

## 🔄 2. KULLANICI ANA AKIŞI (USER JOURNEY)

```mermaid
journey
    title Ultrarslanoglu Kullanıcı Deneyimi
    section Giriş
      Website'e giriş: 5: Kullanıcı
      Anasayfa görüntüleme: 5: Kullanıcı
      Login/Register: 4: Kullanıcı, Auth Service
    section Dashboard
      Dashboard açılışı: 5: Kullanıcı
      Projeleri görüntüleme: 5: Kullanıcı, API Gateway
      Analytics'i kontrol etme: 5: Kullanıcı, Analytics Service
    section Video İşleme
      Video yükleme: 4: Kullanıcı
      AI processing başlatma: 5: API Gateway, Video Service
      İşlem bekletme: 3: Celery, Background
      Sonuç görüntüleme: 5: Kullanıcı
    section Otomasyon
      Sosyal medya bağlama: 4: Kullanıcı, Auth
      İçerik zamanlama: 5: Kullanıcı, Content Service
      Otomatik paylaşım: 5: Automation Service, External APIs
    section Analitik
      Performans görme: 5: Kullanıcı, Analytics
      Rapor oluşturma: 4: Analytics Service
      Export/İndirme: 5: Kullanıcı
```

---

## 📹 3. VİDEO İŞLEME AKIŞI

```mermaid
sequenceDiagram
    participant U as 👤 Kullanıcı
    participant W as 🎨 Website
    participant G as 🚀 API Gateway
    participant V as 🎬 Video Service
    participant C as ⚙️ Celery Worker
    participant AI as 🧠 AI/ML
    participant S as ☁️ Cloud Storage
    participant DB as 💾 MongoDB

    U->>W: Video yükle
    W->>G: POST /api/video/upload
    G->>V: Video validate
    V->>DB: Video metadata kaydet
    V->>S: Raw video upload
    V->>C: Async processing task
    C->>AI: Video analizi (Gemma3)
    AI-->>C: Sahne tespiti, kesimler
    C->>AI: PyTorch ile işleme
    AI-->>C: Optimized video
    C->>S: Processed video upload
    C->>DB: Status güncelle (completed)
    C->>G: Webhook notification
    G->>W: Push notification
    W->>U: ✅ Video hazır!
    U->>W: Preview/Download
    W->>S: Get video URL
    S-->>W: Video stream
    W-->>U: Video oynat
```

---

## 🤖 4. SOSYAL MEDYA OTOMASYON AKIŞI

```mermaid
flowchart TD
    START([👤 Kullanıcı<br/>İçerik Oluştur])
    
    START --> CREATE[📝 Content Service<br/>İçerik + Medya]
    CREATE --> SCHEDULE{⏰ Zamanlama?}
    
    SCHEDULE -->|Hemen| PUBLISH1[🚀 Automation Service]
    SCHEDULE -->|Planlı| CELERY1[⚙️ Celery Task<br/>Scheduled]
    
    CELERY1 --> WAIT[⏳ Zamanı Bekle]
    WAIT --> PUBLISH2[🚀 Automation Service]
    
    PUBLISH1 --> MULTI{📱 Platform Seçimi}
    PUBLISH2 --> MULTI
    
    MULTI -->|Instagram| INSTA[📷 Instagram API]
    MULTI -->|Twitter| TWITTER[🐦 Twitter API]
    MULTI -->|Facebook| FB[👥 Facebook API]
    MULTI -->|LinkedIn| LI[💼 LinkedIn API]
    
    INSTA --> RESULT1[✅ Published]
    TWITTER --> RESULT2[✅ Published]
    FB --> RESULT3[✅ Published]
    LI --> RESULT4[✅ Published]
    
    RESULT1 --> ANALYTICS[📊 Analytics Service]
    RESULT2 --> ANALYTICS
    RESULT3 --> ANALYTICS
    RESULT4 --> ANALYTICS
    
    ANALYTICS --> TRACK[📈 Performance Tracking]
    TRACK --> NOTIFY[🔔 User Notification]
    NOTIFY --> END([✅ Tamamlandı])
    
    style START fill:#FFD700,stroke:#8B0000,stroke-width:3px,color:#000
    style PUBLISH1 fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
    style PUBLISH2 fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
    style ANALYTICS fill:#32CD32,stroke:#000,stroke-width:2px,color:#fff
    style END fill:#FFD700,stroke:#8B0000,stroke-width:3px,color:#000
```

---

## 📊 5. ANALİTİK VE RAPORLAMA AKIŞI

```mermaid
graph LR
    subgraph "📥 Data Collection"
        SM[Social Media APIs]
        GA[Google Analytics]
        WEB[Website Events]
        API[API Logs]
    end

    subgraph "🔄 Data Processing"
        COLLECT[Data Collector]
        TRANSFORM[ETL Pipeline]
        AGGREGATE[Aggregator]
    end

    subgraph "💾 Storage"
        PG[(PostgreSQL<br/>Time-series)]
        MONGO[(MongoDB<br/>Documents)]
        REDIS[(Redis<br/>Cache)]
    end

    subgraph "🧠 Analysis"
        ML[ML Models<br/>Predictions]
        STATS[Statistics<br/>Engine]
        TREND[Trend Analysis]
    end

    subgraph "📊 Visualization"
        DASH[Dashboard<br/>Real-time]
        REPORTS[Report Generator]
        EXPORT[Export Service]
    end

    subgraph "👤 User"
        BROWSER[Web Browser]
        MOBILE[Mobile App]
    end

    SM --> COLLECT
    GA --> COLLECT
    WEB --> COLLECT
    API --> COLLECT

    COLLECT --> TRANSFORM
    TRANSFORM --> AGGREGATE

    AGGREGATE --> PG
    AGGREGATE --> MONGO
    AGGREGATE --> REDIS

    PG --> ML
    PG --> STATS
    MONGO --> TREND

    ML --> DASH
    STATS --> DASH
    TREND --> DASH

    DASH --> BROWSER
    DASH --> MOBILE

    STATS --> REPORTS
    REPORTS --> EXPORT
    EXPORT --> BROWSER

    style DASH fill:#FFD700,stroke:#8B0000,stroke-width:3px,color:#000
    style COLLECT fill:#4169E1,stroke:#000,stroke-width:2px,color:#fff
    style ML fill:#9370DB,stroke:#000,stroke-width:2px,color:#fff
```

---

## 🔐 6. KİMLİK DOĞRULAMA AKIŞI

```mermaid
sequenceDiagram
    participant U as 👤 Kullanıcı
    participant W as 🎨 Website
    participant G as 🚀 API Gateway
    participant A as 🔐 Auth Service
    participant DB as 💾 PostgreSQL
    participant R as 🔴 Redis
    participant EXT as 🌐 OAuth Provider

    rect rgb(255, 215, 0, 0.2)
        Note over U,EXT: Login Akışı
        U->>W: Login formu doldur
        W->>G: POST /api/auth/login
        G->>A: Credentials validate
        A->>DB: User sorgu
        DB-->>A: User data
        A->>A: Password verify (bcrypt)
        A->>A: JWT token oluştur
        A->>R: Session kaydet (24h TTL)
        A-->>G: {token, user}
        G-->>W: Set-Cookie + User data
        W-->>U: ✅ Dashboard'a yönlendir
    end

    rect rgb(135, 206, 250, 0.2)
        Note over U,EXT: OAuth Login (Google/GitHub)
        U->>W: "Google ile giriş"
        W->>G: /api/auth/oauth/google
        G->>EXT: OAuth redirect
        EXT-->>U: Consent screen
        U->>EXT: Approve
        EXT->>G: Callback + code
        G->>A: Exchange code for token
        A->>EXT: Get user info
        EXT-->>A: User profile
        A->>DB: User lookup/create
        A->>A: JWT token oluştur
        A->>R: Session kaydet
        A-->>G: {token, user}
        G-->>W: Set-Cookie
        W-->>U: ✅ Dashboard'a yönlendir
    end

    rect rgb(255, 182, 193, 0.2)
        Note over U,R: Token Refresh
        U->>W: API request (token expired)
        W->>G: Refresh token ile istek
        G->>A: Validate refresh token
        A->>R: Session kontrol
        R-->>A: Valid session
        A->>A: New access token
        A-->>G: New token
        G-->>W: Set-Cookie
        W->>W: Retry original request
        W-->>U: ✅ Success
    end
```

---

## 🏃 7. CELERY BACKGROUND JOB AKIŞI

```mermaid
graph TB
    subgraph "🎯 Task Triggers"
        API[API Request]
        SCHED[Scheduled Job]
        EVENT[System Event]
        WEBHOOK[External Webhook]
    end

    subgraph "📬 Task Queue"
        REDIS_Q[(Redis Queue)]
        PRIORITY{Priority<br/>Level}
    end

    subgraph "⚙️ Celery Workers"
        W1[Worker 1<br/>Video Tasks]
        W2[Worker 2<br/>API Tasks]
        W3[Worker 3<br/>Analytics]
        W4[Worker 4<br/>General]
    end

    subgraph "📊 Task Processing"
        VIDEO_TASK[🎬 Video Processing]
        API_TASK[🔄 API Calls]
        ANALYTICS_TASK[📈 Data Aggregation]
        EMAIL_TASK[📧 Email Sending]
        SOCIAL_TASK[📱 Social Posting]
    end

    subgraph "💾 State Management"
        REDIS_STATE[(Redis State)]
        MONGO_LOG[(MongoDB Logs)]
    end

    subgraph "🔔 Notifications"
        WEBHOOK_OUT[Webhook Callback]
        PUSH[Push Notification]
        EMAIL[Email Alert]
    end

    API --> REDIS_Q
    SCHED --> REDIS_Q
    EVENT --> REDIS_Q
    WEBHOOK --> REDIS_Q

    REDIS_Q --> PRIORITY
    PRIORITY -->|High| W1
    PRIORITY -->|Medium| W2
    PRIORITY -->|Medium| W3
    PRIORITY -->|Low| W4

    W1 --> VIDEO_TASK
    W2 --> API_TASK
    W3 --> ANALYTICS_TASK
    W4 --> EMAIL_TASK
    W4 --> SOCIAL_TASK

    VIDEO_TASK --> REDIS_STATE
    API_TASK --> REDIS_STATE
    ANALYTICS_TASK --> REDIS_STATE

    VIDEO_TASK --> MONGO_LOG
    API_TASK --> MONGO_LOG
    ANALYTICS_TASK --> MONGO_LOG

    VIDEO_TASK --> WEBHOOK_OUT
    API_TASK --> PUSH
    SOCIAL_TASK --> EMAIL

    style VIDEO_TASK fill:#4169E1,stroke:#000,stroke-width:2px,color:#fff
    style REDIS_Q fill:#DC382D,stroke:#000,stroke-width:2px,color:#fff
    style W1 fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
    style W2 fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
    style W3 fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
    style W4 fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
```

---

## 🌊 8. FULL DATA FLOW (BAŞTAN SONA)

```mermaid
graph TB
    START([👤 Kullanıcı<br/>Website Açar])
    
    START --> LOAD[🎨 Next.js SSR<br/>Initial Load]
    LOAD --> AUTH_CHECK{🔐 Auth?}
    
    AUTH_CHECK -->|No| PUBLIC[📄 Public Pages<br/>Landing, Login]
    AUTH_CHECK -->|Yes| DASH[📊 Dashboard]
    
    PUBLIC --> LOGIN[🔑 Login]
    LOGIN --> AUTH_API[🚀 API Gateway<br/>/auth/login]
    AUTH_API --> TOKEN[🎫 JWT Token]
    TOKEN --> DASH
    
    DASH --> MENU{📋 Menu Seçimi}
    
    MENU -->|Video| VIDEO_UI[🎬 Video Page]
    MENU -->|Analytics| ANALYTICS_UI[📊 Analytics Page]
    MENU -->|Social| SOCIAL_UI[📱 Social Page]
    MENU -->|Content| CONTENT_UI[📝 Content Page]
    
    VIDEO_UI --> UPLOAD[⬆️ Video Upload]
    UPLOAD --> VIDEO_API[🚀 API: /video/upload]
    VIDEO_API --> STORAGE[☁️ Cloud Storage]
    VIDEO_API --> CELERY_V[⚙️ Celery: process_video]
    CELERY_V --> AI_PROCESS[🧠 AI Processing<br/>Gemma3 + PyTorch]
    AI_PROCESS --> VIDEO_DONE[✅ Video Ready]
    VIDEO_DONE --> NOTIFY[🔔 Notify User]
    
    ANALYTICS_UI --> FETCH_DATA[📥 Fetch Analytics]
    FETCH_DATA --> ANALYTICS_API[🚀 API: /analytics]
    ANALYTICS_API --> POSTGRES[(🐘 PostgreSQL)]
    POSTGRES --> COMPUTE[🔢 Compute Metrics]
    COMPUTE --> CHARTS[📈 Generate Charts]
    CHARTS --> RENDER[🎨 Render Dashboard]
    
    SOCIAL_UI --> CONNECT[🔗 Connect Accounts]
    CONNECT --> OAUTH[🌐 OAuth Flow]
    OAUTH --> SAVE_TOKEN[💾 Save Tokens]
    SAVE_TOKEN --> POST_UI[✍️ Create Post]
    POST_UI --> SCHEDULE{⏰ Schedule?}
    SCHEDULE -->|Now| POST_NOW[📤 Post Now]
    SCHEDULE -->|Later| POST_LATER[📅 Schedule Task]
    POST_NOW --> SOCIAL_API[🚀 API: /social/post]
    POST_LATER --> CELERY_S[⚙️ Celery: scheduled_post]
    SOCIAL_API --> PLATFORMS[📱 Social Platforms]
    CELERY_S --> PLATFORMS
    PLATFORMS --> TRACK[📊 Track Performance]
    
    CONTENT_UI --> CMS[📝 Content Management]
    CMS --> CREATE_CONTENT[✍️ Create Content]
    CREATE_CONTENT --> SAVE_MONGO[(🍃 MongoDB)]
    SAVE_MONGO --> PUBLISH{🚀 Publish?}
    PUBLISH -->|Yes| LIVE[🌐 Content Live]
    PUBLISH -->|No| DRAFT[📄 Save as Draft]
    
    NOTIFY --> REFRESH[🔄 Refresh UI]
    RENDER --> DISPLAY[👁️ Display to User]
    TRACK --> REFRESH
    LIVE --> REFRESH
    DRAFT --> REFRESH
    
    REFRESH --> DASH
    DISPLAY --> DASH
    
    style START fill:#FFD700,stroke:#8B0000,stroke-width:4px,color:#000
    style DASH fill:#FFD700,stroke:#8B0000,stroke-width:3px,color:#000
    style VIDEO_API fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
    style ANALYTICS_API fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
    style SOCIAL_API fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
    style AI_PROCESS fill:#9370DB,stroke:#000,stroke-width:2px,color:#fff
    style PLATFORMS fill:#32CD32,stroke:#000,stroke-width:2px,color:#fff
```

---

## 🚀 9. DEPLOYMENT PIPELINE

```mermaid
graph LR
    subgraph "💻 Development"
        CODE[👨‍💻 Code<br/>Local Dev]
        GIT[📝 Git Commit]
        PUSH[⬆️ Git Push]
    end

    subgraph "🔄 CI/CD Pipeline"
        TRIGGER[⚡ GitHub Actions<br/>Trigger]
        BUILD[🔨 Build<br/>Docker Images]
        TEST[🧪 Run Tests<br/>Unit + Integration]
        LINT[✅ Linting<br/>ESLint + Black]
        SCAN[🔒 Security Scan<br/>Trivy]
    end

    subgraph "📦 Registry"
        DOCKER[🐳 Docker Hub<br/>or GHCR]
    end

    subgraph "☁️ Deployment"
        K8S[☸️ Kubernetes<br/>Production]
        HELM[⚓ Helm Charts]
        MONITOR[📊 Monitoring<br/>Prometheus]
    end

    subgraph "🔔 Notifications"
        SLACK[💬 Slack]
        EMAIL2[📧 Email]
        DISCORD[🎮 Discord]
    end

    CODE --> GIT
    GIT --> PUSH
    PUSH --> TRIGGER

    TRIGGER --> BUILD
    BUILD --> TEST
    TEST --> LINT
    LINT --> SCAN

    SCAN -->|✅ Pass| DOCKER
    SCAN -->|❌ Fail| SLACK

    DOCKER --> K8S
    K8S --> HELM
    HELM --> MONITOR

    K8S --> SLACK
    K8S --> EMAIL2
    K8S --> DISCORD

    style BUILD fill:#4169E1,stroke:#000,stroke-width:2px,color:#fff
    style TEST fill:#32CD32,stroke:#000,stroke-width:2px,color:#fff
    style K8S fill:#326CE5,stroke:#000,stroke-width:2px,color:#fff
    style DOCKER fill:#2496ED,stroke:#000,stroke-width:2px,color:#fff
```

---

## 📱 10. MOBİL APP AKIŞI (Gelecek)

```mermaid
graph TB
    subgraph "📱 Mobile Clients"
        IOS[🍎 iOS App<br/>React Native]
        ANDROID[🤖 Android App<br/>React Native]
    end

    subgraph "🔄 Sync Layer"
        SYNC[🔄 Sync Service]
        OFFLINE[💾 Offline Storage]
    end

    subgraph "🚀 Backend"
        GATEWAY2[🚀 API Gateway]
        PUSH_SVC[🔔 Push Service]
    end

    subgraph "🔔 Notifications"
        FCM[Firebase Cloud<br/>Messaging]
        APNS[Apple Push<br/>Notification]
    end

    IOS --> SYNC
    ANDROID --> SYNC
    
    SYNC --> OFFLINE
    SYNC --> GATEWAY2
    
    GATEWAY2 --> PUSH_SVC
    
    PUSH_SVC --> FCM
    PUSH_SVC --> APNS
    
    FCM --> ANDROID
    APNS --> IOS
    
    style IOS fill:#FFD700,stroke:#8B0000,stroke-width:2px,color:#000
    style ANDROID fill:#FFD700,stroke:#8B0000,stroke-width:2px,color:#000
    style GATEWAY2 fill:#8B0000,stroke:#FFD700,stroke-width:2px,color:#fff
```

---

## 🎯 ÖZET: ANA AKIŞ ÇİZELGESİ

```mermaid
mindmap
  root((🏆 Ultrarslanoglu<br/>Core Platform))
    🎨 Frontend
      Next.js Website
      React Native Mobile
      Tailwind CSS
      TypeScript
    🚀 Backend
      API Gateway Flask
      Microservices
      JWT Auth
      RESTful APIs
    💾 Databases
      MongoDB Documents
      PostgreSQL Relations
      Redis Cache
    ⚙️ Processing
      Celery Workers
      Background Jobs
      Async Tasks
      Scheduled Jobs
    🧠 AI/ML
      Ollama Gemma3
      PyTorch Video
      OpenAI APIs
      Embeddings
    📊 Analytics
      Real-time Dashboard
      Performance Metrics
      Trend Analysis
      Reports
    🤖 Automation
      Social Media
      Content Scheduler
      Auto Posting
      Multi Platform
    🎬 Video
      AI Editor
      Processing Pipeline
      Cloud Storage
      Streaming
    🔐 Security
      JWT Tokens
      OAuth 2.0
      Rate Limiting
      CORS
    ☁️ DevOps
      Docker Containers
      Kubernetes K8s
      CI CD Pipeline
      Monitoring
```

---

## 📈 CURRENT STATUS vs FUTURE

| Bileşen | Status | Tamamlanma |
|---------|--------|------------|
| 🎨 **Website (Frontend)** | ✅ Çalışıyor | 95% |
| 🚀 **API Gateway** | 🟡 Kısmi | 70% |
| 💾 **Databases (All)** | ✅ Çalışıyor | 100% |
| ⚙️ **Celery Workers** | ✅ Çalışıyor | 90% |
| 🎬 **Video Service** | 🔴 Geliştirilecek | 40% |
| 📊 **Analytics Service** | 🔴 Geliştirilecek | 30% |
| 🤖 **Automation Service** | 🔴 Geliştirilecek | 20% |
| 🔐 **Auth Service** | 🟡 Temel var | 60% |
| 📝 **Content Service** | 🔴 Geliştirilecek | 15% |
| 🧠 **AI Integration** | 🟡 Hazır (Ollama) | 50% |
| 📱 **Mobile App** | 🔴 Planlanıyor | 0% |
| ☸️ **Kubernetes** | 🔴 Hazırlanıyor | 10% |

**Genel İlerleme**: 🟡 **~55% Tamamlandı**

---

*Görselleştirme oluşturuldu: 3 Ocak 2026*

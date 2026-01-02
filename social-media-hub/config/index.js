module.exports = {
  // Server
  port: process.env.PORT || 3000,
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  env: process.env.NODE_ENV || 'development',
  
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ultrarslanoglu_social',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // PostgreSQL (Points & Rewards)
  postgres: {
    connectionString: process.env.PG_CONNECTION_STRING,
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT, 10) || 5432,
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
    database: process.env.PG_DATABASE || 'ultrarslanoglu_points',
    ssl: process.env.PG_SSL === 'true'
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    options: {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    }
  },
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // TikTok
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    redirectUri: process.env.TIKTOK_REDIRECT_URI || `${process.env.BASE_URL}/auth/tiktok/callback`,
    scope: process.env.TIKTOK_SCOPE || 'user.info.basic,video.upload,video.publish,video.list',
    authorizationURL: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenURL: 'https://open.tiktokapis.com/v2/oauth/token/',
    apiBaseURL: 'https://open.tiktokapis.com/v2/',
    shareKitURL: 'https://www.tiktok.com/share'
  },
  
  // Meta (Facebook & Instagram)
  meta: {
    appId: process.env.META_APP_ID,
    appSecret: process.env.META_APP_SECRET,
    redirectUri: process.env.META_REDIRECT_URI || `${process.env.BASE_URL}/auth/meta/callback`,
    appDomain: process.env.META_APP_DOMAIN || 'ultrarslanoglu.com',
    scope: process.env.META_SCOPE || 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_insights',
    authorizationURL: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenURL: 'https://graph.facebook.com/v19.0/oauth/access_token',
    apiBaseURL: 'https://graph.facebook.com/v19.0/',
    apiVersion: 'v19.0'
  },
  
  // Google (YouTube)
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.BASE_URL}/auth/youtube/callback`,
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtubepartner'
    ],
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    apiBaseURL: 'https://www.googleapis.com/youtube/v3/'
  },
  
  // X (Twitter)
  x: {
    clientId: process.env.X_CLIENT_ID,
    clientSecret: process.env.X_CLIENT_SECRET,
    redirectUri: `${process.env.BASE_URL}/auth/x/callback`,
    scope: 'tweet.read tweet.write users.read offline.access',
    authorizationURL: 'https://twitter.com/i/oauth2/authorize',
    tokenURL: 'https://api.twitter.com/2/oauth2/token',
    apiBaseURL: 'https://api.twitter.com/2/'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Upload
  upload: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'image/jpeg',
      'image/png',
      'image/gif'
    ],
    tempPath: './uploads/temp',
    storagePath: './uploads/storage'
  },
  
  // AI Decision Engine
  ai: {
    endpoint: process.env.AI_MODEL_ENDPOINT || 'http://localhost:5000/predict',
    confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.75,
    timeout: 30000 // 30 seconds
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log'
  }
};

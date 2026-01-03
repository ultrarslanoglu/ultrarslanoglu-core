// User & Authentication Types
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

// Video Types
export interface Video {
  id: string;
  title: string;
  description?: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  size: number;
  format: string;
  resolution: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  userId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: VideoMetadata;
}

export interface VideoMetadata {
  codec: string;
  bitrate: number;
  fps: number;
  aspectRatio: string;
  audioCodec?: string;
  audioBitrate?: number;
}

export interface VideoProcessOptions {
  operation: 'trim' | 'compress' | 'resize' | 'convert' | 'watermark';
  parameters: {
    startTime?: number;
    endTime?: number;
    quality?: number;
    width?: number;
    height?: number;
    format?: string;
    watermarkText?: string;
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

export interface VideoUploadProgress {
  videoId: string;
  progress: number;
  status: string;
  message?: string;
}

// Analytics Types
export interface AnalyticsDashboard {
  totalViews: number;
  totalEngagement: number;
  totalFollowers: number;
  growthRate: number;
  topPosts: Post[];
  platformStats: PlatformStats[];
  engagementTrends: EngagementTrend[];
}

export interface PlatformStats {
  platform: 'instagram' | 'twitter' | 'facebook' | 'youtube' | 'tiktok';
  followers: number;
  engagement: number;
  posts: number;
  reach: number;
  impressions: number;
}

export interface EngagementTrend {
  date: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Automation Types
export interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledTime: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  mediaUrls?: string[];
  hashtags?: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchJob {
  id: string;
  type: 'video-processing' | 'post-scheduling' | 'analytics-report';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'time' | 'event' | 'condition';
  actions: AutomationAction[];
  enabled: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationAction {
  type: 'post' | 'email' | 'webhook' | 'process-video';
  parameters: Record<string, any>;
}

// Brand Kit Types
export interface BrandColor {
  id: string;
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  usage: string;
}

export interface BrandLogo {
  id: string;
  name: string;
  url: string;
  format: string;
  size: { width: number; height: number };
  variant: 'primary' | 'secondary' | 'monochrome' | 'inverse';
}

export interface BrandTemplate {
  id: string;
  name: string;
  category: 'social-media' | 'video' | 'presentation' | 'document';
  thumbnailUrl: string;
  fileUrl: string;
  format: string;
  dimensions: { width: number; height: number };
}

// Common Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  userId: string;
  createdAt: string;
  actionUrl?: string;
}

// Settings Types
export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showEmail: boolean;
    allowAnalytics: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

// Dashboard Types
export interface DashboardStats {
  videosUploaded: number;
  postsScheduled: number;
  totalEngagement: number;
  activeProjects: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'video-upload' | 'post-published' | 'report-generated' | 'automation-triggered';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
}

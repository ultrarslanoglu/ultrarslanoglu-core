const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../../config');
const Token = require('../models/Token');
const GoogleAuthService = require('../auth/googleAuth');

const CHUNK_SIZE = 262144; // 256KB chunks

/**
 * YouTube API Client
 * Video upload ve analytics işlemleri
 */
class YouTubeAPI {

  /**
   * YouTube channels'ı al (authenticated kullanıcının)
   */
  static async getChannels(accessToken) {
    try {
      const response = await axios.get(`${config.google.apiBaseURL}channels`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          mine: true,
          maxResults: 50
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.items.map(channel => ({
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails.default.url,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        viewCount: channel.statistics.viewCount
      }));
    } catch (error) {
      console.error('Error getting YouTube channels:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Video yükle (resumable upload desteği ile)
   */
  static async uploadVideo(userId, videoPath, metadata = {}) {
    try {
      const token = await GoogleAuthService.ensureValidToken(userId);
      const accessToken = token.accessToken;

      // Video metadata hazırla
      const videoMetadata = {
        snippet: {
          title: metadata.title || 'Untitled',
          description: metadata.description || '',
          tags: metadata.tags || [],
          categoryId: metadata.categoryId || '22', // default: People & Blogs
          defaultLanguage: metadata.defaultLanguage || 'en'
        },
        status: {
          privacyStatus: metadata.privacyStatus || 'private', // private, unlisted, public
          publishAt: metadata.publishAt || null,
          selfDeclaredMadeForKids: metadata.madeForKids || false
        },
        processingDetails: {
          processingStatus: 'processing'
        }
      };

      // If published, set publish date
      if (metadata.publishAt) {
        videoMetadata.status.publishAt = new Date(metadata.publishAt).toISOString();
      }

      // Video dosyasını oku
      const videoBuffer = fs.readFileSync(videoPath);
      const fileSize = videoBuffer.length;

      // Upload session başlat
      const sessionUrl = await this._initializeUpload(
        accessToken,
        videoMetadata,
        fileSize
      );

      // Video'yu chunks halinde yükle
      const uploadedBytes = await this._uploadVideoContent(
        sessionUrl,
        videoBuffer,
        fileSize
      );

      if (uploadedBytes === fileSize) {
        // Upload tamamlandı, videoId'yi al
        const videoId = await this._finalizeUpload(sessionUrl);
        return {
          success: true,
          videoId: videoId,
          title: metadata.title,
          privacyStatus: metadata.privacyStatus,
          url: `https://www.youtube.com/watch?v=${videoId}`
        };
      } else {
        throw new Error('Upload incomplete');
      }
    } catch (error) {
      console.error('Error uploading video:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Upload session başlat (resumable upload)
   */
  static async _initializeUpload(accessToken, metadata, fileSize) {
    try {
      const response = await axios.post(
        `${config.google.apiBaseURL}videos?uploadType=resumable&part=snippet,status,processingDetails`,
        metadata,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': fileSize,
            'X-Goog-Upload-Header-Content-Type': 'video/mp4',
            'Content-Type': 'application/json'
          }
        }
      );

      // Session URI location header'dan al
      return response.headers['location'];
    } catch (error) {
      console.error('Error initializing upload:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Video content'i chunks halinde yükle
   */
  static async _uploadVideoContent(sessionUrl, videoBuffer, fileSize) {
    let uploadedBytes = 0;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunk = videoBuffer.slice(start, end);

      const isLastChunk = end === fileSize;

      try {
        const response = await axios.put(
          sessionUrl,
          chunk,
          {
            headers: {
              'X-Goog-Upload-Command': isLastChunk ? 'upload, finalize' : 'upload',
              'X-Goog-Upload-Offset': start,
              'Content-Length': chunk.length,
              'Content-Type': 'video/mp4'
            },
            validateStatus: (status) => status >= 200 && status < 300 || status === 308
          }
        );

        if (response.status === 200 || response.status === 201) {
          // Upload tamamlandı
          uploadedBytes = end;
          return uploadedBytes;
        } else if (response.status === 308) {
          // Upload devam ediyor
          const rangeHeader = response.headers['range'];
          if (rangeHeader) {
            uploadedBytes = parseInt(rangeHeader.split('-')[1]) + 1;
          }
        }
      } catch (error) {
        console.error(`Error uploading chunk ${i + 1}/${totalChunks}:`, error.message);
        throw error;
      }
    }

    return uploadedBytes;
  }

  /**
   * Upload'ı tamamla ve videoId'yi al
   */
  static async _finalizeUpload(sessionUrl) {
    try {
      const response = await axios.put(
        sessionUrl,
        null,
        {
          headers: {
            'X-Goog-Upload-Command': 'finalize'
          }
        }
      );

      return response.data.id;
    } catch (error) {
      console.error('Error finalizing upload:', error.message);
      throw error;
    }
  }

  /**
   * Video bilgilerini al
   */
  static async getVideoInfo(accessToken, videoId) {
    try {
      const response = await axios.get(`${config.google.apiBaseURL}videos`, {
        params: {
          part: 'snippet,statistics,processingDetails,status',
          id: videoId
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        status: video.status.privacyStatus,
        processingStatus: video.processingDetails?.processingStatus,
        statistics: {
          views: video.statistics.viewCount || 0,
          likes: video.statistics.likeCount || 0,
          comments: video.statistics.commentCount || 0,
          favorites: video.statistics.favoriteCount || 0
        },
        url: `https://www.youtube.com/watch?v=${video.id}`
      };
    } catch (error) {
      console.error('Error getting video info:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Video listesi (user'ın channel'ında)
   */
  static async getVideoList(accessToken, options = {}) {
    try {
      const params = {
        part: 'snippet,statistics,status',
        mine: true,
        maxResults: options.maxResults || 25,
        order: options.order || 'date', // date, rating, relevance, title, videoCount, viewCount
        pageToken: options.pageToken || null
      };

      if (options.searchQuery) {
        delete params.mine;
        params.q = options.searchQuery;
      }

      const response = await axios.get(`${config.google.apiBaseURL}search`, {
        params: params,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        videos: response.data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.default.url,
          publishedAt: item.snippet.publishedAt
        })),
        nextPageToken: response.data.nextPageToken,
        pageInfo: response.data.pageInfo
      };
    } catch (error) {
      console.error('Error getting video list:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Video güncellemeleri (title, description, tags, privacy)
   */
  static async updateVideo(accessToken, videoId, updates = {}) {
    try {
      // Mevcut video bilgisini al
      const response = await axios.get(`${config.google.apiBaseURL}videos`, {
        params: {
          part: 'snippet,status',
          id: videoId
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];

      // Updates apply et
      if (updates.title) video.snippet.title = updates.title;
      if (updates.description) video.snippet.description = updates.description;
      if (updates.tags) video.snippet.tags = updates.tags;
      if (updates.privacyStatus) video.status.privacyStatus = updates.privacyStatus;
      if (updates.categoryId) video.snippet.categoryId = updates.categoryId;

      // Güncellenmiş video'yu geri gönder
      const updateResponse = await axios.put(
        `${config.google.apiBaseURL}videos?part=snippet,status`,
        video,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        videoId: updateResponse.data.id,
        title: updateResponse.data.snippet.title,
        status: updateResponse.data.status.privacyStatus
      };
    } catch (error) {
      console.error('Error updating video:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Video sil
   */
  static async deleteVideo(accessToken, videoId) {
    try {
      await axios.delete(`${config.google.apiBaseURL}videos`, {
        params: {
          id: videoId
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        success: true,
        message: 'Video deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting video:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * YouTube Analytics API - Video Analytics
   */
  static async getVideoAnalytics(accessToken, videoId, options = {}) {
    try {
      const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = options.endDate || new Date().toISOString().split('T')[0];

      const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
        params: {
          ids: 'channel==MINE',
          startDate: startDate,
          endDate: endDate,
          metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes,comments,shares,annotationClickableImpressions,annotationClicks,annotationClickThroughRate',
          filters: `video==${videoId}`,
          dimensions: 'day'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.data.rows || response.data.rows.length === 0) {
        return {
          success: false,
          message: 'No analytics data available for this video yet'
        };
      }

      // Analytics data'yı işle
      const headers = response.data.columnHeaders.map(h => h.name);
      const rows = response.data.rows;

      // Toplam değerleri hesapla
      const totals = {};
      headers.forEach((header, index) => {
        if (header !== 'day') {
          totals[header] = rows.reduce((sum, row) => sum + (parseInt(row[index]) || 0), 0);
        }
      });

      return {
        success: true,
        videoId: videoId,
        period: {
          startDate: startDate,
          endDate: endDate
        },
        metrics: {
          views: totals.views || 0,
          watchTime: totals.estimatedMinutesWatched || 0,
          averageViewDuration: totals.averageViewDuration || 0,
          averageViewPercentage: totals.averageViewPercentage || 0,
          subscribersGained: totals.subscribersGained || 0,
          likes: totals.likes || 0,
          comments: totals.comments || 0,
          shares: totals.shares || 0
        },
        dailyData: rows.map(row => ({
          date: row[0],
          views: row[headers.indexOf('views')],
          watchTime: row[headers.indexOf('estimatedMinutesWatched')],
          likes: row[headers.indexOf('likes')],
          comments: row[headers.indexOf('comments')],
          shares: row[headers.indexOf('shares')]
        }))
      };
    } catch (error) {
      console.error('Error getting video analytics:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Channel Analytics
   */
  static async getChannelAnalytics(accessToken, options = {}) {
    try {
      const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = options.endDate || new Date().toISOString().split('T')[0];

      const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
        params: {
          ids: 'channel==MINE',
          startDate: startDate,
          endDate: endDate,
          metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,videosAddedToPlaylists,videosRemovedFromPlaylists,shares,likes,comments,annotationClickableImpressions,annotationClicks',
          dimensions: 'day'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.data.rows || response.data.rows.length === 0) {
        return {
          success: false,
          message: 'No analytics data available yet'
        };
      }

      const headers = response.data.columnHeaders.map(h => h.name);
      const rows = response.data.rows;

      // Toplam değerleri hesapla
      const totals = {};
      headers.forEach((header, index) => {
        if (header !== 'day') {
          totals[header] = rows.reduce((sum, row) => sum + (parseInt(row[index]) || 0), 0);
        }
      });

      return {
        success: true,
        period: {
          startDate: startDate,
          endDate: endDate
        },
        metrics: {
          views: totals.views || 0,
          watchTime: totals.estimatedMinutesWatched || 0,
          averageViewDuration: totals.averageViewDuration || 0,
          subscribersGained: totals.subscribersGained || 0,
          likes: totals.likes || 0,
          comments: totals.comments || 0,
          shares: totals.shares || 0,
          playlistAdds: totals.videosAddedToPlaylists || 0,
          playlistRemoves: totals.videosRemovedFromPlaylists || 0
        },
        dailyData: rows.map(row => ({
          date: row[0],
          views: row[headers.indexOf('views')],
          watchTime: row[headers.indexOf('estimatedMinutesWatched')],
          subscribersGained: row[headers.indexOf('subscribersGained')],
          likes: row[headers.indexOf('likes')],
          comments: row[headers.indexOf('comments')],
          shares: row[headers.indexOf('shares')]
        }))
      };
    } catch (error) {
      console.error('Error getting channel analytics:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Traffic sources (YouTube analytics)
   */
  static async getTrafficSources(accessToken, videoId = null, options = {}) {
    try {
      const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = options.endDate || new Date().toISOString().split('T')[0];

      const params = {
        ids: 'channel==MINE',
        startDate: startDate,
        endDate: endDate,
        metrics: 'views,estimatedMinutesWatched',
        dimensions: 'trafficSourceDetail'
      };

      if (videoId) {
        params.filters = `video==${videoId}`;
      }

      const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
        params: params,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.data.rows || response.data.rows.length === 0) {
        return {
          success: false,
          message: 'No traffic data available'
        };
      }

      const headers = response.data.columnHeaders.map(h => h.name);
      return {
        success: true,
        trafficSources: response.data.rows.map(row => ({
          source: row[0],
          views: row[1],
          watchTime: row[2]
        }))
      };
    } catch (error) {
      console.error('Error getting traffic sources:', error.response?.data || error.message);
      throw error;
    }
  }}

module.exports = YouTubeAPI;
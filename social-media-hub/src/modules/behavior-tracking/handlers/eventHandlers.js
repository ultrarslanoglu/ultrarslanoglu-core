/**
 * Event Handlers for User Behavior Tracking
 * Processes different types of user interactions
 */

const { v4: uuidv4 } = require('uuid');
const geoip = require('geoip-lite');
const logger = require('../../../shared/logger');

/**
 * Handle page view event
 */
async function handlePageView(userId, sessionId, data, socket) {
  const eventId = uuidv4();
  const geo = geoip.lookup(socket.handshake.address);

  return {
    eventId,
    eventType: 'page_view',
    eventCategory: 'navigation',
    url: data.url,
    pageTitle: data.title,
    referer: data.referer,
    country: geo?.country,
    region: geo?.timezone,
    deviceType: detectDeviceType(socket),
    browser: parseBrowser(socket.handshake.headers['user-agent']),
    data: {
      scrollPosition: { x: 0, y: 0 },
      timeOnPage: 0,
      customMetadata: data.metadata || {}
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle click event
 */
async function handleClick(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'click',
    eventCategory: 'engagement',
    url: data.url,
    data: {
      elementId: data.elementId,
      elementClass: data.elementClass,
      elementText: data.elementText?.substring(0, 200),
      mouseCoordinates: {
        x: data.x || 0,
        y: data.y || 0
      },
      customMetadata: data.metadata || {}
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle scroll event
 */
async function handleScroll(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'scroll',
    eventCategory: 'engagement',
    url: data.url,
    data: {
      scrollPosition: {
        x: data.scrollX || 0,
        y: data.scrollY || 0
      },
      pageHeight: data.pageHeight || 0,
      viewportHeight: data.viewportHeight || 0,
      scrollPercentage: data.scrollPercentage || 0
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle form submission
 */
async function handleFormSubmit(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'form_submit',
    eventCategory: 'content',
    url: data.url,
    data: {
      elementId: data.formId,
      formData: sanitizeFormData(data.formData || {}),
      fieldsCount: data.fieldsCount || 0
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    duration: data.timeToComplete || 0,
    status: 'success'
  };
}

/**
 * Handle video play event
 */
async function handleVideoPlay(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'video_play',
    eventCategory: 'content',
    url: data.url,
    data: {
      elementId: data.videoId,
      elementText: data.videoTitle || '',
      customMetadata: {
        videoUrl: data.videoUrl,
        duration: data.videoDuration || 0,
        currentTime: data.currentTime || 0
      }
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle video pause event
 */
async function handleVideoPause(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'video_pause',
    eventCategory: 'content',
    url: data.url,
    data: {
      elementId: data.videoId,
      customMetadata: {
        videoUrl: data.videoUrl,
        duration: data.videoDuration || 0,
        currentTime: data.currentTime || 0,
        watchPercentage: data.watchPercentage || 0
      }
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle search event
 */
async function handleSearch(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'search',
    eventCategory: 'engagement',
    url: data.url,
    data: {
      elementId: data.searchFieldId,
      customMetadata: {
        searchQuery: data.query?.substring(0, 100) || '',
        searchType: data.searchType || 'general',
        resultsCount: data.resultsCount || 0,
        timeToSearch: data.timeToSearch || 0
      }
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle like event
 */
async function handleLike(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'like',
    eventCategory: 'social',
    url: data.url,
    data: {
      elementId: data.contentId,
      customMetadata: {
        contentType: data.contentType || 'post',
        contentOwnerId: data.contentOwnerId,
        liked: data.liked || true
      }
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle comment event
 */
async function handleComment(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'comment',
    eventCategory: 'social',
    url: data.url,
    data: {
      elementId: data.contentId,
      customMetadata: {
        contentType: data.contentType || 'post',
        commentLength: data.commentText?.length || 0,
        contentOwnerId: data.contentOwnerId
      }
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle share event
 */
async function handleShare(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'share',
    eventCategory: 'social',
    url: data.url,
    data: {
      elementId: data.contentId,
      customMetadata: {
        contentType: data.contentType || 'post',
        shareMethod: data.shareMethod || 'native',
        platform: data.platform || 'general',
        contentOwnerId: data.contentOwnerId
      }
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle follow event
 */
async function handleFollow(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'follow',
    eventCategory: 'social',
    url: data.url,
    data: {
      customMetadata: {
        targetUserId: data.targetUserId,
        isFollow: data.isFollow || true,
        userType: data.userType || 'user'
      }
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success'
  };
}

/**
 * Handle custom event
 */
async function handleCustomEvent(userId, sessionId, data, socket) {
  const eventId = uuidv4();

  return {
    eventId,
    eventType: 'custom',
    eventCategory: data.category || 'engagement',
    url: data.url,
    data: {
      elementId: data.elementId,
      customMetadata: data.metadata || {}
    },
    timestamp: new Date(),
    clientTime: data.timestamp ? new Date(data.timestamp) : new Date(),
    status: 'success',
    tags: data.tags || []
  };
}

/**
 * Utility: Detect device type
 */
function detectDeviceType(socket) {
  const ua = socket.handshake.headers['user-agent'] || '';
  
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  } else if (/ipad|tablet|xoom|playbook|silk|nexus 7|nexus 10|xoom|kindle/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Utility: Parse browser from user agent
 */
function parseBrowser(ua) {
  if (!ua) return 'unknown';
  
  let browserName = 'unknown';
  let version = '';

  if (ua.indexOf('Edg') > -1) {
    browserName = 'Edge';
    version = ua.substring(ua.indexOf('Edg') + 4, ua.indexOf('Edg') + 7);
  } else if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    version = ua.substring(ua.indexOf('Chrome') + 7, ua.indexOf('Chrome') + 10);
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    version = ua.substring(ua.indexOf('Version') + 8, ua.indexOf('Version') + 11);
  } else if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    version = ua.substring(ua.indexOf('Firefox') + 8, ua.indexOf('Firefox') + 11);
  }

  return `${browserName} ${version}`.trim();
}

/**
 * Utility: Sanitize form data (remove sensitive info)
 */
function sanitizeFormData(formData) {
  const sensitiveFields = ['password', 'credit_card', 'ssn', 'cvv', 'token', 'apiKey', 'secret'];
  const sanitized = { ...formData };

  sensitiveFields.forEach(field => {
    Object.keys(sanitized).forEach(key => {
      if (key.toLowerCase().includes(field.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      }
    });
  });

  return sanitized;
}

module.exports = {
  handlePageView,
  handleClick,
  handleScroll,
  handleFormSubmit,
  handleVideoPlay,
  handleVideoPause,
  handleSearch,
  handleLike,
  handleComment,
  handleShare,
  handleFollow,
  handleCustomEvent
};

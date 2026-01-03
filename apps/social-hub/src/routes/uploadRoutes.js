const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploaderService = require('../services/uploader');
const decisionEngine = require('../ai/decisionEngine');
const { Upload } = require('../models');
const { authenticateToken, requireEditor } = require('../utils/auth');
const logger = require('../utils/logger');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

/**
 * Upload Routes
 * Video yükleme ve yönetim endpoint'leri
 */

/**
 * @route   POST /upload/analyze
 * @desc    İçerik analizi yap ve AI önerileri al
 * @access  Private (Editor)
 */
router.post('/analyze', authenticateToken, requireEditor, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, description, tags, hashtags } = req.body;

    const decision = await decisionEngine.makeDecision(userId, {
      title,
      description,
      tags: tags || [],
      hashtags: hashtags || []
    });

    res.json({
      success: true,
      decision
    });

  } catch (error) {
    logger.error('Analyze error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

/**
 * @route   POST /upload/single
 * @desc    Tek bir platforma video yükle
 * @access  Private (Editor)
 */
router.post('/single', authenticateToken, requireEditor, upload.single('video'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { platform, title, description, tags, hashtags, privacy } = req.body;

    // Upload kaydı oluştur
    const uploadDoc = await Upload.create({
      userId,
      video: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      content: {
        title,
        description,
        tags: tags ? JSON.parse(tags) : [],
        category: req.body.category
      },
      platforms: [{
        platform,
        status: 'processing'
      }],
      overallStatus: 'publishing'
    });

    // Upload işlemini başlat (async)
    const metadata = {
      title,
      description,
      tags: tags ? JSON.parse(tags) : [],
      hashtags: hashtags ? JSON.parse(hashtags) : [],
      privacy,
      instagramAccountId: req.body.instagramAccountId,
      instagramVideoUrl: req.body.publicVideoUrl
    };

    uploaderService.uploadToMultiplePlatforms(
      userId,
      uploadDoc._id,
      [platform],
      req.file.path,
      metadata
    ).catch(error => {
      logger.error('Background upload error:', error);
    });

    res.json({
      success: true,
      uploadId: uploadDoc._id,
      message: 'Upload started',
      status: 'processing'
    });

  } catch (error) {
    logger.error('Single upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * @route   POST /upload/multiple
 * @desc    Çoklu platforma video yükle
 */
router.post('/multiple', upload.single('video'), async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { platforms, title, description, tags, hashtags } = req.body;
    const platformList = JSON.parse(platforms);

    // Upload kaydı oluştur
    const uploadDoc = await Upload.create({
      userId,
      video: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      content: {
        title,
        description,
        tags: tags ? JSON.parse(tags) : []
      },
      platforms: platformList.map(p => ({
        platform: p,
        status: 'pending'
      })),
      overallStatus: 'publishing'
    });

    // Upload işlemini başlat (async)
    const metadata = {
      title,
      description,
      tags: tags ? JSON.parse(tags) : [],
      hashtags: hashtags ? JSON.parse(hashtags) : [],
      instagramAccountId: req.body.instagramAccountId,
      instagramVideoUrl: req.body.publicVideoUrl
    };

    uploaderService.uploadToMultiplePlatforms(
      userId,
      uploadDoc._id,
      platformList,
      req.file.path,
      metadata
    ).catch(error => {
      logger.error('Background upload error:', error);
    });

    res.json({
      success: true,
      uploadId: uploadDoc._id,
      message: 'Upload started',
      platforms: platformList,
      status: 'processing'
    });

  } catch (error) {
    logger.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

/**
 * @route   POST /upload/schedule
 * @desc    Zamanlanmış upload oluştur
 */
router.post('/schedule', upload.single('video'), async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { platforms, title, description, tags, publishAt } = req.body;
    const platformList = JSON.parse(platforms);
    const publishDate = new Date(publishAt);

    if (publishDate <= new Date()) {
      return res.status(400).json({ error: 'Publish date must be in the future' });
    }

    // Upload kaydı oluştur
    const uploadDoc = await Upload.create({
      userId,
      video: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      content: {
        title,
        description,
        tags: tags ? JSON.parse(tags) : []
      },
      platforms: platformList.map(p => ({
        platform: p,
        status: 'pending'
      })),
      scheduling: {
        publishAt: publishDate,
        isScheduled: true,
        timezone: 'Europe/Istanbul'
      },
      overallStatus: 'scheduled'
    });

    res.json({
      success: true,
      uploadId: uploadDoc._id,
      message: 'Upload scheduled',
      publishAt: publishDate,
      platforms: platformList
    });

  } catch (error) {
    logger.error('Schedule upload error:', error);
    res.status(500).json({ error: 'Schedule failed' });
  }
});

/**
 * @route   GET /upload/status/:uploadId
 * @desc    Upload durumunu sorgula
 */
router.get('/status/:uploadId', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const status = await uploaderService.getUploadStatus(req.params.uploadId);

    res.json(status);

  } catch (error) {
    logger.error('Get upload status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * @route   GET /upload/history
 * @desc    Kullanıcının upload geçmişini listele
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const uploads = await Upload.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-video.path'); // Don't expose file paths

    const total = await Upload.countDocuments({ userId });

    res.json({
      success: true,
      uploads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Get upload history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

/**
 * @route   DELETE /upload/:uploadId
 * @desc    Upload'ı sil
 */
router.delete('/:uploadId', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const upload = await Upload.findOne({
      _id: req.params.uploadId,
      userId
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Video dosyasını sil
    if (upload.video.path && fs.existsSync(upload.video.path)) {
      fs.unlinkSync(upload.video.path);
    }

    await upload.deleteOne();

    res.json({
      success: true,
      message: 'Upload deleted'
    });

  } catch (error) {
    logger.error('Delete upload error:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

module.exports = router;

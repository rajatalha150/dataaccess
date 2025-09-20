const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_PATH || './uploads';
const thumbnailDir = path.join(uploadDir, 'thumbnails');

[uploadDir, thumbnailDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'jpg,jpeg,png,gif,webp').split(',');
  const allowedVideoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'mp4,avi,mkv,mov,wmv,flv,webm').split(',');
  
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  const isImage = allowedImageTypes.includes(fileExtension);
  const isVideo = allowedVideoTypes.includes(fileExtension);
  
  if (isImage || isVideo) {
    // Add media type to file object
    file.mediaType = isImage ? 'image' : 'video';
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed. Allowed types: ${[...allowedImageTypes, ...allowedVideoTypes].join(', ')}`), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB default
    files: 10 // Maximum 10 files per request
  }
});

// Generate thumbnail for images
const generateImageThumbnail = async (filePath, thumbnailPath) => {
  try {
    await sharp(filePath)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (err) {
    console.error('Error generating image thumbnail:', err);
    throw err;
  }
};

// Generate thumbnail for videos
const generateVideoThumbnail = (filePath, thumbnailPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .screenshots({
        timestamps: ['10%'],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '300x300'
      })
      .on('end', () => {
        resolve(thumbnailPath);
      })
      .on('error', (err) => {
        console.error('Error generating video thumbnail:', err);
        reject(err);
      });
  });
};

// Get video metadata
const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      
      resolve({
        duration: Math.round(metadata.format.duration),
        width: videoStream ? videoStream.width : null,
        height: videoStream ? videoStream.height : null,
        bitrate: metadata.format.bit_rate,
        format: metadata.format.format_name
      });
    });
  });
};

// Get image metadata
const getImageMetadata = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size
    };
  } catch (err) {
    console.error('Error getting image metadata:', err);
    throw err;
  }
};

// Process uploaded file
const processUploadedFile = async (file) => {
  try {
    const filePath = file.path;
    const thumbnailFilename = `thumb_${file.filename}.jpg`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
    
    let metadata = {};
    let thumbnailGenerated = false;
    
    if (file.mediaType === 'image') {
      // Process image
      metadata = await getImageMetadata(filePath);
      await generateImageThumbnail(filePath, thumbnailPath);
      thumbnailGenerated = true;
    } else if (file.mediaType === 'video') {
      // Process video
      metadata = await getVideoMetadata(filePath);
      try {
        await generateVideoThumbnail(filePath, thumbnailPath);
        thumbnailGenerated = true;
      } catch (err) {
        console.warn('Could not generate video thumbnail:', err.message);
      }
    }
    
    return {
      ...file,
      metadata,
      thumbnailPath: thumbnailGenerated ? thumbnailPath : null,
      relativeThumbnailPath: thumbnailGenerated ? path.join('thumbnails', thumbnailFilename) : null
    };
    
  } catch (err) {
    console.error('Error processing uploaded file:', err);
    throw err;
  }
};

// Middleware to process files after upload
const processFiles = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }
  
  try {
    const processedFiles = [];
    
    for (const file of req.files) {
      const processedFile = await processUploadedFile(file);
      processedFiles.push(processedFile);
    }
    
    req.processedFiles = processedFiles;
    next();
    
  } catch (err) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    next(err);
  }
};

// Clean up file function
const cleanupFile = (filePath, thumbnailPath = null) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  } catch (err) {
    console.error('Error cleaning up file:', err);
  }
};

module.exports = {
  upload,
  processFiles,
  generateImageThumbnail,
  generateVideoThumbnail,
  getVideoMetadata,
  getImageMetadata,
  processUploadedFile,
  cleanupFile
};
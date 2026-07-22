/**
 * Upload Routes
 * File uploads for avatars, task images, chat attachments, documents
 */

import { Router } from 'express';
import { UploadController } from '../controllers/uploadController';
import { authMiddleware } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import { validate } from '../middleware/validate';
import { uploadValidation } from '../validations/uploadValidation';

const router = Router();
const uploadController = new UploadController();

// All routes require authentication
router.use(authMiddleware);

// ============================================================
// Profile Avatar Upload
// ============================================================

// Upload profile avatar
router.post('/avatar',
  uploadMiddleware.single('avatar'),
  validate(uploadValidation.uploadAvatar),
  uploadController.uploadAvatar
);

// Delete profile avatar
router.delete('/avatar',
  uploadController.deleteAvatar
);

// ============================================================
// Task Images Upload
// ============================================================

// Upload task images (multiple)
router.post('/task/images',
  uploadMiddleware.array('images', 10),
  validate(uploadValidation.uploadTaskImages),
  uploadController.uploadTaskImages
);

// Delete task image
router.delete('/task/images/:imageId',
  validate(uploadValidation.deleteTaskImage),
  uploadController.deleteTaskImage
);

// ============================================================
// Chat Attachments Upload
// ============================================================

// Upload chat attachment (image, document, voice)
router.post('/chat/attachment',
  uploadMiddleware.single('attachment'),
  validate(uploadValidation.uploadChatAttachment),
  uploadController.uploadChatAttachment
);

// Upload multiple chat attachments
router.post('/chat/attachments',
  uploadMiddleware.array('attachments', 5),
  validate(uploadValidation.uploadChatAttachments),
  uploadController.uploadChatAttachments
);

// ============================================================
// Document Upload (KYC, verification)
// ============================================================

// Upload KYC document
router.post('/document/kyc',
  uploadMiddleware.single('document'),
  validate(uploadValidation.uploadKYCDocument),
  uploadController.uploadKYCDocument
);

// Upload verification document
router.post('/document/verification',
  uploadMiddleware.single('document'),
  validate(uploadValidation.uploadVerificationDocument),
  uploadController.uploadVerificationDocument
);

// ============================================================
// Review Media Upload
// ============================================================

// Upload review images
router.post('/review/images',
  uploadMiddleware.array('images', 5),
  validate(uploadValidation.uploadReviewImages),
  uploadController.uploadReviewImages
);

// ============================================================
// Generic File Upload
// ============================================================

// Upload generic file
router.post('/file',
  uploadMiddleware.single('file'),
  validate(uploadValidation.uploadFile),
  uploadController.uploadFile
);

// Get signed URL for direct upload (large files)
router.post('/signed-url',
  validate(uploadValidation.getSignedUrl),
  uploadController.getSignedUrl
);

// ============================================================
// File Management
// ============================================================

// Get file info
router.get('/file/:fileId',
  validate(uploadValidation.getFileInfo),
  uploadController.getFileInfo
);

// Delete file
router.delete('/file/:fileId',
  validate(uploadValidation.deleteFile),
  uploadController.deleteFile
);

// List user files
router.get('/files',
  validate(uploadValidation.listFiles),
  uploadController.listFiles
);

export default router;
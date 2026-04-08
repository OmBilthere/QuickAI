import express from 'express';
import {authMiddleware} from '../middlewares/auth.js';
import {generateArticle, generateBlogTitle , generateImage , removeImageBackground, removeImageObject, resumeReview} from '../controllers/aiController.js';
import upload from '../configs/multer.js';
const aiRouter = express.Router();

aiRouter.post('/generate-article', authMiddleware , generateArticle);
aiRouter.post('/generate-blog-title', authMiddleware , generateBlogTitle);
aiRouter.post('/generate-image', authMiddleware , generateImage);
aiRouter.post('/remove-image-background',  upload.single('image') , authMiddleware , removeImageBackground);
aiRouter.post('/remove-image-object',  upload.single('image') , authMiddleware , removeImageObject);
aiRouter.post('/resume-review',  upload.single('resume') , authMiddleware , resumeReview);
export default aiRouter;
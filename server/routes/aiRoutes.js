import express from 'express';
import {authMiddleware} from '../middlewares/auth.js';
import {generateArticle} from '../controllers/aiController.js';

const aiRouter = express.Router();

aiRouter.post('/generate-article', authMiddleware , generateArticle);

export default aiRouter;
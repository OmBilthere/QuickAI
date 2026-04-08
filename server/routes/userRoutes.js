import express from "express";
import { getUserCreations , getPublishedCreations , toggleLikeCreation } from "../controllers/userController.js";
import {authMiddleware} from '../middlewares/auth.js';


const userRouter = express.Router();

userRouter.get('/get-user-creations',authMiddleware , getUserCreations);
userRouter.get('/get-published-creations',authMiddleware , getPublishedCreations);
userRouter.post('/toggle-like-creation',authMiddleware , toggleLikeCreation);

export default userRouter;
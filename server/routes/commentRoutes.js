import express from "express";
import { addComment, getComments } from "../controllers/commentController.js";
const commentRouter = express.Router();

// comment routes
commentRouter.post("/", addComment);
commentRouter.get("/:taskId", getComments);
export default commentRouter;
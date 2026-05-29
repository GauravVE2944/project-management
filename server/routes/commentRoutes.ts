import express from "express";
import { addComment, getComments } from "../controllers/commentController.ts";
const commentRouter = express.Router();

// comment routes
commentRouter.post("/", addComment);
commentRouter.get("/:taskId", getComments);
export default commentRouter;
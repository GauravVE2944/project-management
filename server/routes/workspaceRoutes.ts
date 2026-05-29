import express from "express";
import { getUserWorkspaces, addMember } from "../controllers/workspaceController.ts";
const workspaceRouter = express.Router();

// Get all workspaces for a user
workspaceRouter.get("/", getUserWorkspaces);
// Create workspace
workspaceRouter.post("/add-member", addMember);

export default workspaceRouter;
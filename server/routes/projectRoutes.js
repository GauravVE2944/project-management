import express from "express";
import { getUserWorkspaces, addMember } from "../controllers/workspaceController.js";
import { createProject, updateProject } from "../controllers/projectController.js";
const projectRouter = express.Router();

// Create project
projectRouter.post("/", createProject);
projectRouter.put("/", updateProject);
//projectRouter.post("/:project-id/addMember", addMember);
export default projectRouter;
import {inngest} from "../inngest/index.js";
import { prisma } from "../prisma/prisma.js";

export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, title, description, type, priority, status, assigneeId, due_date } = req.body;

        // Check if user has admin role for the project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        })
        if (!project) {
            res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            res.status(403).json({ message: "You don't have admin privilages for this project" });
        } else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId)) {
            res.status(403).json({ message: "Assignee is not a member of this project/ workspace" });
        }

        // Update Project
        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                type,
                priority,
                status,
                assigneeId,
                due_date: due_date ? new Date(due_date) : null
            }
        })

        // Assign task to assignee
        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true }
        })
        // Trigger the inngest function to send an event along with parameters
        inngest.send({ name: "app/task.assigned", data : {taskId: task.id, origin}});

        res.json({ task: taskWithAssignee, message: "Task created successfully" });

    } catch (error) {
        res.status(500).json({ message: error.code || error.message || "An error occurred while creating the task" });
    }
}

export const updateTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        })
        if (!task) {
            res.status(404).json({ message: "Task not found" });
        }
        const project = await prisma.project.find({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        })

        if (!project) {
            res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            res.status(403).json({ message: "You don't have admin privilages for this project" });
        }

        // Update the task
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: req.body
        })

        res.status({ task: updatedTask, message: "Task updated successfully" })
    }
    catch (error) {
        res.status(500).json({ message: error.code || error.message || "An error occurred while updating the task" });
    }
}

// Delete Task
export const deleteTask = async (req, res) => {
     try {
        const { userId } = await req.auth();
        const {taskIds} = req.body;
         const tasks = await prisma.task.findMany({
            where: { id:  {in : taskIds} }
        })
        if (tasks.length === 0) {
            res.status(404).json({ message: "Task not found" });
        }

        const project = await prisma.project.find({
            where: { id: tasks[0].projectId },
            include: { members: { include: { user: true } } }
        })

        if (!project) {
            res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            res.status(403).json({ message: "You don't have admin privilages for this project" });
        }

        // Delete a task
        await prisma.task.deleteMany({
            where : {id : { in : taskIds }}
        })
       res.status({message: "Task deleted successfully" })
     }
    catch (error) {
        res.status(500).json({ message: error.code || error.message || "An error occurred while deleting the task" });
    }
}
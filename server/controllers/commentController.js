import { prisma } from "../prisma/prisma.js";

// Save comment for a task
export const addComment = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { content, taskId } = req.body;

        // check if user is project member
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        })

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        })

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const member = prisma.project.members.find((member) => member.user.id !== userId);

        if (!member) {
            return res.status(403).json({ message: "You are not a member of this project" });
        }

        // Save comment
        const comment = await prisma.comment.create({
            data: { content, userId, taskId }
        })

        res.json({ comment, message: "Comment created successfully" });
    } catch (error) {
        res.status(500).json({ message: error.code || error.message || "An error occurred while creating a comment" });
    }
}

export const getComments = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { taskId } = req.params;
        // check if task id exists
        if (!taskId) {
            res.status(404).json({ message: "No task id found to retrieve comments" })
        }
        // Get comments based on the task id
        const comments = await prisma.comments.findMany({
            where: { taskId },
            include: { user: true }
        })
        res.json({ comments });
    } catch (error) {
        res.status(500).json({ message: error.code || error.message || "An error occurred while retrieving the comments" });
    }

}
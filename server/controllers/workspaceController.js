import { prisma } from "../prisma/prisma.js";

export const getUserWorkspaces = async (req, res) => {
    const { userId } = req.auth();

    try{
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true } },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });
        res.json({workspaces});
    }catch(error){
        console.error("Error fetching workspaces:", error);
        res.status(500).json({ error: "An error occurred while fetching workspaces" });
    }    
}

export const addMember = async (req, res) => {
    try{
        const { userId } = req.auth();
        const { workspaceId, email, role } = req.body;

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });
        if(!user){
            return res.status(404).json({ error: "User not found" });
        }

        if(!workspaceId || !role){
            return res.status(400).json({ error: "Workspace ID and role are required" });
        }

        if(!["ADMIN", "MEMBER"].includes(role)){
            return res.status(400).json({ error: "Invalid role. Must be ADMIN or MEMBER" });
        }

        // Fetch Workspace
        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, include: { members: true } });
        if(!workspace){
            return res.status(404).json({ error: "Workspace not found" });
        }
        
        // Check if creator is admin of the workspace
        const isAdmin = workspace.members.some((member) => member.userId === userId && member.role === "ADMIN");
        if(!isAdmin){
            return res.status(403).json({ error: "Only workspace admins can add members" });
        }

        // Check if user is already a member of the workspace
        const existingMember = workspace.members.some((member) => member.userId === user.id);
        if(existingMember){
            return res.status(400).json({ error: "User is already a member of the workspace" });
        }

        // Add member to workspace
        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspace.id,
                role
            }
        });

        res.json({ member, message: "Member added successfully" });4

    }catch(error){
        console.error("Error adding member:", error);
        res.status(500).json({ error: "An error occurred while adding member" });
    }

}
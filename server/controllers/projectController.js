import { prisma } from "../prisma/prisma.js";

// Create Project
export const createProject = async (req, res) => {
    try {
        const { userId }  = await req.auth();
        const { name, description, priority, status, start_date, end_date, workspaceId, team_lead, team_members } = req.body;
    
        // Check if user has admin role for the workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include : { members : { include : { user : true }}}
        });

        if(!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if(!workspace.members.some((member) => member.userId == userId && member.role === "ADMIN")) {
            return res.status(403).json({ message: "You don't have permission to create project on this workspace" });
        }

        // Get team lead using email
        const teamLead = await prisma.user.findUnique({
            where: {email : team_lead},
            select : { id : true }
        })

        if(!teamLead) {
            return res.status(404).json({ message: "Team lead not found" });
        }

        // Create project
       const project = await prisma.project.create({
            data: {
                name,
                description,
                status,
                priority,
                workspaceId,
                team_lead: teamLead?.id || null,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null
            }
        });

        //Add team members to the project
        if(team_members && team_members.length > 0) {
            const memberstoAdd = [];
            workspace.members.forEach((member ) => {
                if(team_members.includes(member.user.email)){
                    memberstoAdd.push(member.user.id);
                }
            })

            // save data to project members table
                await prisma.projectMember.createMany({
                    data :  memberstoAdd.map((memberId ) => ({
                        userId: memberId,
                        projectId: project.id
                    }))
                })
            
            const projectwithMembers = await prisma.project.findUnique({
                where: {id: project.id},
                include : {
                     members : { include : { user : true }}, 
                     tasks : { include : { assignee : true, comments : { include : { user : true }}}},
                    owner: true
                }
            })

            res.json({ project: projectwithMembers, message: "Project created successfully" });
        }

    }catch (error ) {
        res.status(500).json({message: error.code || error.message || "An error occurred while creating the project"});
    }
}

// Update Project
export const updateProject = async (req, res) => {
    try {
        const { userId }  = await req.auth();
        const { projectId } = req.params;
        const { id, name, description, priority, workspaceId, status, start_date, end_date, team_lead, team_members } = req.body;
        
        // Check if workspace exists and user has admin role
        const workspace = await prisma.workspace.findUnique({
            where : {id : workspaceId},
            include : { members : { include : { user : true }}}
        })

        if(!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        if(!workspace.members.some((member) => member.userId === userId && member.role === "Admin")) {
            const project = await prisma.project.findUnique({
                where: {id}
            });
            if(!project) {
                res.status(404).json({ message: "Project not found" });
             } else if(project.team_lead !== userId && !project.members.some((member) => member.userId === userId)) {
                res.status(403).json({ message: "You don't have permission to update this project" });
             }
        }

        //Update the project
        const updateProject = await prisma.project.update({
            where: { id },
            data: {
                name,
                description,
                priority,
                status,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null
            }
        })

        res.json({ project: updateProject, message: "Project updated successfully" });
      
    } catch (error ) {
        res.status(500).json({message: error.code || error.message || "An error occurred while updating the project"});
    }

    // Add member to Project
}
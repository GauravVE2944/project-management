import { Inngest } from "inngest";
import { prisma } from "../prisma/prisma.js";
import sendMail from "../config/nodemailer.js";

export const inngest = new Inngest({ "id": "project-management" });

// Inngest function to handle user creation to database
const syncUserCreation = inngest.createFunction(
    { "id": "user-created", triggers: [{ event: "clerk/user.created" }] },
    async ({ event, step }) => {
        console.log("User created event received:", event);
        const { data } = event;
        console.log("User data:", data);
        await prisma.user.create({
            data: {
                id: data.id,
                email: data.email_addresses[0].email_address,
                name: data.first_name + " " + data.last_name,
                image: data?.image_url || null
            }
        });
    }
);

// Inngest function to handle user deletion from database
const syncUserDeletion = inngest.createFunction(
    { "id": "user-deleted", triggers: [{ event: "clerk/user.deleted" }] },
    async ({ event, step }) => {
        console.log("User deleted event received:", event);
        const { data } = event;
        console.log("User data:", data);
        await prisma.user.delete({
            where: {
                id: data.id
            }
        });
    }
);

// Inngest function to handle user update to database
const syncUserUpdate = inngest.createFunction(
    { "id": "user-updated", triggers: [{ event: "clerk/user.updated" }] },
    async ({ event, step }) => {
        console.log("User updated event received:", event);
        const { data } = event;
        console.log("User data:", data);
        await prisma.user.update({
            where: {
                id: data.id
            },
            data: {
                email: data.email_addresses[0].email_address,
                name: data.first_name + " " + data.last_name,
            }
        });
    }
);

// Inngest function to handle save workspace to database
const syncWorkspaceSave = inngest.createFunction(
    { "id": "save-workspace", triggers: [{ event: "clerk/organization.created" }] },
    async ({ event, step }) => {
        console.log("Save workspace event received:", event);
        const { data } = event;
        console.log("Workspace data:", data);
        await prisma.workspace.create({
            data: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                description: data.description,
                ownerId: data.created_by
            }
        });
    }
);

// Inngest function to handle update workspace to database
const syncWorkspaceUpdate = inngest.createFunction(
    { "id": "update-workspace", triggers: [{ event: "clerk/organization.updated" }] },
    async ({ event, step }) => {
        console.log("Update workspace event received:", event);
        const { data } = event;
        console.log("Workspace data:", data);
        await prisma.workspace.update({
            where: {
                id: data.id
            },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
            }
        });

        // Set creator as admin of the workspace
        await prisma.workspaceMember.create({
            data: {
                userId: data.createdBy,
                workspaceId: data.id,
                role: "ADMIN"
            }
        });
    }
);

const syncWorkspaceDelete = inngest.createFunction(
    { "id": "delete-workspace", triggers: [{ event: "clerk/organization.deleted" }] },
    async ({ event, step }) => {
        console.log("Delete workspace event received:", event);
        const { data } = event;
        console.log("Workspace data:", data);
        await prisma.workspace.delete({
            where: {
                id: data.id
            }
        });
    }
);

const syncWorkspaceMemberAdd = inngest.createFunction(
    { "id": "add-workspace-member", triggers: [{ event: "clerk/organizationInvitation.accepted" }] },
    async ({ event, step }) => {
        console.log("Add workspace member event received:", event);
        const { data } = event;
        console.log("Workspace member data:", data);
        await prisma.workspaceMember.create({
            data: {
                userId: data.user_id,
                workspaceId: data.organization_id,
                role: data.role.toUpperCase()
            }
        });
    }
);

// Inngest Function to send email on Task Creation
const sendTaskAssignmentEmail = inngest.createFunction(
    { "id": "send-task-assignment-mail", triggers: [{ event: "app/task.assigned" }] },
    async ({ event, step }) => {
        const { taskId } = event.data;
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { assignee: true, project: true }
        })
        if (!task) return;
            await sendMail({
                to: task.assignee.email,
                subject: `New Task Assignment in ${task.project.name}`,
                body:  `<div style="max-width: 600px;">
                        <h2>Hi ${task.assignee.name}, </h2><p>You have been assigned a new task:</p>
                        </div>`
            })

        if(new Date(task.due_date).toLocaleDateString !== new Date().toLocaleDateString){
            await step.sleepUntil("wait-until-due-date", new Date(task.due_date))
      
            await step.run("check-if-task-completed", async() => {
                const task = await prisma.task.findUnique({
                            where: { id: taskId },
                            include: { assignee: true, project: true }
                             });
                if (!task) return;

                // Check if task status is not done
                if(task.status!== 'Done'){
                    await step.run('send-reminder-email', async() => {
                        await sendMail({
                            to: task.assignee.email,
                            subject: `Reminder for the ${task.project.name}`,
                            body: `<div style="max-width: 600px;">
                                    <h2>Hi ${task.assignee.name}, </h2><p>You have been assigned a new task:</p>
                                    </div>`
                        })
                    })
                }
            })
        }

    }
)

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdate, syncWorkspaceSave, syncWorkspaceUpdate, syncWorkspaceDelete, syncWorkspaceMemberAdd, sendTaskAssignmentEmail];
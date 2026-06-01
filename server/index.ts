import express from 'express';
import workspaceRouter from './routes/workspaceRoutes.ts';
import { protect } from './middlewares/authMiddleware.ts';
import dotenv from 'dotenv';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'
import projectRouter from './routes/projectRoutes.ts';
import taskRouter from './routes/taskRoutes.ts';
import commentRouter from './routes/commentRoutes.ts';

dotenv.config();

const app = express();

const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(clerkMiddleware({ secretKey: process.env.CLERK_SECRET_KEY }));
// Middleware
//app.use('api/inngest', serve({client: inngest, functions}));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});
app.use('/api/workspaces', protect, workspaceRouter);
app.use('/api/project', protect, projectRouter);
app.use('/api/tasks', protect, taskRouter);
app.use('/api/comments', protect, commentRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
})


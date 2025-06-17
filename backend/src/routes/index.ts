import { Router } from 'express';
import { authRoutes } from './authRoutes';
// import { userRoutes } from './userRoutes';
// import { boardRoutes } from './boardRoutes';
// import { taskRoutes } from './taskRoutes';
// import { notificationRoutes } from './notificationRoutes';

export function setupRoutes(): Router {
  const router = Router();

  // Mount route modules
  router.use('/auth', authRoutes);
  //   router.use('/users', userRoutes);
  //   router.use('/boards', boardRoutes);
  //   router.use('/tasks', taskRoutes);
  //   router.use('/notifications', notificationRoutes);

  return router;
}

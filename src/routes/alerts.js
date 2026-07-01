import { Router } from 'express';
import * as alertsController from '../controllers/alertsController.js';

export const alertsRouter = Router();

alertsRouter.post('/create', alertsController.createGlobalAlert);
alertsRouter.post('/', alertsController.createOne);
alertsRouter.get('/', alertsController.getAll);
alertsRouter.get('/:id', alertsController.getOne);
alertsRouter.patch('/:id', alertsController.updateOne);
alertsRouter.delete('/:id', alertsController.deleteOne);

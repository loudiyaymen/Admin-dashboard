import { Router } from 'express';
import * as announcementsController from '../controllers/announcementsController.js';

export const announcementsRouter = Router();

announcementsRouter.post('/', announcementsController.createOne);
announcementsRouter.get('/', announcementsController.getAll);
announcementsRouter.get('/:id', announcementsController.getOne);
announcementsRouter.patch('/:id', announcementsController.updateOne);
announcementsRouter.delete('/:id', announcementsController.deleteOne);

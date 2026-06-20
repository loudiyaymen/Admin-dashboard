import { Router } from 'express';
import * as campusesController from '../controllers/campusesController.js';

export const campusesRouter = Router();

campusesRouter.post('/', campusesController.createOne);
campusesRouter.get('/', campusesController.getAll);
campusesRouter.get('/:id', campusesController.getOne);
campusesRouter.patch('/:id', campusesController.updateOne);
campusesRouter.delete('/:id', campusesController.deleteOne);

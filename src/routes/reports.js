import { Router } from 'express';
import * as reportsController from '../controllers/reportsController.js';

export const reportsRouter = Router();

reportsRouter.get('/', reportsController.getAll);
reportsRouter.get('/:id', reportsController.getOne);
reportsRouter.delete('/:id', reportsController.deleteOne);

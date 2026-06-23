import { Router } from 'express';
import * as floorsController from '../controllers/floorsController.js';

export const floorsRouter = Router();

floorsRouter.post('/', floorsController.createOne);
floorsRouter.get('/', floorsController.getAll);
floorsRouter.get('/:id', floorsController.getOne);
floorsRouter.patch('/:id', floorsController.updateOne);
floorsRouter.delete('/:id', floorsController.deleteOne);


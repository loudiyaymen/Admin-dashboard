import { Router } from 'express';
import * as buildingsController from '../controllers/buildingsController.js';

export const buildingsRouter = Router();

buildingsRouter.post('/', buildingsController.createOne);
buildingsRouter.get('/', buildingsController.getAll);
buildingsRouter.get('/:id', buildingsController.getOne);
buildingsRouter.patch('/:id', buildingsController.updateOne);
buildingsRouter.delete('/:id', buildingsController.deleteOne);

import { Router } from 'express';
import * as sosController from '../controllers/sosController.js';

export const sosRouter = Router();

sosRouter.post('/trigger', sosController.trigger);
sosRouter.post('/end/:sosId', sosController.end);
sosRouter.get('/', sosController.getAll);
sosRouter.get('/:id', sosController.getOne);
sosRouter.patch('/:id', sosController.updateOne);

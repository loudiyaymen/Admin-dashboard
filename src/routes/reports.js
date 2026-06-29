// This file defines the routes for handling report-related operations in the admin dashboard.
//added more allowed fle to match the uploadFileLocal *delete comment before pushing*
import { Router } from 'express';
import multer from 'multer';
import * as reportsController from '../controllers/reportsController.js';

const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5bm limit
    fileFilter: (req, file, cb) => {
        const allowed = [
        'image/jpeg',
        'image/png',
        'image/heic',
        'image/heif',
        'image/webp', 
        'application/pdf'
    ];
        allowed.includes(file.mimetype)
        ? cb(null, true)
        : cb(new Error('File type not allowed'), false);
    }

});

export const reportsRouter = Router();

reportsRouter.post('/', upload.single('photo'), reportsController.createOne);
reportsRouter.get('/', reportsController.getAll);
reportsRouter.get('/:id', reportsController.getOne);
reportsRouter.patch('/:id', reportsController.updateOne);
reportsRouter.delete('/:id', reportsController.deleteOne);

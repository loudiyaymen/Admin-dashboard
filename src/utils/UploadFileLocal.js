// logic for making a unique filename for the uploaded file and saving it to a local directory

import path from 'path';
import fs from 'fs';

const mimeToExt = {
    'image/jpeg':    '.jpg',
  'image/png':       '.png',
  'image/heic':      '.heic',  
  'image/heif':      '.heif',
  'image/webp':      '.webp',
  'application/pdf': '.pdf',
};

    export function uploadFileLocal(file) {
        const datePart    = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const idPart      = Date.now();
        const ext         = mimeToExt[file.mimetype] || '.bin';
        const newFilename = `${datePart}-${idPart}${ext}`;
        const newPath     = path.join('uploads', newFilename);
     
       try{
        fs.renameSync(file.path, newPath);
       }catch(error){
        console.error('Error moving file:', error);
        throw new Error('Failed to save uploaded file'); //for reports
       }
    return newPath;
       }



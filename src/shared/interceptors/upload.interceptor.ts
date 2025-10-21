import { BadRequestException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';

export function uploadInterceptor(fieldName: string, folder: string, maxCount = 1) {
    const commonOptions = {
        storage: diskStorage({
            destination: `uploads/${folder}`,
            filename: (_req, file, cb) => {
                const name = randomUUID() + extname(file.originalname);
                cb(null, name);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
            const mime = file.mimetype.toLowerCase();
            if (allowedTypes.includes(mime)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Only JPEG, PNG, GIF, SVG images are allowed'), false);
            }
        },
    };
    return UseInterceptors(
        maxCount === 1
            ? FileInterceptor(fieldName, commonOptions)
            : FilesInterceptor(fieldName, maxCount, commonOptions),
    );
}

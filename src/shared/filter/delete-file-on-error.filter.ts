import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
@Catch(HttpException)
export class DeleteFileOnErrorFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const status = exception.getStatus();
        if (status === 400) {
            const ctx = host.switchToHttp();
            const req = ctx.getRequest<Request>();

            const files: Express.Multer.File[] = req.file
                ? [req.file]
                : Array.isArray((req as any).files)
                  ? (req as any).files
                  : [];

            files.forEach((file) => {
                if (file.path) {
                    fs.unlink(file.path, (err) => {
                        if (err) console.error('Failed to delete file:', err);
                    });
                }
            });
        }
        throw exception;
    }
}

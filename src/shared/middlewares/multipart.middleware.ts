// import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
// import * as multer from 'multer';

// @Injectable()
// export class MultipartMiddleware implements NestMiddleware {
//     private multerParser = multer({ limits: { fieldSize: 5 * 1024 * 1024 } }).none();

//     use(req: Request, res: Response, next: NextFunction) {
//         const ct = req.headers['content-type'];
//         if (typeof ct === 'string' && ct.startsWith('multipart/form-data')) {
//             this.multerParser(req, res, (err: any) => {
//                 if (err) {
//                     if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FIELD_SIZE') {
//                         return next(new BadRequestException('Uploaded data exceeds allowed size'));
//                     }
//                     if (err.code === 'LIMIT_UNEXPECTED_FILE') {
//                         return next(new BadRequestException('File uploads are not allowed on this endpoint'));
//                     }
//                     return next(err);
//                 }
//                 return next();
//             });
//         } else {
//             return next();
//         }
//     }
// }

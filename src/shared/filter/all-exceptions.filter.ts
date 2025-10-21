import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();

        // So translated validation survives
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            return res.status(status).json(response);
        }

        // Not an HttpException ?
        this.logger.error('Unhandled Exception', exception as any);
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
            statusCode: status,
            message: 'Internal Server Error',
        });
    }
}

// const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

// const message =
//     exception instanceof HttpException
//         ? (exception.getResponse() as any).message || exception.message
//         : 'Internal server error';

// const stack = exception instanceof Error ? exception.stack : undefined;

// console.error(`[${req.method}] ${req.url}`, {
//     status,
//     message,
//     ...(stack && { stack }),
// });

// res.status(status).json({
//     status: 'error',
//     message,
//     data: null,
//     ...(process.env.NODE_ENV !== 'production' && { stack }), // include stack trace only in dev
// });
//     }
// }

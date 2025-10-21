import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            return res.status(status).json(response);
        }

        this.logger.error('Unhandled Exception', exception as any);
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json({
            statusCode: status,
            message: 'Internal Server Error',
        });
    }
}

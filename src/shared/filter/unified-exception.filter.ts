import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';
import { Response } from 'express';

@Catch()
export class UnifiedExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const i18n = I18nContext.current(host);

        // Extract stack trace from any error type
        const stack =
            exception instanceof Error
                ? exception.stack
                : typeof exception === 'object'
                  ? JSON.stringify(exception, null, 2)
                  : String(exception);

        // Handle I18n Validation Errors
        if (exception instanceof I18nValidationException) {
            const errors = this.formatI18nValidationErrors(exception.errors, i18n);
            return response.status(HttpStatus.BAD_REQUEST).json({
                message: 'Validation failed',
                errors: { ...errors },
            });
        }

        // Handle Other HTTP Exceptions
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            const message = this.getExceptionMessage(exceptionResponse, i18n);

            return response.status(status).json({
                message,
                // stack,
            });
        }

        // Handle Non-HTTP Exceptions
        console.error(exception);
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Internal server error',
            stack,
        });
    }

    private getExceptionMessage(exceptionResponse: any, i18n?: I18nContext): string {
        if (typeof exceptionResponse === 'string') {
            return this.safeTranslate(i18n, exceptionResponse);
        }

        // Handle object responses
        const responseObj = exceptionResponse as Record<string, any>;

        // Handle array messages
        if (Array.isArray(responseObj.message)) {
            return responseObj.message.map((m) => this.safeTranslate(i18n, m)).join(', ');
        }

        // Handle single message
        return this.safeTranslate(i18n, responseObj.message) || 'Unknown error';
    }

    private formatI18nValidationErrors(errors: any[], i18n?: I18nContext): object {
        return errors.reduce((acc, err) => {
            if (err.constraints) {
                // Extract only the message keys (before the pipe)
                const messages = Object.values(err.constraints).map((constraint) => {
                    // Extract only the message key (before the pipe)
                    const messageKey = String(constraint).split('|')[0].trim();
                    return this.safeTranslate(i18n, messageKey);
                });
                acc[err.property] = messages;
            } else if (err.children?.length) {
                acc[err.property] = this.formatI18nValidationErrors(err.children, i18n);
            }
            return acc;
        }, {});
    }

    private safeTranslate(i18n: I18nContext | undefined, key: string): string {
        try {
            // Skip translation if key is empty
            if (!key || key.trim() === '') return '';

            // Attempt translation
            return i18n?.t(key) || key;
        } catch {
            return key;
        }
    }
}

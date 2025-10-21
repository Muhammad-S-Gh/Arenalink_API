import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nContext } from 'nestjs-i18n/dist';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
        const i18n = I18nContext.current(context);
        return next.handle().pipe(
            map((result) => {
                if (result && typeof result === 'object' && 'data' in result && 'message' in result) {
                    const { data, message } = result as any;
                    return { status: 'success', message, data };
                }

                if (result && typeof result === 'object' && 'message' in result) {
                    return {
                        status: 'success',
                        message: (result as any).message,
                        data: null,
                    };
                }

                return {
                    status: 'success',
                    message: i18n?.t('common.operationCompleted') || 'Operation completed successfully',
                    data: result as T,
                };
            }),
        );
    }
}

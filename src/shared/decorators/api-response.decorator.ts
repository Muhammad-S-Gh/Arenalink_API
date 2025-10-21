import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiResponseSchema<TModel extends Type<unknown>>(model: TModel) {
    return applyDecorators(
        ApiExtraModels(model),
        ApiOkResponse({
            schema: {
                properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    data: { $ref: getSchemaPath(model) },
                },
            },
        }),
    );
}

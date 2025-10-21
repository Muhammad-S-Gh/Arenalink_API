import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

// Restricts TModel to be a class constructor type—something Swagger can reflect on
export function ApiResponseSchema<TModel extends Type<unknown>>(model: TModel) {
    // Combines multiple decorators into one. You’ll use this on controllers to apply both Swagger transformations.
    return applyDecorators(
        // Informs Swagger to include the referenced model's schema in the documentation—even though it’s nested under data.
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

import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsUniqueConstraint } from '../is-unique.constraint';

export function IsUnique(entity: Function, column: string, options?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'IsUnique',
            target: object.constructor,
            propertyName,
            options,
            constraints: [entity, column],
            validator: IsUniqueConstraint,
        });
    };
}

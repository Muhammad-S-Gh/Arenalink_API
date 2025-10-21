import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsFutureDateConstraint } from '../is-future.validator';

export function IsFutureDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsFutureDateConstraint,
        });
    };
}

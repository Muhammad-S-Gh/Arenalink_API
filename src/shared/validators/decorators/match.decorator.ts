import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function Match(property: string, options?: ValidationOptions) {
    return (object: any, propertyName: string) => {
        registerDecorator({
            name: 'Match',
            target: object.constructor,
            propertyName,
            options,
            constraints: [property],
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return value === relatedValue;
                },
                defaultMessage(args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    return `${propertyName} must match ${relatedPropertyName}`;
                },
            },
        });
    };
}

// The @Match() factory sets up a decorator on passwordConfirmation.

// It registers a validate() function that:

// Retrieves args.constraints[0] → 'password'

// Reads the actual password value from args.object

// Compares it with passwordConfirmation (value === relatedValue)

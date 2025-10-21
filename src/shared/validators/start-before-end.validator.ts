import { Injectable } from '@nestjs/common';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'StartBeforeEnd', async: false })
@Injectable()
export class StartBeforeEnd implements ValidatorConstraintInterface {
    validate(value: any, args?: ValidationArguments): boolean {
        const obj = args?.object as any;
        const [h1, m1] = obj.startTime.split(':').map(Number);
        const [h2, m2] = obj.endTime.split(':').map(Number);
        return h1 * 60 + m1 < h2 * 60 + m2;
    }
    defaultMessage(validationArguments?: ValidationArguments): string {
        return 'schedules.start_before_end';
    }
}

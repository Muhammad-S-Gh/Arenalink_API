import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IntervalRange', async: false })
export class IntervalRange implements ValidatorConstraintInterface {
    validate(value: any, args?: ValidationArguments): boolean {
        const obj = args?.object as { startTime: string; endTime: string };

        const [hI, mI] = value.split(':').map(Number);
        const intervalMins = hI * 60 + mI;

        if (intervalMins < 30 || intervalMins > 720) {
            return false;
        }

        const [h1, m1] = obj.startTime.split(':').map(Number);
        const [h2, m2] = obj.endTime.split(':').map(Number);
        const spanMins = h2 * 60 + m2 - (h1 * 60 + m1);

        return intervalMins <= spanMins;
    }
    defaultMessage(args: ValidationArguments): string {
        return 'schedules.invalidIntervalRange';
    }
}

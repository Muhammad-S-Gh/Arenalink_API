import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'IsFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
    validate(value: any, _validationArguments?: ValidationArguments): boolean {
        if (value === null || value === undefined || value === '') return false;

        const valueLocalMidnight = this.toLocalMidnight(value);
        if (valueLocalMidnight === null) return false;

        const now = new Date();
        const todayLocalMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

        return valueLocalMidnight.getTime() >= todayLocalMidnight;
    }

    defaultMessage(_args: ValidationArguments) {
        return 'Date must be today or a future date.';
    }

    // ---- helpers ----
    private toLocalMidnight(value: any): Date | null {
        if (value instanceof Date) {
            if (isNaN(value.getTime())) return null;
            return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
        }

        if (typeof value === 'string') {
            const s = value.trim();
            const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (m) {
                const year = Number(m[1]);
                const month = Number(m[2]);
                const day = Number(m[3]);
                if (!this.isValidDateParts(year, month, day)) return null;
                // create local-midnight (month - 1 because Date months are 0-based)
                const d = new Date(year, month - 1, day, 0, 0, 0, 0);
                if (isNaN(d.getTime())) return null;
                return d;
            }

            // fallback: try Date parsing (last resort) and normalize
            const parsed = new Date(s);
            if (!isNaN(parsed.getTime())) {
                return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
            }

            return null;
        }

        // unsupported type
        return null;
    }

    private isValidDateParts(year: number, month: number, day: number): boolean {
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        // quick sanity check to reject things like 2025-02-30
        const d = new Date(year, month - 1, day);
        return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
    }
}

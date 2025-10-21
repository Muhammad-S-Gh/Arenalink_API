import { Injectable } from '@nestjs/common';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { EntityManager } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
    constructor(private readonly em: EntityManager) {}

    async validate(value: any, args?: ValidationArguments): Promise<boolean> {
        const [entity, column] = args?.constraints as [Function, string];
        const exists = await this.em
            .getRepository(entity as any)
            .createQueryBuilder()
            .where({ [column]: value })
            .getExists();

        return !exists;
    }

    defaultMessage(args?: ValidationArguments): string {
        const column = args?.property;
        return `${column} already exists`;
    }
}

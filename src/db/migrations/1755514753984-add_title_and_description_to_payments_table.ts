import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTitleAndDescriptionToPaymentsTable1755514753984 implements MigrationInterface {
    name = 'AddTitleAndDescriptionToPaymentsTable1755514753984'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "response" TO "title"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "title" TO "response"`);
    }

}

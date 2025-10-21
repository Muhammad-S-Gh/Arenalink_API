import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIntentIdToPaymentsTable1755356741390 implements MigrationInterface {
    name = 'AddIntentIdToPaymentsTable1755356741390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "stripe_payment_intent_id" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "stripe_payment_intent_id"`);
    }

}

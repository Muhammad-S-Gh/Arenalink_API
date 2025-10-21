import { MigrationInterface, QueryRunner } from "typeorm";

export class StripeConfiguration1755339787774 implements MigrationInterface {
    name = 'StripeConfiguration1755339787774'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "price" TO "amount_cents"`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD "price_cents" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "stripe_customer_id" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount_cents"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "amount_cents" bigint NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_reservation_slot_date" ON "reservations" ("facility_slot_id", "date") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."uq_reservation_slot_date"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount_cents"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "amount_cents" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripe_customer_id"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP COLUMN "price_cents"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "amount_cents" TO "price"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSlotPriceCentsToSlotsTable1755299254851 implements MigrationInterface {
    name = 'AddSlotPriceCentsToSlotsTable1755299254851'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facility_slots" ADD "slot_price_cents" bigint NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facility_slots" DROP COLUMN "slot_price_cents"`);
    }

}

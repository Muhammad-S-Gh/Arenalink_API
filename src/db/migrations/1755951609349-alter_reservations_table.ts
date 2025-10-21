import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterReservationsTable1755951609349 implements MigrationInterface {
    name = 'AlterReservationsTable1755951609349'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."uq_reservation_slot_date"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_reservation_slot_date" ON "reservations" ("date", "facility_slot_id") `);
    }

}

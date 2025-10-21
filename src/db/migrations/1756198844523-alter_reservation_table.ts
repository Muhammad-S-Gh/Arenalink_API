import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterReservationTable1756198844523 implements MigrationInterface {
    name = 'AlterReservationTable1756198844523'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_cbd25a7889f43867828deac7de0"`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_cbd25a7889f43867828deac7de0" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_cbd25a7889f43867828deac7de0"`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_cbd25a7889f43867828deac7de0" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}

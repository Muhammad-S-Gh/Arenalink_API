import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterReservationsStatus1756039273417 implements MigrationInterface {
    name = 'AlterReservationsStatus1756039273417'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."reservations_status_enum" RENAME TO "reservations_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."reservations_status_enum" AS ENUM('pending', 'confirmed', 'declined', 'blocked')`);
        await queryRunner.query(`ALTER TABLE "reservations" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "reservations" ALTER COLUMN "status" TYPE "public"."reservations_status_enum" USING "status"::"text"::"public"."reservations_status_enum"`);
        await queryRunner.query(`ALTER TABLE "reservations" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."reservations_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reservations_status_enum_old" AS ENUM('pending', 'confirmed', 'declined')`);
        await queryRunner.query(`ALTER TABLE "reservations" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "reservations" ALTER COLUMN "status" TYPE "public"."reservations_status_enum_old" USING "status"::"text"::"public"."reservations_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "reservations" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."reservations_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."reservations_status_enum_old" RENAME TO "reservations_status_enum"`);
    }

}

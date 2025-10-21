import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReservationsTable1754511591115 implements MigrationInterface {
    name = 'CreateReservationsTable1754511591115'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."reservations_day_of_week_enum" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')`);
        await queryRunner.query(`CREATE TYPE "public"."reservations_status_enum" AS ENUM('pending', 'confirmed', 'declined')`);
        await queryRunner.query(`CREATE TABLE "reservations" ("id" BIGSERIAL NOT NULL, "date" date NOT NULL, "day_of_week" "public"."reservations_day_of_week_enum" NOT NULL, "start_time" TIME(0) NOT NULL, "end_time" TIME(0) NOT NULL, "status" "public"."reservations_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" bigint, "facility_id" bigint, "facility_availability_id" bigint, "facility_slot_id" bigint, CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_4af5055a871c46d011345a255a6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_cbd25a7889f43867828deac7de0" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_eabea00cdd165e13c8a98f9e28f" FOREIGN KEY ("facility_availability_id") REFERENCES "facility_availability"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_cda871674a8f21a34b571e34a7c" FOREIGN KEY ("facility_slot_id") REFERENCES "facility_slots"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_cda871674a8f21a34b571e34a7c"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_eabea00cdd165e13c8a98f9e28f"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_cbd25a7889f43867828deac7de0"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_4af5055a871c46d011345a255a6"`);
        await queryRunner.query(`DROP TABLE "reservations"`);
        await queryRunner.query(`DROP TYPE "public"."reservations_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reservations_day_of_week_enum"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFacilityAvailabilityTable1754466158211 implements MigrationInterface {
    name = 'CreateFacilityAvailabilityTable1754466158211'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."facility_availability_day_of_week_enum" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')`);
        await queryRunner.query(`CREATE TABLE "facility_availability" ("id" BIGSERIAL NOT NULL, "day_of_week" "public"."facility_availability_day_of_week_enum" NOT NULL, "start_time" TIME(0) NOT NULL, "end_time" TIME(0) NOT NULL, "slot_interval" interval NOT NULL, "slot_price" numeric(10,2) NOT NULL, "is_available" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "facility_id" bigint, CONSTRAINT "PK_f277ffff885883eab6278b0eb69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "facility_availability" ADD CONSTRAINT "FK_7c03f1309752569594202eacf33" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facility_availability" DROP CONSTRAINT "FK_7c03f1309752569594202eacf33"`);
        await queryRunner.query(`DROP TABLE "facility_availability"`);
        await queryRunner.query(`DROP TYPE "public"."facility_availability_day_of_week_enum"`);
    }

}

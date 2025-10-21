import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFacilityDaysOffTable1754479131007 implements MigrationInterface {
    name = 'CreateFacilityDaysOffTable1754479131007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."facility_days_off_day_of_week_enum" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')`);
        await queryRunner.query(`CREATE TABLE "facility_days_off" ("id" BIGSERIAL NOT NULL, "day_of_week" "public"."facility_days_off_day_of_week_enum" NOT NULL, "date" date, "reason" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "facility_id" bigint, CONSTRAINT "PK_39089a1b1c046141aa4ad47ccd1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "facility_days_off" ADD CONSTRAINT "FK_173674af8dce293a6e28038005f" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facility_days_off" DROP CONSTRAINT "FK_173674af8dce293a6e28038005f"`);
        await queryRunner.query(`DROP TABLE "facility_days_off"`);
        await queryRunner.query(`DROP TYPE "public"."facility_days_off_day_of_week_enum"`);
    }

}

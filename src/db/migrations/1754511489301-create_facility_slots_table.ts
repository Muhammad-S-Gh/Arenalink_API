import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFacilitySlotsTable1754511489301 implements MigrationInterface {
    name = 'CreateFacilitySlotsTable1754511489301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facilities" DROP CONSTRAINT "FK_a66f5b5aadfc8b8a20d1fe35c54"`);
        await queryRunner.query(`CREATE TYPE "public"."facility_slots_day_of_week_enum" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')`);
        await queryRunner.query(`CREATE TABLE "facility_slots" ("id" BIGSERIAL NOT NULL, "day_of_week" "public"."facility_slots_day_of_week_enum" NOT NULL, "slot_price" numeric(10,2) NOT NULL, "start_time" TIME(0) NOT NULL, "end_time" TIME(0) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "facility_id" bigint, "facility_availability_id" bigint, CONSTRAINT "PK_d09f69adbc48e23e50bce4fbe2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "facility_availability" DROP COLUMN "slot_price"`);
        await queryRunner.query(`ALTER TABLE "facility_slots" ADD CONSTRAINT "FK_956c8410525f1027c8c00bc6cfa" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "facility_slots" ADD CONSTRAINT "FK_154fb3e5ff9ceb91867d3c04712" FOREIGN KEY ("facility_availability_id") REFERENCES "facility_availability"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "facilities" ADD CONSTRAINT "FK_a66f5b5aadfc8b8a20d1fe35c54" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facilities" DROP CONSTRAINT "FK_a66f5b5aadfc8b8a20d1fe35c54"`);
        await queryRunner.query(`ALTER TABLE "facility_slots" DROP CONSTRAINT "FK_154fb3e5ff9ceb91867d3c04712"`);
        await queryRunner.query(`ALTER TABLE "facility_slots" DROP CONSTRAINT "FK_956c8410525f1027c8c00bc6cfa"`);
        await queryRunner.query(`ALTER TABLE "facility_availability" ADD "slot_price" numeric(10,2) NOT NULL`);
        await queryRunner.query(`DROP TABLE "facility_slots"`);
        await queryRunner.query(`DROP TYPE "public"."facility_slots_day_of_week_enum"`);
        await queryRunner.query(`ALTER TABLE "facilities" ADD CONSTRAINT "FK_a66f5b5aadfc8b8a20d1fe35c54" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

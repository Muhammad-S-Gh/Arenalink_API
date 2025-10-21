import { MigrationInterface, QueryRunner } from "typeorm";

export class CreaetFacilitiesTable1754134828802 implements MigrationInterface {
    name = 'CreaetFacilitiesTable1754134828802'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."facilities_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "facilities" ("id" BIGSERIAL NOT NULL, "name" jsonb NOT NULL, "description" jsonb NOT NULL, "lat" numeric(10,7) NOT NULL, "lng" numeric(10,7) NOT NULL, "pricePerHour" numeric(10,2) NOT NULL, "images" jsonb NOT NULL DEFAULT '[]', "status" "public"."facilities_status_enum" NOT NULL DEFAULT 'inactive', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "owner_id" bigint, "category_id" bigint, CONSTRAINT "PK_2e6c685b2e1195e6d6394a22bc7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "facilities" ADD CONSTRAINT "FK_a66f5b5aadfc8b8a20d1fe35c54" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "facilities" ADD CONSTRAINT "FK_8b37d8973aff8ccb0b1ec4124d1" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facilities" DROP CONSTRAINT "FK_8b37d8973aff8ccb0b1ec4124d1"`);
        await queryRunner.query(`ALTER TABLE "facilities" DROP CONSTRAINT "FK_a66f5b5aadfc8b8a20d1fe35c54"`);
        await queryRunner.query(`DROP TABLE "facilities"`);
        await queryRunner.query(`DROP TYPE "public"."facilities_status_enum"`);
    }

}

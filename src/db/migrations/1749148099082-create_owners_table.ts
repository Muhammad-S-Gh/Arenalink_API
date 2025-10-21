import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOwnersTable1749148099082 implements MigrationInterface {
    name = 'CreateOwnersTable1749148099082'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."owners_status_enum" AS ENUM('pending', 'approved', 'denied')`);
        await queryRunner.query(`CREATE TABLE "owners" ("id" BIGSERIAL NOT NULL, "status" "public"."owners_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" bigint, CONSTRAINT "REL_f6bd589d3b8a701bf4e96ea932" UNIQUE ("user_id"), CONSTRAINT "PK_42838282f2e6b216301a70b02d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "owners" ADD CONSTRAINT "FK_f6bd589d3b8a701bf4e96ea9323" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owners" DROP CONSTRAINT "FK_f6bd589d3b8a701bf4e96ea9323"`);
        await queryRunner.query(`DROP TABLE "owners"`);
        await queryRunner.query(`DROP TYPE "public"."owners_status_enum"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePhonesTable1749156822468 implements MigrationInterface {
    name = 'CreatePhonesTable1749156822468'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "phones" ("id" BIGSERIAL NOT NULL, "phone_number" character varying, "phone_number_otp_code" character varying, "phone_number_otp_expired_date" TIMESTAMP, "phone_number_verified_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" bigint, CONSTRAINT "REL_0c650d6af3574662fad5d2a3ef" UNIQUE ("user_id"), CONSTRAINT "PK_30d7fc09a458d7a4d9471bda554" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "phones" ADD CONSTRAINT "FK_0c650d6af3574662fad5d2a3ef2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "phones" DROP CONSTRAINT "FK_0c650d6af3574662fad5d2a3ef2"`);
        await queryRunner.query(`DROP TABLE "phones"`);
    }

}

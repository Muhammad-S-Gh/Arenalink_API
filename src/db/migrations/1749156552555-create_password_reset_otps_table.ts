import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePasswordResetOtpsTable1749156552555 implements MigrationInterface {
    name = 'CreatePasswordResetOtpsTable1749156552555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "password_reset_otps" ("id" BIGSERIAL NOT NULL, "otp_code" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" bigint, CONSTRAINT "PK_0b4f4c493a1ee383f93ff3a5017" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "password_reset_otps" ADD CONSTRAINT "FK_a4a5ac367f438cfef8fa13e8023" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_otps" DROP CONSTRAINT "FK_a4a5ac367f438cfef8fa13e8023"`);
        await queryRunner.query(`DROP TABLE "password_reset_otps"`);
    }

}

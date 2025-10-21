import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeTokenToTextInPatTable1751556303044 implements MigrationInterface {
    name = 'ChangeTokenToTextInPatTable1751556303044'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "personal_access_tokens" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "personal_access_tokens" ADD "token" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "personal_access_tokens" DROP COLUMN "token"`);
        await queryRunner.query(`ALTER TABLE "personal_access_tokens" ADD "token" character varying(64) NOT NULL`);
    }

}

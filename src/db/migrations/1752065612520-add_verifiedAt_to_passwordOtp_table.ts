import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVerifiedAtToPasswordOtpTable1752065612520 implements MigrationInterface {
    name = 'AddVerifiedAtToPasswordOtpTable1752065612520'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_otps" ADD "verified_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_otps" DROP COLUMN "verified_at"`);
    }

}

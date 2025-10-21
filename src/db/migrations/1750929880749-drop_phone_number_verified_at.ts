import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPhoneNumberVerifiedAtTable1750929880749 implements MigrationInterface {
    name = 'DropPhoneNumberVerifiedAtTable1750929880749';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "phones" DROP COLUMN "phone_number_verified_at"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "phones" ADD "phone_number_verified_at" TIMESTAMP`);
    }
}

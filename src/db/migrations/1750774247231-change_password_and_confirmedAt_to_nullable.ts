import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangePasswordAndConfirmedAtToNullable1750774247231 implements MigrationInterface {
    name = 'ChangePasswordAndConfirmedAtToNullable1750774247231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "confirmed_at" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "confirmed_at" SET NOT NULL`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class NullifyAttributesAccrossTables1752150839364 implements MigrationInterface {
    name = 'NullifyAttributesAccrossTables1752150839364'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "personal_access_tokens" ALTER COLUMN "expires_at" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "personal_access_tokens" ALTER COLUMN "expires_at" DROP NOT NULL`);
    }

}

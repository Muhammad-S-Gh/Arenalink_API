import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangePlatformTypeToEnum1751559212419 implements MigrationInterface {
    name = 'ChangePlatformTypeToEnum1751559212419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" DROP COLUMN "platform"`);
        await queryRunner.query(`CREATE TYPE "public"."user_fcm_tokens_platform_enum" AS ENUM('web', 'android', 'ios')`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" ADD "platform" "public"."user_fcm_tokens_platform_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" DROP COLUMN "platform"`);
        await queryRunner.query(`DROP TYPE "public"."user_fcm_tokens_platform_enum"`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" ADD "platform" character varying`);
    }

}

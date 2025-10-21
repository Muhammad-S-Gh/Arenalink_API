import { MigrationInterface, QueryRunner } from "typeorm";

export class AllowMultipleFcmTokensPerUser1756293082339 implements MigrationInterface {
    name = 'AllowMultipleFcmTokensPerUser1756293082339'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" DROP CONSTRAINT "FK_869ca568c4ec52322f1681b1a3f"`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" DROP CONSTRAINT "REL_869ca568c4ec52322f1681b1a3"`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "FK_869ca568c4ec52322f1681b1a3f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" DROP CONSTRAINT "FK_869ca568c4ec52322f1681b1a3f"`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "REL_869ca568c4ec52322f1681b1a3" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "FK_869ca568c4ec52322f1681b1a3f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}

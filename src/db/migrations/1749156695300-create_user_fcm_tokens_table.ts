import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserFcmTokensTable1749156695300 implements MigrationInterface {
    name = 'CreateUserFcmTokensTable1749156695300'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_fcm_tokens" ("id" BIGSERIAL NOT NULL, "fcm_token" text NOT NULL, "platform" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "token_id" bigint, "user_id" bigint, CONSTRAINT "REL_ce5fbd4a61c05a58ba30ddc295" UNIQUE ("token_id"), CONSTRAINT "REL_869ca568c4ec52322f1681b1a3" UNIQUE ("user_id"), CONSTRAINT "PK_f8088ed7e1116e01a4033b6ca76" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "FK_ce5fbd4a61c05a58ba30ddc2951" FOREIGN KEY ("token_id") REFERENCES "personal_access_tokens"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "FK_869ca568c4ec52322f1681b1a3f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" DROP CONSTRAINT "FK_869ca568c4ec52322f1681b1a3f"`);
        await queryRunner.query(`ALTER TABLE "user_fcm_tokens" DROP CONSTRAINT "FK_ce5fbd4a61c05a58ba30ddc2951"`);
        await queryRunner.query(`DROP TABLE "user_fcm_tokens"`);
    }

}

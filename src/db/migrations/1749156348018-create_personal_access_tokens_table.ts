import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePersonalAccessTokensTable1749156348018 implements MigrationInterface {
    name = 'CreatePersonalAccessTokensTable1749156348018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "personal_access_tokens" ("id" BIGSERIAL NOT NULL, "tokenable_type" character varying NOT NULL, "tokenable_id" bigint NOT NULL, "token" character varying(64) NOT NULL, "abilities" text, "last_used_at" TIMESTAMP, "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b6dc462fa11dbbb897eb8419735" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "personal_access_tokens"`);
    }

}

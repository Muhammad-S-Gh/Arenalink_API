import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePaymentsTable1754511696286 implements MigrationInterface {
    name = 'CreatePaymentsTable1754511696286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'completed', 'declined')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" BIGSERIAL NOT NULL, "date" date NOT NULL DEFAULT ('now'::text)::date, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "stripe_client_secret" text, "stripe_webhook_payload" jsonb, "response" jsonb, "description" jsonb, "price" numeric(10,2) NOT NULL, "currency" character varying NOT NULL, "completed_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" bigint, "facility_id" bigint, "reservation_id" bigint, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_25c295758bb08072832ce6aa5ad" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_9ed5ff4942e09edfd44ee0ccf01" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_9ed5ff4942e09edfd44ee0ccf01"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_25c295758bb08072832ce6aa5ad"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    }

}

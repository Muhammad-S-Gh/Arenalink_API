import { MigrationInterface, QueryRunner } from "typeorm";

export class CreaetFacilityAttributeValueTable1754135219827 implements MigrationInterface {
    name = 'CreaetFacilityAttributeValueTable1754135219827'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "facility-attribute-values" ("id" BIGSERIAL NOT NULL, "value" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "facility_id" bigint, "category_attribute_id" bigint, CONSTRAINT "PK_efe17ad93a803c7058cd9563a17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" ADD CONSTRAINT "FK_a4de695afef107e3d72ded750eb" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" ADD CONSTRAINT "FK_b79be2bfff654107eec7ca83792" FOREIGN KEY ("category_attribute_id") REFERENCES "category_attributes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" DROP CONSTRAINT "FK_b79be2bfff654107eec7ca83792"`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" DROP CONSTRAINT "FK_a4de695afef107e3d72ded750eb"`);
        await queryRunner.query(`DROP TABLE "facility-attribute-values"`);
    }

}

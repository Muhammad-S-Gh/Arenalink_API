import { MigrationInterface, QueryRunner } from "typeorm";

export class AttributeValueTypeFix21755014449980 implements MigrationInterface {
    name = 'AttributeValueTypeFix21755014449980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" ADD "option_id" bigint`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" DROP COLUMN "value"`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" ADD "value" jsonb`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" ADD CONSTRAINT "FK_973c69cd1a2c16eabef1fcfbf19" FOREIGN KEY ("option_id") REFERENCES "category_attributes_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" DROP CONSTRAINT "FK_973c69cd1a2c16eabef1fcfbf19"`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" DROP COLUMN "value"`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" ADD "value" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" DROP COLUMN "option_id"`);
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" ADD CONSTRAINT "FK_eb33920ed986d50e9f8802719bd" FOREIGN KEY ("value") REFERENCES "category_attributes_options"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

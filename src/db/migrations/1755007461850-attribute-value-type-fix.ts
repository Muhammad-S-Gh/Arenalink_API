import { MigrationInterface, QueryRunner } from 'typeorm';

export class AttributeValueTypeFix1755007461850 implements MigrationInterface {
    name = 'AttributeValueTypeFix1755007461850';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop old FK constraint
        await queryRunner.query(
            `ALTER TABLE "facility-attribute-values" DROP CONSTRAINT IF EXISTS "FK_eb33920ed986d50e9f8802719bd"`
        );

        // Drop old value column
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" DROP COLUMN "value"`);

        // Add new jsonb value column
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" ADD "value" jsonb NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop jsonb column
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" DROP COLUMN "value"`);

        // Restore bigint column
        await queryRunner.query(`ALTER TABLE "facility-attribute-values" ADD "value" bigint NOT NULL`);

        // Restore foreign key to category_attributes_options
        await queryRunner.query(
            `ALTER TABLE "facility-attribute-values" ADD CONSTRAINT "FK_eb33920ed986d50e9f8802719bd"
             FOREIGN KEY ("value") REFERENCES "category_attributes_options"("id")
             ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }
}

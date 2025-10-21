import { MigrationInterface, QueryRunner } from 'typeorm';

export class UltraId1753168569380 implements MigrationInterface {
    name = 'UltraId1753168569380';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Safely drop FK: category_attributes_options → category_attributes
        await queryRunner.query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'FK_f86cf1fdd9733855c59c35bdc84'
            ) THEN
              ALTER TABLE "category_attributes_options" DROP CONSTRAINT "FK_f86cf1fdd9733855c59c35bdc84";
            END IF;
          END
          $$;
        `);
      
        // Safely drop FK: category_attributes → categories
        await queryRunner.query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'FK_55050a8a1b2d2f5202f226d4ac1'
            ) THEN
              ALTER TABLE "category_attributes" DROP CONSTRAINT "FK_55050a8a1b2d2f5202f226d4ac1";
            END IF;
          END
          $$;
        `);
      
        // Safely drop PK: category_attributes_options
        await queryRunner.query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'PK_20a14e9649e2f50bbb156b6915f'
            ) THEN
              ALTER TABLE "category_attributes_options" DROP CONSTRAINT "PK_20a14e9649e2f50bbb156b6915f";
            END IF;
          END
          $$;
        `);
      
        // Recreate 'id' column in category_attributes_options
        await queryRunner.query(`ALTER TABLE "category_attributes_options" DROP COLUMN IF EXISTS "id"`);
        await queryRunner.query(`ALTER TABLE "category_attributes_options" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`
          ALTER TABLE "category_attributes_options"
          ADD CONSTRAINT "PK_20a14e9649e2f50bbb156b6915f" PRIMARY KEY ("id")
        `);
      
        // Recreate 'attribute_id' column
        await queryRunner.query(`ALTER TABLE "category_attributes_options" DROP COLUMN IF EXISTS "attribute_id"`);
        await queryRunner.query(`ALTER TABLE "category_attributes_options" ADD "attribute_id" bigint`);
      
        // Safely drop PK from category_attributes
        await queryRunner.query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'PK_f58b128e30a1ad029b32fb79624'
            ) THEN
              ALTER TABLE "category_attributes" DROP CONSTRAINT "PK_f58b128e30a1ad029b32fb79624";
            END IF;
          END
          $$;
        `);
      
        // Recreate id in category_attributes
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP COLUMN IF EXISTS "id"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`
          ALTER TABLE "category_attributes"
          ADD CONSTRAINT "PK_f58b128e30a1ad029b32fb79624" PRIMARY KEY ("id")
        `);
      
        // Recreate category_id in category_attributes
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP COLUMN IF EXISTS "category_id"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ADD "category_id" bigint`);
      
        // Safely drop PK from categories
        await queryRunner.query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'PK_24dbc6126a28ff948da33e97d3b'
            ) THEN
              ALTER TABLE "categories" DROP CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b";
            END IF;
          END
          $$;
        `);
      
        // Recreate id in categories
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "id"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`
          ALTER TABLE "categories"
          ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
        `);
      
        // Re-add foreign keys with cascade
        await queryRunner.query(`
          ALTER TABLE "category_attributes_options"
          ADD CONSTRAINT "FK_f86cf1fdd9733855c59c35bdc84"
          FOREIGN KEY ("attribute_id") REFERENCES "category_attributes"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
        `);
      
        await queryRunner.query(`
          ALTER TABLE "category_attributes"
          ADD CONSTRAINT "FK_55050a8a1b2d2f5202f226d4ac1"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id")
          ON DELETE CASCADE ON UPDATE NO ACTION
        `);
      }
      

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP CONSTRAINT "FK_55050a8a1b2d2f5202f226d4ac1"`);
        await queryRunner.query(
            `ALTER TABLE "category_attributes_options" DROP CONSTRAINT "FK_f86cf1fdd9733855c59c35bdc84"`,
        );
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(
            `ALTER TABLE "categories" ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")`,
        );
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP COLUMN "category_id"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ADD "category_id" uuid`);
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP CONSTRAINT "PK_f58b128e30a1ad029b32fb79624"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(
            `ALTER TABLE "category_attributes" ADD CONSTRAINT "PK_f58b128e30a1ad029b32fb79624" PRIMARY KEY ("id")`,
        );
        await queryRunner.query(`ALTER TABLE "category_attributes_options" DROP COLUMN "attribute_id"`);
        await queryRunner.query(`ALTER TABLE "category_attributes_options" ADD "attribute_id" uuid`);
        await queryRunner.query(
            `ALTER TABLE "category_attributes_options" DROP CONSTRAINT "PK_20a14e9649e2f50bbb156b6915f"`,
        );
        await queryRunner.query(`ALTER TABLE "category_attributes_options" DROP COLUMN "id"`);
        await queryRunner.query(
            `ALTER TABLE "category_attributes_options" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`,
        );
        await queryRunner.query(
            `ALTER TABLE "category_attributes_options" ADD CONSTRAINT "PK_20a14e9649e2f50bbb156b6915f" PRIMARY KEY ("id")`,
        );
        await queryRunner.query(
            `ALTER TABLE "category_attributes" ADD CONSTRAINT "FK_55050a8a1b2d2f5202f226d4ac1" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "category_attributes_options" ADD CONSTRAINT "FK_f86cf1fdd9733855c59c35bdc84" FOREIGN KEY ("attribute_id") REFERENCES "category_attributes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }
}

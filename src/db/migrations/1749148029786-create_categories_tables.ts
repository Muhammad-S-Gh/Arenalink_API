import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTables1749148029786 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable UUID extension if not exists
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create enum type for attribute types
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attribute_type_enum') THEN
                    CREATE TYPE "attribute_type_enum" AS ENUM('string', 'number', 'boolean', 'enum');
                END IF;
            END
            $$;
        `);

        // Create categories table
        await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "name" JSONB NOT NULL,
                "icon" VARCHAR NOT NULL,
                "description" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create category_attributes table
        await queryRunner.query(`
            CREATE TABLE "category_attributes" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "category_id" UUID NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
                "name" JSONB NOT NULL,
                "type" "attribute_type_enum" NOT NULL DEFAULT 'string',
                "is_required" BOOLEAN NOT NULL DEFAULT false,
                "min_limit" INTEGER,
                "max_limit" INTEGER,
                "with_filters" BOOLEAN NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create category_attributes_options table
        await queryRunner.query(`
            CREATE TABLE "category_attributes_options" (
                "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                "attribute_id" UUID NOT NULL REFERENCES "category_attributes"("id") ON DELETE CASCADE,
                "name" JSONB NOT NULL
            )
        `);

        // Create indexes
        await queryRunner.query(
            `CREATE INDEX "IDX_category_attributes_category_id" ON "category_attributes" ("category_id")`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_category_options_attribute_id" ON "category_attributes_options" ("attribute_id")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "category_attributes_options"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "category_attributes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "attribute_type_enum"`);
    }
}

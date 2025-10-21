import { MigrationInterface, QueryRunner } from "typeorm";

export class IdToNumber1753634902331 implements MigrationInterface {
    name = 'IdToNumber1753634902331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."attribute_type_enum" RENAME TO "attribute_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."category_attributes_type_enum" AS ENUM('string', 'number', 'boolean', 'enum')`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ALTER COLUMN "type" TYPE "public"."category_attributes_type_enum" USING "type"::"text"::"public"."category_attributes_type_enum"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ALTER COLUMN "type" SET DEFAULT 'string'`);
        await queryRunner.query(`DROP TYPE "public"."attribute_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."attribute_type_enum_old" AS ENUM('string', 'number', 'boolean', 'enum')`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ALTER COLUMN "type" TYPE "public"."attribute_type_enum_old" USING "type"::"text"::"public"."attribute_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ALTER COLUMN "type" SET DEFAULT 'string'`);
        await queryRunner.query(`DROP TYPE "public"."category_attributes_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."attribute_type_enum_old" RENAME TO "attribute_type_enum"`);
    }

}

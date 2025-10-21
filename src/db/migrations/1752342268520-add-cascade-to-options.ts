import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeToOptions1752342268520 implements MigrationInterface {
    name = 'AddCascadeToOptions1752342268520';

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'FK_f86cf1fdd9733855c59c35bdc84'
          ) THEN
            ALTER TABLE category_attributes_options 
            DROP CONSTRAINT "FK_f86cf1fdd9733855c59c35bdc84";
          END IF;
        END
        $$;
      `);
    
      await queryRunner.query(`
        ALTER TABLE category_attributes_options 
        ADD CONSTRAINT "FK_f86cf1fdd9733855c59c35bdc84"
        FOREIGN KEY ("attribute_id") REFERENCES category_attributes(id)
        ON DELETE CASCADE
      `);
    }
    
  
    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`
        ALTER TABLE category_attributes_options 
        DROP CONSTRAINT "FK_f86cf1fdd9733855c59c35bdc84"
      `);
  
      await queryRunner.query(`
        ALTER TABLE category_attributes_options 
        ADD CONSTRAINT "FK_f86cf1fdd9733855c59c35bdc84"
        FOREIGN KEY ("attribute_id") REFERENCES category_attributes(id)
        ON DELETE NO ACTION
      `);
    }

}

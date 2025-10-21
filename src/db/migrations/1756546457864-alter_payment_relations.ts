import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterPaymentRelations1756546457864 implements MigrationInterface {
    name = 'AlterPaymentRelations1756546457864'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_25c295758bb08072832ce6aa5ad"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_25c295758bb08072832ce6aa5ad" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_25c295758bb08072832ce6aa5ad"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_25c295758bb08072832ce6aa5ad" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

import { Module } from '@nestjs/common';
import { Phone } from './phones.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhonesService } from './phones.service';

@Module({
    imports: [TypeOrmModule.forFeature([Phone])],
    providers: [PhonesService],
    exports: [PhonesService],
})
export class PhonesModule {}

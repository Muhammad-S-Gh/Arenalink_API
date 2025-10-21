import { Module } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './entities/favorite.entity';
import { Facility } from '../facilities/entities/facility.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Favorite, Facility])],
    controllers: [FavoritesController],
    providers: [FavoritesService],
    exports: [TypeOrmModule],
})
export class FavoritesModule {}

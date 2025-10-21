import { Module } from '@nestjs/common';
import { CreateCategoryService } from './services/create_categories.service';
import { CategoriesService } from './services/categories.service';
import { UpdateCategoriesService } from './services/update_categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryAttribute } from './entities/category_attributes.entity';
import { CategoryAttributeOption } from './entities/category_attributes_options.entity';
import { HomeController } from './home.controller';
import { HomeService } from './services/home.service';
import { Facility } from '../facilities/entities/facility.entity';
import { Favorite } from '../favorites/entities/favorite.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Category, CategoryAttribute, CategoryAttributeOption, Facility , Favorite])],
    controllers: [CategoriesController, HomeController],
    providers: [CreateCategoryService, UpdateCategoriesService, CategoriesService, HomeService],
    exports: [TypeOrmModule, CreateCategoryService, UpdateCategoriesService, CategoriesService],
})
export class CategoriesModule {}

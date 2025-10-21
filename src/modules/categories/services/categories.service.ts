import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// entities
import { Category } from '../entities/category.entity';
import { CategoryAttribute } from '../entities/category_attributes.entity';
import { CategoryAttributeOption } from '../entities/category_attributes_options.entity';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        @InjectRepository(CategoryAttribute)
        private readonly attributeRepository: Repository<CategoryAttribute>,
        @InjectRepository(CategoryAttributeOption)
        private readonly optionRepository: Repository<CategoryAttributeOption>,
    ) {}
    async findAll(): Promise<Category[]> {
        return this.categoryRepository.find({ relations: ['attributes' , 'attributes.options'] });
    }

    async findOneById(id: number): Promise<Category> {
        const category = await this.categoryRepository.findOne({
          where: { id },
          relations: ['attributes' , 'attributes.options'],
        });
        if (!category) {
          throw new NotFoundException(`Category with id ${id} not found.`);
        }
        return category;
      }
}

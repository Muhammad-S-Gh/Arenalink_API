import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryAttribute } from '../entities/category_attributes.entity';
import { CategoryAttributeOption } from '../entities/category_attributes_options.entity';
import { CreateAttributeDto } from '../dto/create_attribute.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UpdateCategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        @InjectRepository(CategoryAttribute)
        private readonly categoryAttributeRepository: Repository<CategoryAttribute>,
    ) {}
    async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const category = await this.categoryRepository.findOneBy({ id });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        if (updateCategoryDto.name) {
            category.name = {
                en: updateCategoryDto.name.en ?? category.name.en,
                ar: updateCategoryDto.name.ar ?? category.name.ar,
            };
        }

        if (updateCategoryDto.description) {
            category.description = {
                en: updateCategoryDto.description.en ?? category.description?.en,
                ar: updateCategoryDto.description.ar ?? category.description?.ar,
            };
        }

        if (updateCategoryDto.icon) {
            if (category.icon) {
                const oldIconPath = path.join(process.cwd(), category.icon);
                try {
                    if (fs.existsSync(oldIconPath)) {
                        fs.unlinkSync(oldIconPath);
                    }
                } catch (err) {
                    console.error(`Failed to delete old icon: ${oldIconPath}`, err);
                }
            }

            category.icon = updateCategoryDto.icon;
        }

        return this.categoryRepository.save(category);
    }
    async deleteAttribute(id: number): Promise<void> {
        await this.categoryAttributeRepository.manager.transaction(async (manager) => {
            const attribute = await manager.findOne(CategoryAttribute, {
                where: { id },
                relations: ['options'],
            });

            if (!attribute) {
                throw new NotFoundException(`Attribute with ID ${id} not found`);
            }

            await manager.remove(CategoryAttribute, attribute);
        });
    }

    async addAttributeToCategory(
        categoryId: number,
        createAttributeDto: CreateAttributeDto,
    ): Promise<CategoryAttribute> {
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${categoryId} not found`);
        }

        const attribute = this.categoryAttributeRepository.create({
            ...createAttributeDto,
            category,
        });

        const savedAttribute = await this.categoryAttributeRepository.save(attribute);

        return savedAttribute;
    }

    async deleteCategory(id: number): Promise<void> {
        await this.categoryRepository.manager.transaction(async (manager) => {
            const category = await manager.findOne(Category, {
                where: { id },
                relations: ['attributes', 'attributes.options'],
            });

            if (!category) {
                throw new NotFoundException(`Category with ID ${id} not found`);
            }

            if (category.icon) {
                const iconPath = path.join(process.cwd(), category.icon);
                try {
                    if (fs.existsSync(iconPath)) {
                        fs.unlinkSync(iconPath);
                    }
                } catch (err) {
                    console.error(`Failed to delete icon: ${iconPath}`, err);
                }
            }

            await manager.remove(Category, category);
        });
    }
}

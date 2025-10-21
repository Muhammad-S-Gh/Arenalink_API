import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { YcI18nService } from '../../yc-i18n/yc-i18n.service';
@Injectable()
export class CreateCategoryService {
    constructor(
        private readonly ycI18n: YcI18nService,

        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ) {}

    async create(dto: CreateCategoryDto , iconPath : string) {
        try {
            const category = this.categoryRepository.create({
                name: dto.name,
                icon: iconPath,
                description: dto.description,
            });

            await this.categoryRepository.save(category);
            const message = { message: this.ycI18n.t('common.success') };
            return message;
        } catch (error) {
            throw new InternalServerErrorException(this.ycI18n.t('errors.InternalServerError'));
        }
    }
}

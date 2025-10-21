import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    HttpException,
    HttpStatus,
    NotFoundException,
    UsePipes,
    ValidationPipe,
    BadRequestException,
    ParseIntPipe,
} from '@nestjs/common';
import { CreateCategoryService } from './services/create_categories.service';
import { UpdateCategoriesService } from './services/update_categories.service';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { Category } from './entities/category.entity';
import { CategoriesService } from './services/categories.service';
import { Public } from '../auth/decorators/public.decorator';
import { CreateAttributeDto } from './dto/create_attribute.dto';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AttributeType } from './enums/attributeType.enum';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(
        private readonly categoryService: CategoriesService,
        private readonly createCategoryService: CreateCategoryService,
        private readonly updateCategoryService: UpdateCategoriesService,
    ) {}

    @Get('')
    @ApiOperation({ summary: 'Get all categories' })
    @ApiResponse({ status: 200, description: 'List of categories.', isArray: true })
    async getAllCategories(): Promise<Category[]> {
        return this.categoryService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get category by ID' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({ status: 200, description: 'Category found.' })
    @ApiResponse({ status: 404, description: 'Category not found.' })
    async getCategoryById(@Param('id') id: number): Promise<Category> {
        return this.categoryService.findOneById(id);
    }
}

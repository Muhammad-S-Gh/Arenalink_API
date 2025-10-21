import { Controller, Post, Delete, Get, Body, ParseIntPipe } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/user-roles.enum';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) {}

    @Roles(UserRole.USER)
    @Post('')
    @ApiOperation({ summary: 'Add facility to favorites' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                facilityId: { type: 'number' },
            },
        },
    })
    async addFavorite(@Body('facilityId', ParseIntPipe) facilityId: number, @User() user) {
        return this.favoritesService.addFavorite(user, facilityId);
    }

    @Roles(UserRole.USER)
    @Delete('')
    @ApiOperation({ summary: 'Remove facility from favorites' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                facilityId: { type: 'number' },
            },
        },
    })
    async removeFavorite(@Body('facilityId', ParseIntPipe) facilityId: number, @User() user) {
        return this.favoritesService.removeFavorite(user, facilityId);
    }

    @Roles(UserRole.USER)
    @Get('')
    @ApiOperation({ summary: 'Get my favorite facilities with categories' })
    async getMyFavorites(@User() user) {
        return this.favoritesService.getUserFavorites(user);
    }
}

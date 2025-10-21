import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Facility } from '../../facilities/entities/facility.entity';
import { Favorite } from '../../favorites/entities/favorite.entity';
import { User as USER } from '../../users/entities/users.entity';

@Injectable()
export class HomeService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,

        @InjectRepository(Facility)
        private readonly facilityRepo: Repository<Facility>,

        @InjectRepository(Favorite)
        private readonly favoriteRepo: Repository<Favorite>,
    ) {}

    async getHomeData(user: USER) {
        // 1) Fetch some categories (limit to 5 for homepage)
        const categories = await this.categoryRepo.find({
            take: 5,
            order: { createdAt: 'DESC' },
        });

        // 2) Define the "home categories" you want to feature
        const featuredCategoryIds = [1, 2, 3]; // 👈 replace with real category IDs

        // 3) For each category, fetch top 6 facilities
        const facilitiesByCategory: Record<string, any[]> = {};
        for (const catId of featuredCategoryIds) {
            const facilities = await this.facilityRepo.find({
                where: { category: { id: catId } },
                relations: ['attributeValues', 'attributeValues.categoryAttribute'],
                order: { createdAt: 'DESC' },
                take: 6,
            });

            // 4) Mark isFavorite for each facility
            const facilityIds = facilities.map((f) => f.id);
            const favorites = user
                ? await this.favoriteRepo.find({
                      where: {
                          user: { id: user.id },
                          facility: { id: In(facilityIds) },
                      },
                      relations: ['facility'],
                  })
                : [];

            const favSet = new Set(favorites.map((fav) => fav.facility.id));

            facilitiesByCategory[catId] = facilities.map((f) => ({
                ...f,
                isFavorite: favSet.has(f.id),
            }));
        }

        return {
            status: 'success',
            categories,
            facilities: {
                firstCategory: facilitiesByCategory[featuredCategoryIds[0]] ?? [],
                secondCategory: facilitiesByCategory[featuredCategoryIds[1]] ?? [],
                thirdCategory: facilitiesByCategory[featuredCategoryIds[2]] ?? [],
            },
        };
    }
}

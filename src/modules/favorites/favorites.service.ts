import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Facility } from '../facilities/entities/facility.entity';
import { User } from '../users/entities/users.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite) private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Facility) private readonly facilityRepo: Repository<Facility>,
  ) {}

  async addFavorite(user: User, facilityId: number): Promise<Favorite> {
    const facility = await this.facilityRepo.findOne({ where: { id: facilityId } });
    if (!facility) {
      throw new NotFoundException(`Facility with ID ${facilityId} not found`);
    }

    const existing = await this.favoriteRepo.findOne({
      where: { user: { id: user.id }, facility: { id: facilityId } },
    });
    if (existing) {
      throw new ConflictException('Already in favorites');
    }

    const favorite = this.favoriteRepo.create({ user, facility });
    return await this.favoriteRepo.save(favorite);
  }

  async removeFavorite(user: User, facilityId: number): Promise<void> {
    const favorite = await this.favoriteRepo.findOne({
      where: { user: { id: user.id }, facility: { id: facilityId } },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepo.remove(favorite);
  }

  async getUserFavorites(user: User): Promise<Favorite[]> {
    return this.favoriteRepo.find({
      where: { user: { id: user.id } },
      relations: ['facility', 'facility.category'], // include category
      order: { createdAt: 'DESC' },
    });
  }
}

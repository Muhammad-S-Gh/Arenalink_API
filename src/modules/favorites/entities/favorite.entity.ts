import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { Facility } from '../../facilities/entities/facility.entity';

@Entity('favorites')
@Unique(['user', 'facility'])
export class Favorite {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Facility, (facility) => facility.favorites, { onDelete: 'CASCADE' })
    facility: Facility;

    @CreateDateColumn()
    createdAt: Date;
}

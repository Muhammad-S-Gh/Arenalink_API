import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CategoryAttribute } from './category_attributes.entity';
import { Facility } from '../../facilities/entities/facility.entity';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column('jsonb')
    name: {
        en: string;
        ar: string;
    };

    @Column()
    icon: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column('jsonb', { nullable: true })
    description?: {
        en: string;
        ar: string;
    };

    // *****

    @OneToMany(() => CategoryAttribute, (attribute) => attribute.category, { cascade: true })
    attributes: CategoryAttribute[];

    @OneToMany(() => Facility, (f) => f.category)
    facilities: Facility[];

    // *****
}

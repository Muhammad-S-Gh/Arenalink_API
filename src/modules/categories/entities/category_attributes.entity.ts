import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Category } from './category.entity';
import { AttributeType } from '../enums/attributeType.enum';
import { CategoryAttributeOption } from './category_attributes_options.entity';
import { FacilityAttributeValue } from '../../facilities/entities/facility-attribute-value.entity';

@Entity('category_attributes')
export class CategoryAttribute {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    // *****

    @ManyToOne(() => Category, (category) => category.attributes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @OneToMany(() => CategoryAttributeOption, (option) => option.attribute, {
        cascade: true,
        orphanedRowAction: 'delete',
        onDelete: 'CASCADE',
    })
    options: CategoryAttributeOption[];

    @OneToMany(() => FacilityAttributeValue, (fav) => fav)
    facilityAttributeValues: FacilityAttributeValue[];

    // ******

    @Column('jsonb')
    name: {
        en: string;
        ar: string;
    };

    @Column({
        type: 'enum',
        enum: AttributeType,
        default: AttributeType.STRING,
    })
    type: AttributeType;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'is_required', default: false })
    isRequired: boolean;

    @Column({ name: 'min_limit', nullable: true })
    minLimit?: number;

    @Column({ name: 'max_limit', nullable: true })
    maxLimit?: number;

    @Column({ name: 'with_filters', default: false })
    withFilters: boolean;
}

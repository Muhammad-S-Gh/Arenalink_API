import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CategoryAttribute } from './category_attributes.entity';

@Entity('category_attributes_options')
export class CategoryAttributeOption {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @ManyToOne(() => CategoryAttribute, (attribute) => attribute.options, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'attribute_id' })
    attribute: CategoryAttribute;

    @Column('jsonb')
    name: {
        en: string;
        ar: string;
    };
}

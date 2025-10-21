import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Facility } from './facility.entity';
import { CategoryAttribute } from '../../categories/entities/category_attributes.entity';
import { CategoryAttributeOption } from '../../categories/entities/category_attributes_options.entity';

@Entity({ name: 'facility-attribute-values' })
export class FacilityAttributeValue {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    // *****

    @ManyToOne(() => Facility, (facility) => facility.attributeValues, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'facility_id' })
    facility: Facility;

    @ManyToOne(() => CategoryAttribute, (cat_attr) => cat_attr.facilityAttributeValues, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'category_attribute_id' })
    categoryAttribute: CategoryAttribute;

    @Column({ type: 'jsonb', nullable: true })
    value: number | boolean |{ en: string; ar: string }| null;

    @ManyToOne(() => CategoryAttributeOption, { eager: true, nullable: true })
    @JoinColumn({ name: 'option_id' })
    selectedOption?: CategoryAttributeOption;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;
}

import { Column, CreateDateColumn, Entity, JoinColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'personal_access_tokens' })
export class PersonalAccessToken {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ type: 'varchar', name: 'tokenable_type' })
    tokenableType: string;

    @Column({ type: 'bigint', name: 'tokenable_id' })
    tokenableId: number;

    @Column({ type: 'text' })
    token: string;

    @Column({ type: 'text', nullable: true })
    abilities: string | null;

    @Column({ type: 'timestamp', name: 'last_used_at', nullable: true })
    lastUsedAt: Date | null;

    @Column({ type: 'timestamp', name: 'expires_at' })
    expiresAt: Date;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Note {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int', nullable: false })
    user!: number;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    ts!: string;

    @Column({ type: 'text', nullable: false })
    text!: string;
}

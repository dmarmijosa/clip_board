import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ClipboardFormat = 'markdown' | 'text';

@Entity({ name: 'clipboard_entries' })
export class ClipboardEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 32, default: 'markdown' })
  format: ClipboardFormat;

  @Column({ type: 'varchar', length: 128, nullable: true })
  source?: string | null;

  @Column({ type: 'date', name: 'day_key' })
  dayKey: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

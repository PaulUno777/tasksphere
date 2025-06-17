import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { AppBaseEntity } from './AppBaseEntity';
import { NotificationType, Priority } from './enums';
import type { User } from './User';
import type { Board } from './Board';
import type { Task } from './Task';

@Entity()
export class Notification extends AppBaseEntity {
  @Column({ type: 'text', enum: NotificationType })
  type!: NotificationType;

  @Column('text')
  content!: string;

  @Column({ type: 'text', enum: Priority, default: Priority.MEDIUM })
  priority!: Priority;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ default: false })
  isDelivered!: boolean;

  @ManyToOne('User', { onDelete: 'CASCADE' })
  recipient!: User;

  @ManyToOne('Board', { nullable: true })
  board?: Board;

  @ManyToOne('Task', { nullable: true })
  task?: Task;

  @Index()
  @Column({ default: false })
  delivered!: boolean;
}

import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AppBaseEntity } from './AppBaseEntity';
import { Priority, TaskStatus } from './enums';
import type { User } from './User';
import type { Board } from './Board';
import type { Category } from './Category';
import type { Message } from './Message';

@Entity()
export class Task extends AppBaseEntity {
  @Column({ length: 255 })
  title!: string;

  @Column('text')
  description!: string;

  @Column({ type: 'text', enum: TaskStatus, default: TaskStatus.TODO })
  status!: TaskStatus;

  @Column({ type: 'text', enum: Priority, default: Priority.MEDIUM })
  priority!: Priority;

  @Column({ nullable: true })
  dueDate?: Date;

  @ManyToOne('User', { nullable: true })
  assignedTo?: User;

  @ManyToOne('Board', { onDelete: 'CASCADE' })
  board!: Board;

  @ManyToOne('Category', { eager: true, nullable: true, onDelete: 'SET NULL' })
  category?: Category;

  @OneToMany('Message', 'task')
  comments!: Message[];

  @Column({ nullable: true, type: 'uuid' })
  lastUpdatedBy?: string;
}

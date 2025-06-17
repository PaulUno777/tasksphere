import { Column, Entity, ManyToOne } from 'typeorm';
import { AppBaseEntity } from './AppBaseEntity';
import type { User } from './User';
import type { Task } from './Task';

@Entity()
export class Message extends AppBaseEntity {
  @Column('text')
  content!: string;

  @ManyToOne('User', { eager: true })
  author!: User;

  @ManyToOne('Task', { onDelete: 'CASCADE' })
  task!: Task;
}

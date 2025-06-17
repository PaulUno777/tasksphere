import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AppBaseEntity } from './AppBaseEntity';
import type { User } from './User';
import type { BoardMember } from './BoardMember';
import type { Task } from './Task';
import type { Category } from './Category';

@Entity()
export class Board extends AppBaseEntity {
  @Column()
  title!: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @ManyToOne('User')
  owner!: User;

  @OneToMany('BoardMember', 'board')
  boardMembers!: BoardMember[];

  @OneToMany('Task', 'board')
  tasks!: Task[];

  @OneToMany('Category', 'board')
  categories!: Category[];
}

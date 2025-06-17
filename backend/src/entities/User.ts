import { Column, Entity, OneToMany } from 'typeorm';
import { AppBaseEntity } from './AppBaseEntity';
import type { Message } from './Message';
import type { BoardMember } from './BoardMember';
import type { Notification } from './Notification';

@Entity()
export class User extends AppBaseEntity {
  @Column({ unique: true, length: 100 })
  email!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column()
  passwordHash!: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @OneToMany('Message', 'author')
  comments!: Message[];

  @OneToMany('BoardMember', 'user')
  boardMemberships!: BoardMember[];

  @OneToMany('Notification', 'recipient')
  notifications!: Notification[];
}

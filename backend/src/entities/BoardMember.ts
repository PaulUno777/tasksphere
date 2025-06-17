import { Column, Entity, ManyToOne } from 'typeorm';
import { AppBaseEntity } from './AppBaseEntity';
import { BoardRole } from './enums';
import type { User } from './User';
import type { Board } from './Board';

@Entity()
export class BoardMember extends AppBaseEntity {
  @ManyToOne('User', { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'text', enum: BoardRole, default: BoardRole.VIEWER })
  role!: BoardRole;

  @ManyToOne('Board', { onDelete: 'CASCADE' })
  board!: Board;
}

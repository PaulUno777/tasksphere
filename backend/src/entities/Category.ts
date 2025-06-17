import { Column, Entity, ManyToOne } from 'typeorm';
import { AppBaseEntity } from './AppBaseEntity';
import type { Board } from './Board';

@Entity()
export class Category extends AppBaseEntity {
  @Column({ length: 50 })
  name!: string;

  @Column({ length: 7 })
  color!: string;

  @ManyToOne('Board', { onDelete: 'CASCADE' })
  board!: Board;
}

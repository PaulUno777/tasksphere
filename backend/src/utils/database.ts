import { DataSource } from 'typeorm';
import { join } from 'path';
import {
  Board,
  BoardMember,
  Category,
  Message,
  Notification,
  Task,
  User,
} from '../entities';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env['DATABASE_PATH'] ?? './database.sqlite',
  synchronize: process.env['NODE_ENV'] === 'development',
  logging: process.env['NODE_ENV'] === 'development',
  entities: [User, Board, BoardMember, Category, Task, Message, Notification],
  migrations: [join(__dirname, '../migrations/*.{ts,js}')],
  subscribers: [join(__dirname, '../subscribers/*.{ts,js}')],
});

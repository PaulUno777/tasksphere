import { User } from "./user.model";

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  isActive: boolean;
  createdBy: User;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}


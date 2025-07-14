import { BoardSettings } from '@core/models';

export interface CreateBoardRequest {
  title: string;
  description?: string;
  color?: string;
  settings?: Partial<BoardSettings>;
}

export interface UpdateBoardRequest {
  title?: string;
  description?: string;
  color?: string;
}

export interface UpdateBoardSettingsRequest extends Partial<BoardSettings> {}

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  color: string;
  defaultColumns: string[];
  icon: string;
  category: 'project' | 'personal' | 'team' | 'other';
}

export interface BoardColor {
  name: string;
  value: string;
  textColor: string;
}

import { DropdownItem } from "./ui.model";

export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'textarea'
    | 'select'
    | 'date'
    | 'color';
  required?: boolean;
  placeholder?: string;
  options?: DropdownItem[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
}

export interface FormConfig {
  fields: FormField[];
  submitText: string;
  cancelText?: string;
}

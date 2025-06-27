export interface ModalConfig {
  title: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger' | 'warning';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface DropdownItem {
  label: string;
  value: any;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
}

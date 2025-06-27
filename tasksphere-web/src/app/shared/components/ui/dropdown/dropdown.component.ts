import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DropdownItem } from '../../../../core/models';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative inline-block text-left">
      <div>
        <button
          type="button"
          class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          (click)="toggleDropdown()"
          [attr.aria-expanded]="isOpen()"
        >
          {{ selectedLabel || placeholder }}
          <lucide-icon
            name="chevron-down"
            class="-mr-1 h-5 w-5 text-gray-400"
            size="16"
          ></lucide-icon>
        </button>
      </div>

      <div
        *ngIf="isOpen()"
        class="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in"
        [class.left-0]="align === 'left'"
        [class.right-0]="align === 'right'"
      >
        <div class="py-1">
          @for (item of items; track $index) {
          <div [class]="getItemClasses(item)" (click)="selectItem(item)">
            <lucide-icon
              *ngIf="item.icon"
              [name]="item.icon"
              class="mr-3 h-4 w-4 text-gray-400"
              size="16"
            >
            </lucide-icon>
            {{ item.label }}
          </div>
          <hr *ngIf="item.separator" class="my-1 border-gray-200" />
          }
        </div>
      </div>
    </div>
  `,
})
export class DropdownComponent {
  @Input() items: DropdownItem[] = [];
  @Input() placeholder = 'Select option';
  @Input() selectedValue: any = null;
  @Input() align: 'left' | 'right' = 'right';

  @Output() selectionChanged = new EventEmitter<any>();

  isOpen = signal(false);

  get selectedLabel(): string {
    const selected = this.items.find(
      (item) => item.value === this.selectedValue
    );
    return selected?.label || '';
  }

  toggleDropdown(): void {
    this.isOpen.update((value) => !value);
  }

  selectItem(item: DropdownItem): void {
    if (item.disabled || item.separator) return;

    this.selectedValue = item.value;
    this.selectionChanged.emit(item.value);
    this.isOpen.set(false);
  }

  getItemClasses(item: DropdownItem): string {
    const baseClasses = 'flex items-center px-4 py-2 text-sm cursor-pointer';

    if (item.separator) {
      return '';
    }

    if (item.disabled) {
      return `${baseClasses} text-gray-400 cursor-not-allowed`;
    }

    const selectedClass =
      item.value === this.selectedValue ? 'bg-primary-50 text-primary-700' : '';
    const hoverClass = 'hover:bg-gray-100 hover:text-gray-900';

    return `${baseClasses} ${selectedClass} ${hoverClass}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.isOpen.set(false);
    }
  }
}

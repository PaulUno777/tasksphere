import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'outlined' | 'elevated';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses()">
      @if (hasHeader) {
      <div [class]="headerClasses()">
        @if (title) {
        <h3 class="text-lg font-semibold text-text-strong">{{ title }}</h3>
        } @if (subtitle) {
        <p class="text-sm text-text-muted mt-1">{{ subtitle }}</p>
        }
        <ng-content select="[slot=header]"></ng-content>
      </div>
      }

      <div [class]="contentClasses()">
        <ng-content></ng-content>
      </div>

      @if (hasFooter) {
      <div [class]="footerClasses()">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
      }
    </div>
  `,
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() padding = true;
  @Input() hasHeader = false;
  @Input() hasFooter = false;

  cardClasses = computed(() => `card-${this.variant}`);

  headerClasses = computed(() => {
    const base = 'border-b border-border-muted';
    return this.padding ? `${base} px-6 py-4` : `${base} p-0`;
  });

  contentClasses = computed(() => {
    return this.padding ? 'max-w-md w-full space-y-6' : 'p-0';
  });

  footerClasses = computed(() => {
    const base = 'border-t border-border-muted';
    return this.padding ? `${base} px-6 py-4` : `${base} p-0`;
  });
}

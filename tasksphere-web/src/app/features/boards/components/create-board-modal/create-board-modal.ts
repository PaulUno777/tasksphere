import {
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Folder,
  Palette,
  Settings,
  Zap,
  User,
  FileText,
  Columns,
  CheckCircle,
  Eye,
  EyeOff,
  Users,
  MessageSquare,
  UserPlus,
  Clock,
  Loader2,
} from 'lucide-angular';

import { BoardsStore } from '@store/boards.store';
import { BoardService } from '@core/services/board.service';
import { TranslationService } from '@core/services';
import { ToastService } from '@core/services/toast.service';
import { Board } from '@core/models';
import { BoardColor, BoardTemplate, CreateBoardRequest } from '@core/types/board.types';
import { ModalComponent } from '@shared/components/modal/modal';

@Component({
  selector: 'app-create-board-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ModalComponent,
  ],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="i18n.t('boards.createBoard')"
      [size]="'lg'"
      (closed)="onClose()"
    >
      <form [formGroup]="boardForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Step Indicator -->
        <div class="flex items-center justify-center space-x-2 mb-6">
          @for (step of steps; track step.id; let i = $index) {
          <div class="flex items-center">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
              [class]="getStepClasses(step.id)"
            >
              @if (currentStep() > step.id) {
              <lucide-icon [img]="CheckCircle" [size]="16"></lucide-icon>
              } @else {
              {{ step.id }}
              }
            </div>
            @if (i < steps.length - 1) {
            <div
              class="w-12 h-0.5 mx-2 transition-colors"
              [class]="
                currentStep() > step.id ? 'bg-primary-500' : 'bg-border-default'
              "
            ></div>
            }
          </div>
          }
        </div>

        <!-- Step 1: Template Selection -->
        @if (currentStep() === 1) {
        <div class="space-y-4 z-50">
          <div class="text-center">
            <h3 class="text-lg font-medium text-text-default mb-2">
              {{ i18n.t('boards.createModal.chooseTemplate') }}
            </h3>
            <p class="text-sm text-text-muted">
              {{ i18n.t('boards.createModal.templateDescription') }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (template of templates; track template.id) {
            <div
              class="relative border rounded-lg p-4 cursor-pointer transition-all hover:border-primary-300 hover:shadow-sm"
              [class]="
                selectedTemplate() === template.id
                  ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                  : 'border-border-default'
              "
              (click)="selectTemplate(template.id)"
            >
              <div class="flex items-start space-x-3">
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm"
                  [style.background-color]="template.color"
                >
                  <lucide-icon
                    [img]="getTemplateIcon(template.icon)"
                    [size]="20"
                  ></lucide-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-medium text-text-default">
                    {{ template.name }}
                  </h4>
                  <p class="text-xs text-text-muted mt-1 line-clamp-2">
                    {{ template.description }}
                  </p>
                  @if (template.defaultColumns) {
                  <div class="flex flex-wrap gap-1 mt-2">
                    @for (column of template.defaultColumns; track column) {
                    <span
                      class="inline-block px-2 py-0.5 text-xs bg-surface-muted text-text-muted rounded"
                    >
                      {{ column }}
                    </span>
                    }
                  </div>
                  }
                </div>
              </div>

              @if (selectedTemplate() === template.id) {
              <div class="absolute top-2 right-2">
                <div
                  class="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="CheckCircle"
                    [size]="12"
                    class="text-white"
                  ></lucide-icon>
                </div>
              </div>
              }
            </div>
            }
          </div>
        </div>
        }

        <!-- Step 2: Board Details -->
        @if (currentStep() === 2) {
        <div class="space-y-6">
          <div class="text-center">
            <h3 class="text-lg font-medium text-text-default mb-2">
              {{ i18n.t('boards.createModal.boardDetails') }}
            </h3>
            <p class="text-sm text-text-muted">
              {{ i18n.t('boards.createModal.detailsDescription') }}
            </p>
          </div>

          <!-- Board Title -->
          <div>
            <label
              for="title"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.t('boards.title') }} *
            </label>
            <input
              id="title"
              type="text"
              formControlName="title"
              [placeholder]="i18n.t('boards.createModal.titlePlaceholder')"
              class="input-default w-full"
              [class.border-danger-500]="isFieldInvalid('title')"
            />
            @if (isFieldInvalid('title')) {
            <p class="mt-1 text-sm text-danger-600">
              {{ getFieldError('title') }}
            </p>
            }
          </div>

          <!-- Board Description -->
          <div>
            <label
              for="description"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.t('boards.description') }}
            </label>
            <textarea
              id="description"
              formControlName="description"
              rows="3"
              [placeholder]="
                i18n.t('boards.createModal.descriptionPlaceholder')
              "
              class="input-default w-full resize-none"
              [class.border-danger-500]="isFieldInvalid('description')"
            ></textarea>
            @if (isFieldInvalid('description')) {
            <p class="mt-1 text-sm text-danger-600">
              {{ getFieldError('description') }}
            </p>
            }
          </div>

          <!-- Color Selection -->
          <div>
            <label class="block text-sm font-medium text-text-default mb-3">
              {{ i18n.t('boards.color') }}
            </label>
            <div class="flex flex-wrap gap-3">
              @for (color of colors; track color.value) {
              <button
                type="button"
                class="relative w-8 h-8 rounded-lg shadow-sm border-2 transition-all hover:scale-110"
                [style.background-color]="color.value"
                [class]="
                  selectedColor() === color.value
                    ? 'border-text-default ring-2 ring-primary-200'
                    : 'border-border-default'
                "
                (click)="selectColor(color.value)"
                [attr.aria-label]="color.name"
              >
                @if (selectedColor() === color.value) {
                <lucide-icon
                  [img]="CheckCircle"
                  [size]="16"
                  class="absolute inset-0 m-auto"
                  [style.color]="color.textColor"
                ></lucide-icon>
                }
              </button>
              }
            </div>
          </div>
        </div>
        }

        <!-- Step 3: Settings -->
        @if (currentStep() === 3) {
        <div class="space-y-6">
          <div class="text-center">
            <h3 class="text-lg font-medium text-text-default mb-2">
              {{ i18n.t('boards.createModal.boardSettings') }}
            </h3>
            <p class="text-sm text-text-muted">
              {{ i18n.t('boards.createModal.settingsDescription') }}
            </p>
          </div>

          <!-- Settings Options -->
          <div class="space-y-4">
            <!-- Allow Comments -->
            <div
              class="flex items-center justify-between p-4 border border-border-default rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div
                  class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="MessageSquare"
                    [size]="20"
                    class="text-primary-600"
                  ></lucide-icon>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-text-default">
                    {{ i18n.t('boards.settings.allowComments') }}
                  </h4>
                  <p class="text-xs text-text-muted">
                    {{ i18n.t('boards.settings.allowCommentsDesc') }}
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="allowComments"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-surface-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                ></div>
              </label>
            </div>

            <!-- Require Invite Approval -->
            <div
              class="flex items-center justify-between p-4 border border-border-default rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div
                  class="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="UserPlus"
                    [size]="20"
                    class="text-warning-600"
                  ></lucide-icon>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-text-default">
                    {{ i18n.t('boards.settings.requireInviteApproval') }}
                  </h4>
                  <p class="text-xs text-text-muted">
                    {{ i18n.t('boards.settings.requireInviteApprovalDesc') }}
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="requireInviteApproval"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-surface-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                ></div>
              </label>
            </div>

            <!-- Allow Member Invite -->
            <div
              class="flex items-center justify-between p-4 border border-border-default rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div
                  class="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="Users"
                    [size]="20"
                    class="text-success-600"
                  ></lucide-icon>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-text-default">
                    {{ i18n.t('boards.settings.allowMemberInvite') }}
                  </h4>
                  <p class="text-xs text-text-muted">
                    {{ i18n.t('boards.settings.allowMemberInviteDesc') }}
                  </p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  formControlName="allowMemberInvite"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-surface-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"
                ></div>
              </label>
            </div>

            <!-- Auto Archive -->
            <div class="p-4 border border-border-default rounded-lg">
              <div class="flex items-center space-x-3 mb-3">
                <div
                  class="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="Clock"
                    [size]="20"
                    class="text-secondary-600"
                  ></lucide-icon>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-text-default">
                    {{ i18n.t('boards.settings.autoArchive') }}
                  </h4>
                  <p class="text-xs text-text-muted">
                    {{ i18n.t('boards.settings.autoArchiveDesc') }}
                  </p>
                </div>
              </div>
              <div class="ml-13">
                <label
                  for="autoArchiveDays"
                  class="block text-xs font-medium text-text-muted mb-1"
                >
                  {{ i18n.t('boards.settings.autoArchiveDays') }}
                </label>
                <select
                  id="autoArchiveDays"
                  formControlName="autoArchiveCompletedDays"
                  class="input-default w-32"
                >
                  <option value="">{{ i18n.t('common.disabled') }}</option>
                  <option value="1">1 {{ i18n.t('common.day') }}</option>
                  <option value="3">3 {{ i18n.t('common.days') }}</option>
                  <option value="7">7 {{ i18n.t('common.days') }}</option>
                  <option value="14">14 {{ i18n.t('common.days') }}</option>
                  <option value="30">30 {{ i18n.t('common.days') }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        }

        <!-- Navigation Buttons -->
        <div
          class="flex items-center justify-between pt-6 border-t border-border-default"
        >
          <div>
            @if (currentStep() > 1) {
            <button
              type="button"
              (click)="previousStep()"
              class="btn-outline btn-md"
            >
              {{ i18n.t('common.back') }}
            </button>
            }
          </div>

          <div class="flex items-center space-x-3">
            <button type="button" (click)="onClose()" class="btn-ghost btn-md">
              {{ i18n.t('common.cancel') }}
            </button>

            @if (currentStep() < totalSteps) {
            <button
              type="button"
              (click)="nextStep()"
              [disabled]="!canProceedToNextStep()"
              class="btn-primary btn-md"
            >
              {{ i18n.t('common.next') }}
            </button>
            } @else {
            <button
              type="submit"
              [disabled]="boardForm.invalid || isCreating()"
              class="btn-primary btn-md"
            >
              @if (isCreating()) {
              <lucide-icon
                [img]="Loader2"
                [size]="16"
                class="mr-2 animate-spin"
              ></lucide-icon>
              }
              {{ i18n.t('boards.createBoard') }}
            </button>
            }
          </div>
        </div>
      </form>
    </app-modal>
  `,
})
export class CreateBoardModalComponent implements OnInit {
  // Icons
  readonly X = X;
  readonly Folder = Folder;
  readonly Palette = Palette;
  readonly Settings = Settings;
  readonly Zap = Zap;
  readonly User = User;
  readonly FileText = FileText;
  readonly Columns = Columns;
  readonly CheckCircle = CheckCircle;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Users = Users;
  readonly MessageSquare = MessageSquare;
  readonly UserPlus = UserPlus;
  readonly Clock = Clock;
  readonly Loader2 = Loader2;

  // Services
  private fb = inject(FormBuilder);
  private boardsStore = inject(BoardsStore);
  private boardService = inject(BoardService);
  i18n = inject(TranslationService);
  private toastService = inject(ToastService);

  // Inputs
  @Input() isOpen = true;
  @Input() duplicateFromBoard?: Board; // Board to duplicate from
  @Input() initialTemplate?: string; // Pre-selected template

  // Outputs
  @Output() boardCreated = new EventEmitter<Board>();
  @Output() close = new EventEmitter<void>();

  // Component State
  currentStep = signal(1);
  selectedTemplate = signal<string>('kanban');
  selectedColor = signal<string>('#3b82f6');
  isCreating = signal(false);

  // Form color effect - update form when color changes
  private colorEffect = effect(() => {
    const color = this.selectedColor();
    if (this.boardForm) {
      this.boardForm.patchValue({ color });
    }
  });

  // Constants
  totalSteps = 3;
  steps = [
    { id: 1, label: 'Template' },
    { id: 2, label: 'Details' },
    { id: 3, label: 'Settings' },
  ];

  // Form
  boardForm!: FormGroup;

  // Data
  templates: BoardTemplate[] = [];
  colors: BoardColor[] = [];

  // Computed
  canProceedToNextStep = computed(() => {
    switch (this.currentStep()) {
      case 1:
        return !!this.selectedTemplate();
      case 2:
        return (
          this.boardForm.get('title')?.valid &&
          this.boardForm.get('description')?.valid
        );
      case 3:
        return true;
      default:
        return false;
    }
  });

  ngOnInit() {
    this.initializeForm();
    this.loadTemplates();
    this.loadColors();
    this.handleDuplicationOrTemplate();
  }

  private initializeForm() {
    this.boardForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
      color: [this.selectedColor()],
      settings: this.fb.group({
        allowComments: [true],
        requireInviteApproval: [false],
        allowMemberInvite: [true],
        autoArchiveCompletedDays: [''],
      }),
    });
  }

  private loadTemplates() {
    this.templates = this.boardService.getBoardTemplates();

    // Auto-select first template and apply its color
    if (this.templates.length > 0) {
      this.selectedTemplate.set(this.templates[0].id);
      this.selectedColor.set(this.templates[0].color);
    }
  }

  private loadColors() {
    this.colors = this.boardService.getBoardColors();
  }

  private handleDuplicationOrTemplate() {
    // Handle duplication mode
    if (this.duplicateFromBoard) {
      this.boardForm.patchValue({
        title: `${this.duplicateFromBoard.title} (Copy)`,
        description: this.duplicateFromBoard.description,
        color: this.duplicateFromBoard.color,
      });
      this.selectedColor.set(this.duplicateFromBoard.color || '#3b82f6');
      // Skip template selection step for duplication
      this.currentStep.set(2);
    }
    
    // Handle initial template selection
    if (this.initialTemplate) {
      this.selectedTemplate.set(this.initialTemplate);
      const template = this.templates.find(t => t.id === this.initialTemplate);
      if (template) {
        this.selectedColor.set(template.color);
        this.boardForm.patchValue({
          title: template.name + ' Board',
          color: template.color,
        });
      }
    }
  }

  // Step Navigation
  nextStep() {
    if (this.canProceedToNextStep() && this.currentStep() < this.totalSteps) {
      this.currentStep.update((step) => step + 1);
    }
  }

  previousStep() {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
    }
  }

  getStepClasses(stepId: number): string {
    const current = this.currentStep();
    if (current > stepId) {
      return 'bg-primary-500 text-white';
    } else if (current === stepId) {
      return 'bg-primary-100 text-primary-700 ring-2 ring-primary-200';
    } else {
      return 'bg-surface-muted text-text-muted';
    }
  }

  // Template Selection
  selectTemplate(templateId: string) {
    this.selectedTemplate.set(templateId);

    // Auto-apply template color and title suggestion
    const template = this.templates.find((t) => t.id === templateId);
    if (template) {
      this.selectedColor.set(template.color);

      // Suggest a title if the current title is empty
      if (!this.boardForm.get('title')?.value) {
        this.boardForm.patchValue({
          title: template.name + ' Board',
        });
      }
    }
  }

  getTemplateIcon(iconName: string) {
    const iconMap: Record<string, any> = {
      Columns: Columns,
      Zap: Zap,
      User: User,
      FileText: FileText,
      Folder: Folder,
    };
    return iconMap[iconName] || Folder;
  }

  // Color Selection
  selectColor(color: string) {
    this.selectedColor.set(color);
  }

  // Form Validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.boardForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.boardForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return this.i18n.t('validation.required', {
          field: this.i18n.t(`boards.${fieldName}`),
        });
      }
      if (field.errors['minlength']) {
        return this.i18n.t('validation.minLength', {
          field: this.i18n.t(`boards.${fieldName}`),
          length: field.errors['minlength'].requiredLength,
        });
      }
      if (field.errors['maxlength']) {
        return this.i18n.t('validation.maxLength', {
          field: this.i18n.t(`boards.${fieldName}`),
          length: field.errors['maxlength'].requiredLength,
        });
      }
    }
    return '';
  }

  // Form Submission
  async onSubmit() {
    if (this.boardForm.invalid || this.isCreating()) {
      return;
    }

    this.isCreating.set(true);

    try {
      const formValue = this.boardForm.value;
      let newBoard: Board;

      // Prepare the board creation request
      const createRequest: CreateBoardRequest = {
        title: formValue.title,
        description: formValue.description,
        color: this.selectedColor(),
        settings: {
          allowComments: formValue.settings.allowComments,
          requireInviteApproval: formValue.settings.requireInviteApproval,
          allowMemberInvite: formValue.settings.allowMemberInvite,
          autoArchiveCompletedDays: formValue.settings.autoArchiveCompletedDays
            ? parseInt(formValue.settings.autoArchiveCompletedDays)
            : undefined,
        },
      };

      if (this.duplicateFromBoard) {
        // Duplicate existing board
        newBoard = await this.boardService.duplicateBoard(
          this.duplicateFromBoard.id,
          createRequest.title
        );
      } else if (this.selectedTemplate()) {
        // Create from template
        newBoard = await this.boardService.createBoardFromTemplate(
          this.selectedTemplate(),
          createRequest
        );
      } else {
        // Create regular board
        newBoard = await this.boardsStore.createBoard(createRequest);
      }

      this.toastService.success(
        this.i18n.t('boards.createSuccess'),
        this.i18n.t('boards.createSuccessDesc', { title: newBoard.title })
      );

      // Emit the created board
      this.boardCreated.emit(newBoard);
    } catch (error: any) {
      console.error('Failed to create board:', error);
      this.toastService.error(
        this.i18n.t('boards.createError'),
        error.message || this.i18n.t('boards.createErrorDesc')
      );
    } finally {
      this.isCreating.set(false);
    }
  }

  // Event Handlers
  onClose() {
    this.close.emit();
  }
}

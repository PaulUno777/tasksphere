// Location: src/app/features/boards/components/board-settings/board-settings.component.ts

import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
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
  Settings,
  Edit,
  Palette,
  MessageSquare,
  Users,
  UserPlus,
  Clock,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Crown,
  Save,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
} from 'lucide-angular';

import { BoardsStore } from '@store/boards.store';
import { BoardService } from '@core/services/board.service';
import { TranslationService, ToastService } from '@core/services';
import {
  BoardColor,
  UpdateBoardRequest,
  UpdateBoardSettingsRequest,
} from '@core/types';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal';
import { Board } from '@core/models';

@Component({
  selector: 'app-board-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ConfirmModalComponent,
  ],
  template: `
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Page Header -->
      <div class="border-b border-border-default pb-6">
        <h1 class="text-2xl font-bold text-text-default">
          {{ i18n.t('boards.settings.title') }}
        </h1>
        <p class="text-text-muted mt-2">
          {{
            i18n.t('boards.settings.subtitle', {
              boardTitle: board.title
            })
          }}
        </p>
      </div>

      <!-- Board Information Section -->
      <div class="bg-surface border border-border-default rounded-lg">
        <div class="px-6 py-4 border-b border-border-default">
          <div class="flex items-center space-x-2">
            <lucide-icon
              [img]="Edit"
              [size]="20"
              class="text-text-muted"
            ></lucide-icon>
            <h2 class="text-lg font-semibold text-text-default">
              {{ i18n.t('boards.settings.boardInfo') }}
            </h2>
          </div>
          <p class="text-sm text-text-muted mt-1">
            {{ i18n.t('boards.settings.boardInfoDesc') }}
          </p>
        </div>

        <div class="p-6">
          <form [formGroup]="boardForm" class="space-y-6">
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
                class="input-default w-full resize-none"
                [class.border-danger-500]="isFieldInvalid('description')"
              ></textarea>
              @if (isFieldInvalid('description')) {
              <p class="mt-1 text-sm text-danger-600">
                {{ getFieldError('description') }}
              </p>
              }
            </div>

            <!-- Board Color -->
            <div>
              <label class="block text-sm font-medium text-text-default mb-3">
                {{ i18n.t('boards.color') }}
              </label>
              <div class="flex flex-wrap gap-3">
                @for (color of colors; track color.value) {
                <button
                  type="button"
                  class="relative w-10 h-10 rounded-lg shadow-sm border-2 transition-all hover:scale-110"
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
                    [size]="20"
                    class="absolute inset-0 m-auto"
                    [style.color]="color.textColor"
                  ></lucide-icon>
                  }
                </button>
                }
              </div>
            </div>

            <!-- Save Button -->
            <div class="flex justify-end">
              <button
                type="button"
                (click)="saveBoardInfo()"
                [disabled]="
                  boardForm.invalid || boardsStore.isSaving() || !hasChanges()
                "
                class="btn-primary btn-md"
              >
                @if (boardsStore.isSaving()) {
                <lucide-icon
                  [img]="Loader2"
                  [size]="16"
                  class="mr-2 animate-spin"
                ></lucide-icon>
                }
                <lucide-icon
                  [img]="Save"
                  [size]="16"
                  class="mr-2"
                ></lucide-icon>
                {{ i18n.t('common.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Board Settings Section -->
      <div class="bg-surface border border-border-default rounded-lg">
        <div class="px-6 py-4 border-b border-border-default">
          <div class="flex items-center space-x-2">
            <lucide-icon
              [img]="Settings"
              [size]="20"
              class="text-text-muted"
            ></lucide-icon>
            <h2 class="text-lg font-semibold text-text-default">
              {{ i18n.t('boards.settings.permissions') }}
            </h2>
          </div>
          <p class="text-sm text-text-muted mt-1">
            {{ i18n.t('boards.settings.permissionsDesc') }}
          </p>
        </div>

        <div class="p-6">
          <form [formGroup]="settingsForm" class="space-y-6">
            <!-- Allow Comments -->
            <div
              class="flex items-start justify-between p-4 border border-border-default rounded-lg"
            >
              <div class="flex items-start space-x-3">
                <div
                  class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mt-1"
                >
                  <lucide-icon
                    [img]="MessageSquare"
                    [size]="20"
                    class="text-primary-600"
                  ></lucide-icon>
                </div>
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-text-default">
                    {{ i18n.t('boards.settings.allowComments') }}
                  </h3>
                  <p class="text-sm text-text-muted mt-1">
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
              class="flex items-start justify-between p-4 border border-border-default rounded-lg"
            >
              <div class="flex items-start space-x-3">
                <div
                  class="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mt-1"
                >
                  <lucide-icon
                    [img]="Shield"
                    [size]="20"
                    class="text-warning-600"
                  ></lucide-icon>
                </div>
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-text-default">
                    {{ i18n.t('boards.settings.requireInviteApproval') }}
                  </h3>
                  <p class="text-sm text-text-muted mt-1">
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
              class="flex items-start justify-between p-4 border border-border-default rounded-lg"
            >
              <div class="flex items-start space-x-3">
                <div
                  class="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mt-1"
                >
                  <lucide-icon
                    [img]="UserPlus"
                    [size]="20"
                    class="text-success-600"
                  ></lucide-icon>
                </div>
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-text-default">
                    {{ i18n.t('boards.settings.allowMemberInvite') }}
                  </h3>
                  <p class="text-sm text-text-muted mt-1">
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

            <!-- Auto Archive Completed Tasks -->
            <div class="p-4 border border-border-default rounded-lg">
              <div class="flex items-start space-x-3 mb-4">
                <div
                  class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center"
                >
                  <lucide-icon
                    [img]="Clock"
                    [size]="20"
                    class="text-secondary-600"
                  ></lucide-icon>
                </div>
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-text-default">
                    {{ i18n.t('boards.settings.autoArchive') }}
                  </h3>
                  <p class="text-sm text-text-muted mt-1">
                    {{ i18n.t('boards.settings.autoArchiveDesc') }}
                  </p>
                </div>
              </div>

              <div class="ml-15">
                <label
                  for="autoArchiveDays"
                  class="block text-sm font-medium text-text-default mb-2"
                >
                  {{ i18n.t('boards.settings.autoArchiveDays') }}
                </label>
                <select
                  id="autoArchiveDays"
                  formControlName="autoArchiveCompletedDays"
                  class="input-default w-48"
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

            <!-- Save Settings Button -->
            <div class="flex justify-end">
              <button
                type="button"
                (click)="saveSettings()"
                [disabled]="
                  settingsForm.invalid ||
                  boardsStore.isSaving() ||
                  !hasSettingsChanges()
                "
                class="btn-primary btn-md"
              >
                @if (boardsStore.isSaving()) {
                <lucide-icon
                  [img]="Loader2"
                  [size]="16"
                  class="mr-2 animate-spin"
                ></lucide-icon>
                }
                <lucide-icon
                  [img]="Save"
                  [size]="16"
                  class="mr-2"
                ></lucide-icon>
                {{ i18n.t('boards.settings.saveSettings') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Danger Zone -->
      @if (canDeleteBoard()) {
      <div class="bg-surface border border-danger-200 rounded-lg">
        <div class="px-6 py-4 border-b border-danger-200">
          <div class="flex items-center space-x-2">
            <lucide-icon
              [img]="AlertTriangle"
              [size]="20"
              class="text-danger-500"
            ></lucide-icon>
            <h2 class="text-lg font-semibold text-danger-700">
              {{ i18n.t('boards.settings.dangerZone') }}
            </h2>
          </div>
          <p class="text-sm text-danger-600 mt-1">
            {{ i18n.t('boards.settings.dangerZoneDesc') }}
          </p>
        </div>

        <div class="p-6 space-y-4">
          <!-- Archive Board -->
          @if (board.status === 'ACTIVE') {
          <div
            class="flex items-center justify-between p-4 border border-warning-200 rounded-lg bg-warning-50"
          >
            <div>
              <h3 class="text-sm font-medium text-warning-800">
                {{ i18n.t('boards.settings.archiveBoard') }}
              </h3>
              <p class="text-sm text-warning-700 mt-1">
                {{ i18n.t('boards.settings.archiveBoardDesc') }}
              </p>
            </div>
            <button
              (click)="showArchiveConfirm = true"
              class="btn-outline border-warning-300 text-warning-700 hover:bg-warning-100 btn-md"
            >
              <lucide-icon
                [img]="Archive"
                [size]="16"
                class="mr-2"
              ></lucide-icon>
              {{ i18n.t('common.archive') }}
            </button>
          </div>
          }

          <!-- Restore Board -->
          @if (board.status === 'ARCHIVED') {
          <div
            class="flex items-center justify-between p-4 border border-success-200 rounded-lg bg-success-50"
          >
            <div>
              <h3 class="text-sm font-medium text-success-800">
                {{ i18n.t('boards.settings.restoreBoard') }}
              </h3>
              <p class="text-sm text-success-700 mt-1">
                {{ i18n.t('boards.settings.restoreBoardDesc') }}
              </p>
            </div>
            <button
              (click)="restoreBoard()"
              [disabled]="boardsStore.isSaving()"
              class="btn-outline border-success-300 text-success-700 hover:bg-success-100 btn-md"
            >
              @if (boardsStore.isSaving()) {
              <lucide-icon
                [img]="Loader2"
                [size]="16"
                class="mr-2 animate-spin"
              ></lucide-icon>
              } @else {
              <lucide-icon
                [img]="CheckCircle"
                [size]="16"
                class="mr-2"
              ></lucide-icon>
              }
              {{ i18n.t('common.restore') }}
            </button>
          </div>
          }

          <!-- Delete Board -->
          <div
            class="flex items-center justify-between p-4 border border-danger-200 rounded-lg bg-danger-50"
          >
            <div>
              <h3 class="text-sm font-medium text-danger-800">
                {{ i18n.t('boards.settings.deleteBoard') }}
              </h3>
              <p class="text-sm text-danger-700 mt-1">
                {{ i18n.t('boards.settings.deleteBoardDesc') }}
              </p>
            </div>
            <button
              (click)="showDeleteConfirm = true"
              class="btn-danger btn-md"
            >
              <lucide-icon
                [img]="Trash2"
                [size]="16"
                class="mr-2"
              ></lucide-icon>
              {{ i18n.t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
      }

      <!-- Archive Confirmation Modal -->
      @if (showArchiveConfirm) {
      <app-confirm-modal
        [title]="i18n.t('boards.settings.confirmArchiveTitle')"
        [message]="
          i18n.t('boards.settings.confirmArchiveMessage', {
            title: board.title
          })
        "
        [confirmText]="i18n.t('common.archive')"
        [cancelText]="i18n.t('common.cancel')"
        [variant]="'warning'"
        [loading]="boardsStore.isSaving()"
        (confirm)="archiveBoard()"
        (cancel)="showArchiveConfirm = false"
      ></app-confirm-modal>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteConfirm) {
      <app-confirm-modal
        [title]="i18n.t('boards.settings.confirmDeleteTitle')"
        [message]="
          i18n.t('boards.settings.confirmDeleteMessage', {
            title: board.title
          })
        "
        [confirmText]="i18n.t('common.delete')"
        [cancelText]="i18n.t('common.cancel')"
        [variant]="'danger'"
        [loading]="boardsStore.isSaving()"
        [requireConfirmation]="true"
        [confirmationText]="board.title"
        (confirm)="deleteBoard()"
        (cancel)="showDeleteConfirm = false"
      ></app-confirm-modal>
      }
    </div>
  `,
})
export class BoardSettingsComponent implements OnInit {
  // Icons
  readonly Settings = Settings;
  readonly Edit = Edit;
  readonly Palette = Palette;
  readonly MessageSquare = MessageSquare;
  readonly Users = Users;
  readonly UserPlus = UserPlus;
  readonly Clock = Clock;
  readonly Archive = Archive;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Shield = Shield;
  readonly Crown = Crown;
  readonly Save = Save;
  readonly X = X;
  readonly AlertTriangle = AlertTriangle;
  readonly Info = Info;
  readonly CheckCircle = CheckCircle;
  readonly Loader2 = Loader2;

  // Services
  private fb = inject(FormBuilder);
  boardsStore = inject(BoardsStore);
  private boardService = inject(BoardService);
  i18n = inject(TranslationService);
  private toastService = inject(ToastService);

  // Inputs
  @Input({ required: true }) board!: Board;

  // Component State
  selectedColor = signal<string>('');
  showArchiveConfirm = false;
  showDeleteConfirm = false;
  originalBoardData = signal<any>(null);
  originalSettingsData = signal<any>(null);

  // Forms
  boardForm!: FormGroup;
  settingsForm!: FormGroup;

  // Data
  colors: BoardColor[] = [];

  // Computed Properties
  canDeleteBoard = computed(() => {
    return this.board?.userRole === 'OWNER';
  });

  hasChanges = computed(() => {
    if (!this.originalBoardData()) return false;

    const current = {
      title: this.boardForm.get('title')?.value,
      description: this.boardForm.get('description')?.value,
      color: this.selectedColor(),
    };

    return JSON.stringify(current) !== JSON.stringify(this.originalBoardData());
  });

  hasSettingsChanges = computed(() => {
    if (!this.originalSettingsData()) return false;

    const current = this.settingsForm.value;
    return (
      JSON.stringify(current) !== JSON.stringify(this.originalSettingsData())
    );
  });

  ngOnInit() {
    this.initializeForms();
    this.loadColors();
    this.populateFormsWithBoardData();
  }

  private initializeForms() {
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
    });

    this.settingsForm = this.fb.group({
      allowComments: [true],
      requireInviteApproval: [false],
      allowMemberInvite: [true],
      autoArchiveCompletedDays: [''],
    });
  }

  private loadColors() {
    this.colors = this.boardService.getBoardColors();
  }

  private populateFormsWithBoardData() {
    if (!this.board) return;

    // Populate board form
    this.boardForm.patchValue({
      title: this.board.title,
      description: this.board.description || '',
    });

    // Set selected color
    this.selectedColor.set(this.board.color || '#3b82f6');

    // Populate settings form
    if (this.board.settings) {
      this.settingsForm.patchValue({
        allowComments: this.board.settings.allowComments ?? true,
        requireInviteApproval:
          this.board.settings.requireInviteApproval ?? false,
        allowMemberInvite: this.board.settings.allowMemberInvite ?? true,
        autoArchiveCompletedDays:
          this.board.settings.autoArchiveCompletedDays?.toString() || '',
      });
    }

    // Store original data for change detection
    this.originalBoardData.set({
      title: this.board.title,
      description: this.board.description || '',
      color: this.board.color || '#3b82f6',
    });

    this.originalSettingsData.set({
      allowComments: this.board.settings?.allowComments ?? true,
      requireInviteApproval:
        this.board.settings?.requireInviteApproval ?? false,
      allowMemberInvite: this.board.settings?.allowMemberInvite ?? true,
      autoArchiveCompletedDays:
        this.board.settings?.autoArchiveCompletedDays?.toString() || '',
    });
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
        return this.i18n.t('validation.required');
      }
      if (field.errors['minlength']) {
        return this.i18n.t('validation.minLength', {
          length: field.errors['minlength'].requiredLength,
        });
      }
      if (field.errors['maxlength']) {
        return this.i18n.t('validation.maxLength', {
          length: field.errors['maxlength'].requiredLength,
        });
      }
    }
    return '';
  }

  // Save Methods
  async saveBoardInfo() {
    if (this.boardForm.invalid || !this.board?.id) {
      return;
    }

    const formValue = this.boardForm.value;
    const updateRequest: UpdateBoardRequest = {
      title: formValue.title,
      description: formValue.description,
      color: this.selectedColor(),
    };

    try {
      await this.boardsStore.updateBoard(this.board.id, updateRequest);

      // Update original data
      this.originalBoardData.set({
        title: formValue.title,
        description: formValue.description,
        color: this.selectedColor(),
      });

      this.toastService.success(this.i18n.t('boards.settings.boardUpdated'));
    } catch (error) {
      console.error('Failed to update board:', error);
    }
  }

  async saveSettings() {
    if (this.settingsForm.invalid || !this.board?.id) {
      return;
    }

    const formValue = this.settingsForm.value;
    const settingsRequest: UpdateBoardSettingsRequest = {
      allowComments: formValue.allowComments,
      requireInviteApproval: formValue.requireInviteApproval,
      allowMemberInvite: formValue.allowMemberInvite,
      autoArchiveCompletedDays: formValue.autoArchiveCompletedDays
        ? parseInt(formValue.autoArchiveCompletedDays)
        : undefined,
    };

    try {
      await this.boardsStore.updateBoardSettings(
        this.board.id,
        settingsRequest
      );

      // Update original data
      this.originalSettingsData.set(formValue);

      this.toastService.success(this.i18n.t('boards.settings.settingsUpdated'));
    } catch (error) {
      console.error('Failed to update board settings:', error);
    }
  }

  // Danger Zone Actions
  async archiveBoard() {
    if (!this.board?.id) return;

    try {
      await this.boardsStore.archiveBoard(this.board.id);
      this.showArchiveConfirm = false;
      this.toastService.success(this.i18n.t('boards.settings.boardArchived'));
    } catch (error) {
      console.error('Failed to archive board:', error);
    }
  }

  async restoreBoard() {
    if (!this.board?.id) return;

    try {
      await this.boardsStore.restoreBoard(this.board.id);
      this.toastService.success(this.i18n.t('boards.settings.boardRestored'));
    } catch (error) {
      console.error('Failed to restore board:', error);
    }
  }

  async deleteBoard() {
    if (!this.board?.id) return;

    try {
      await this.boardsStore.deleteBoard(this.board.id);
      this.showDeleteConfirm = false;
      this.toastService.success(this.i18n.t('boards.settings.boardDeleted'));

      // Navigate away from the deleted board
      window.location.href = '/boards';
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  }
}

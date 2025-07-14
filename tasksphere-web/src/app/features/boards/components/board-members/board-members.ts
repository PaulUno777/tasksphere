import {
  Component,
  computed,
  effect,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  LucideAngularModule,
  Users,
  UserPlus,
  Mail,
  Crown,
  Shield,
  User,
  Eye,
  MoreVertical,
  Trash2,
  Settings,
  Send,
  X,
  Check,
  AlertCircle,
  Loader2,
  Search,
  Filter,
} from 'lucide-angular';

import { BoardsStore } from '@store/boards.store';
import { ToastService, TranslationService } from '@core/services';
import { Board, BoardMember } from '@core/models';
import {
  AssignableBoardRole,
  InviteMemberRequest,
  InviteMultipleMembersRequest,
} from '@core/types';
import { ModalComponent } from '@shared/components/modal/modal';
import { DropdownMenuComponent } from '@shared/components/dropdown-menu/dropdown-menu';
import { BadgeComponent } from '@shared/components/badge/badge';
import { AvatarComponent } from '@shared/components/avatar/avatar';

@Component({
  selector: 'app-board-members',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ModalComponent,
    DropdownMenuComponent,
    BadgeComponent,
    AvatarComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-text-default">
            {{ i18n.t('boards.members.title') }}
          </h2>
          <p class="text-sm text-text-muted mt-1">
            {{
              i18n.t('boards.members.subtitle', {
                count: boardsStore.totalMembers(),
                boardTitle: board.title
              })
            }}
          </p>
        </div>

        @if (canManageMembers()) {
        <div class="flex items-center space-x-2">
          <button (click)="openInviteModal()" class="btn-primary btn-md">
            <lucide-icon
              [img]="UserPlus"
              [size]="16"
              class="mr-2"
            ></lucide-icon>
            {{ i18n.t('boards.members.invite') }}
          </button>
        </div>
        }
      </div>

      <!-- Member Statistics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-surface border border-border-default rounded-lg p-4">
          <div class="flex items-center space-x-2">
            <lucide-icon
              [img]="Crown"
              [size]="16"
              class="text-primary-500"
            ></lucide-icon>
            <span class="text-sm text-text-muted">{{
              i18n.t('boards.roles.owners')
            }}</span>
          </div>
          <div class="text-2xl font-bold text-text-default mt-1">
            {{ boardsStore.membersByRole().owners }}
          </div>
        </div>

        <div class="bg-surface border border-border-default rounded-lg p-4">
          <div class="flex items-center space-x-2">
            <lucide-icon
              [img]="Shield"
              [size]="16"
              class="text-success-500"
            ></lucide-icon>
            <span class="text-sm text-text-muted">{{
              i18n.t('boards.roles.admins')
            }}</span>
          </div>
          <div class="text-2xl font-bold text-text-default mt-1">
            {{ boardsStore.membersByRole().admins }}
          </div>
        </div>

        <div class="bg-surface border border-border-default rounded-lg p-4">
          <div class="flex items-center space-x-2">
            <lucide-icon
              [img]="User"
              [size]="16"
              class="text-text-default"
            ></lucide-icon>
            <span class="text-sm text-text-muted">{{
              i18n.t('boards.roles.members')
            }}</span>
          </div>
          <div class="text-2xl font-bold text-text-default mt-1">
            {{
              boardsStore.membersByRole().members +
                boardsStore.membersByRole().guests
            }}
          </div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="flex items-center space-x-4">
        <div class="flex-1 max-w-md">
          <div class="relative">
            <div
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
            >
              <lucide-icon
                [img]="Search"
                [size]="16"
                class="text-text-muted"
              ></lucide-icon>
            </div>
            <input
              type="search"
              [(ngModel)]="searchQuery"
              [placeholder]="i18n.t('boards.members.searchPlaceholder')"
              class="input-default pl-9 w-full"
            />
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <select [(ngModel)]="roleFilter" class="input-default">
            <option value="">{{ i18n.t('boards.members.allRoles') }}</option>
            <option value="OWNER">{{ i18n.t('boards.roles.owner') }}</option>
            <option value="ADMIN">{{ i18n.t('boards.roles.admin') }}</option>
            <option value="MEMBER">{{ i18n.t('boards.roles.member') }}</option>
            <option value="GUEST">{{ i18n.t('boards.roles.guest') }}</option>
          </select>
        </div>
      </div>

      <!-- Members List -->
      @if (boardsStore.isLoadingMembers()) {
      <div class="flex justify-center items-center h-32">
        <lucide-icon
          [img]="Loader2"
          [size]="24"
          class="animate-spin text-text-muted"
        ></lucide-icon>
      </div>
      } @else if (filteredMembers().length === 0) {
      <div class="text-center py-12">
        <lucide-icon
          [img]="Users"
          [size]="48"
          class="mx-auto text-text-muted mb-4"
        ></lucide-icon>
        <h3 class="text-lg font-medium text-text-default mb-2">
          {{ i18n.t('boards.members.noMembers') }}
        </h3>
        <p class="text-text-muted mb-4">
          {{ i18n.t('boards.members.noMembersDesc') }}
        </p>
        @if (canManageMembers()) {
        <button (click)="openInviteModal()" class="btn-primary btn-md">
          <lucide-icon [img]="UserPlus" [size]="16" class="mr-2"></lucide-icon>
          {{ i18n.t('boards.members.inviteFirst') }}
        </button>
        }
      </div>
      } @else {
      <div
        class="bg-surface border border-border-default rounded-lg overflow-hidden"
      >
        <div class="divide-y divide-border-default">
          @for (member of filteredMembers(); track member.id) {
          <div class="p-4 hover:bg-surface-muted transition-colors">
            <div class="flex items-center justify-between">
              <!-- Member Info -->
              <div class="flex items-center space-x-4">
                <app-avatar
                  [src]="member.user.avatarUrl ?? ''"
                  [name]="member.user.fullName"
                  [size]="'md'"
                ></app-avatar>

                <div>
                  <div class="flex items-center space-x-2">
                    <h3 class="text-sm font-medium text-text-default">
                      {{ member.user.fullName }}
                    </h3>
                    @if (member.user.id === currentUserId()) {
                    <span class="text-xs text-text-muted"
                      >({{ i18n.t('common.you') }})</span
                    >
                    }
                  </div>
                  <p class="text-sm text-text-muted">{{ member.user.email }}</p>

                  <!-- Member Status -->
                  <div class="flex items-center space-x-2 mt-1">
                    <app-badge
                      [variant]="getRoleBadgeVariant(member.role)"
                      [size]="'sm'"
                    >
                      <lucide-icon
                        [img]="getRoleIcon(member.role)"
                        [size]="12"
                        class="mr-1"
                      ></lucide-icon>
                      {{ getRoleLabel(member.role) }}
                    </app-badge>

                    @if (member.joinedAt) {
                    <span class="text-xs text-text-muted">
                      {{
                        i18n.t('boards.members.joinedOn', {
                          date: formatDate(member.joinedAt)
                        })
                      }}
                    </span>
                    }
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center space-x-2">
                @if (canManageMember(member)) {
                <app-dropdown-menu
                  [items]="getMemberMenuItems(member)"
                  [trigger]="'click'"
                  [placement]="'bottom-end'"
                >
                  <button
                    class="p-2 rounded-lg hover:bg-surface-strong text-text-muted hover:text-text-default transition-colors"
                    [attr.aria-label]="i18n.t('common.more')"
                  >
                    <lucide-icon [img]="MoreVertical" [size]="16"></lucide-icon>
                  </button>
                </app-dropdown-menu>
                }
              </div>
            </div>
          </div>
          }
        </div>
      </div>
      }

      <!-- Invite Modal -->
      @if (showInviteModal()) {
      <app-modal
        [title]="i18n.t('boards.members.inviteMembers')"
        [size]="'md'"
        (close)="closeInviteModal()"
      >
        <form
          [formGroup]="inviteForm"
          (ngSubmit)="onInviteSubmit()"
          class="space-y-4"
        >
          <!-- Invite Type Toggle -->
          <div
            class="flex items-center justify-center space-x-1 bg-surface-muted rounded-lg p-1"
          >
            <button
              type="button"
              (click)="setInviteMode('single')"
              [class]="
                inviteMode() === 'single'
                  ? 'bg-white text-text-default shadow-sm'
                  : 'text-text-muted'
              "
              class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            >
              {{ i18n.t('boards.members.inviteSingle') }}
            </button>
            <button
              type="button"
              (click)="setInviteMode('multiple')"
              [class]="
                inviteMode() === 'multiple'
                  ? 'bg-white text-text-default shadow-sm'
                  : 'text-text-muted'
              "
              class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors"
            >
              {{ i18n.t('boards.members.inviteMultiple') }}
            </button>
          </div>

          <!-- Single Email Invite -->
          @if (inviteMode() === 'single') {
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.t('auth.email') }} *
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
              >
                <lucide-icon
                  [img]="Mail"
                  [size]="16"
                  class="text-text-muted"
                ></lucide-icon>
              </div>
              <input
                id="email"
                type="email"
                formControlName="email"
                [placeholder]="i18n.t('boards.members.emailPlaceholder')"
                class="input-default pl-9 w-full"
                [class.border-danger-500]="isFieldInvalid('email')"
              />
            </div>
            @if (isFieldInvalid('email')) {
            <p class="mt-1 text-sm text-danger-600">
              {{ getFieldError('email') }}
            </p>
            }
          </div>
          }

          <!-- Multiple Emails Invite -->
          @else {
          <div>
            <label
              for="emails"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.t('boards.members.emails') }} *
            </label>
            <textarea
              id="emails"
              formControlName="emails"
              rows="4"
              [placeholder]="i18n.t('boards.members.emailsPlaceholder')"
              class="input-default w-full resize-none"
              [class.border-danger-500]="isFieldInvalid('emails')"
            ></textarea>
            <p class="mt-1 text-xs text-text-muted">
              {{ i18n.t('boards.members.emailsHint') }}
            </p>
            @if (isFieldInvalid('emails')) {
            <p class="mt-1 text-sm text-danger-600">
              {{ getFieldError('emails') }}
            </p>
            }
          </div>
          }

          <!-- Role Selection -->
          <div>
            <label
              for="role"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.t('boards.members.role') }} *
            </label>
            <select
              id="role"
              formControlName="role"
              class="input-default w-full"
              [class.border-danger-500]="isFieldInvalid('role')"
            >
              <option value="">
                {{ i18n.t('boards.members.selectRole') }}
              </option>
              @if (canAssignRole('ADMIN')) {
              <option value="ADMIN">{{ i18n.t('boards.roles.admin') }}</option>
              }
              <option value="MEMBER">
                {{ i18n.t('boards.roles.member') }}
              </option>
              <option value="GUEST">{{ i18n.t('boards.roles.guest') }}</option>
            </select>
            @if (isFieldInvalid('role')) {
            <p class="mt-1 text-sm text-danger-600">
              {{ getFieldError('role') }}
            </p>
            }

            <!-- Role Descriptions -->
            <div class="mt-2 space-y-1">
              <div class="text-xs text-text-muted">
                <strong>{{ i18n.t('boards.roles.admin') }}:</strong>
                {{ i18n.t('boards.roles.adminDesc') }}
              </div>
              <div class="text-xs text-text-muted">
                <strong>{{ i18n.t('boards.roles.member') }}:</strong>
                {{ i18n.t('boards.roles.memberDesc') }}
              </div>
              <div class="text-xs text-text-muted">
                <strong>{{ i18n.t('boards.roles.guest') }}:</strong>
                {{ i18n.t('boards.roles.guestDesc') }}
              </div>
            </div>
          </div>

          <!-- Personal Message -->
          <div>
            <label
              for="message"
              class="block text-sm font-medium text-text-default mb-2"
            >
              {{ i18n.t('boards.members.personalMessage') }} ({{
                i18n.t('common.optional')
              }})
            </label>
            <textarea
              id="message"
              formControlName="message"
              rows="3"
              [placeholder]="i18n.t('boards.members.messagePlaceholder')"
              class="input-default w-full resize-none"
            ></textarea>
          </div>

          <!-- Modal Actions -->
          <div
            class="flex items-center justify-end space-x-3 pt-4 border-t border-border-default"
          >
            <button
              type="button"
              (click)="closeInviteModal()"
              class="btn-ghost btn-md"
            >
              {{ i18n.t('common.cancel') }}
            </button>
            <button
              type="submit"
              [disabled]="inviteForm.invalid || boardsStore.isInviting()"
              class="btn-primary btn-md"
            >
              @if (boardsStore.isInviting()) {
              <lucide-icon
                [img]="Loader2"
                [size]="16"
                class="mr-2 animate-spin"
              ></lucide-icon>
              }
              <lucide-icon [img]="Send" [size]="16" class="mr-2"></lucide-icon>
              {{ i18n.t('boards.members.sendInvite') }}
            </button>
          </div>
        </form>
      </app-modal>
      }

      <!-- Role Change Modal -->
      @if (showRoleModal()) {
      <app-modal
        [title]="i18n.t('boards.members.changeRole')"
        [size]="'sm'"
        (close)="closeRoleModal()"
      >
        <div class="space-y-4">
          <div class="text-center">
            <app-avatar
              [src]="selectedMember()?.user?.avatarUrl ?? ''"
              [name]="selectedMember()?.user?.fullName ?? ''"
              [size]="'lg'"
              class="mx-auto mb-3"
            ></app-avatar>
            <h3 class="text-lg font-medium text-text-default">
              {{ selectedMember()?.user?.fullName }}
            </h3>
            <p class="text-sm text-text-muted">
              {{ selectedMember()?.user?.email }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-text-default mb-2">
              {{ i18n.t('boards.members.newRole') }}
            </label>
            <select [(ngModel)]="newRole" class="input-default w-full">
              @if (canAssignRole('ADMIN')) {
              <option value="ADMIN">{{ i18n.t('boards.roles.admin') }}</option>
              }
              <option value="MEMBER">
                {{ i18n.t('boards.roles.member') }}
              </option>
              <option value="GUEST">{{ i18n.t('boards.roles.guest') }}</option>
            </select>
          </div>

          <div
            class="flex items-center justify-end space-x-3 pt-4 border-t border-border-default"
          >
            <button (click)="closeRoleModal()" class="btn-ghost btn-md">
              {{ i18n.t('common.cancel') }}
            </button>
            <button
              (click)="confirmRoleChange()"
              [disabled]="!newRole() || boardsStore.isSaving()"
              class="btn-primary btn-md"
            >
              @if (boardsStore.isSaving()) {
              <lucide-icon
                [img]="Loader2"
                [size]="16"
                class="mr-2 animate-spin"
              ></lucide-icon>
              }
              {{ i18n.t('common.update') }}
            </button>
          </div>
        </div>
      </app-modal>
      }
    </div>
  `,
})
export class BoardMembersComponent implements OnInit {
  // Icons
  readonly Users = Users;
  readonly UserPlus = UserPlus;
  readonly Mail = Mail;
  readonly Crown = Crown;
  readonly Shield = Shield;
  readonly User = User;
  readonly Eye = Eye;
  readonly MoreVertical = MoreVertical;
  readonly Trash2 = Trash2;
  readonly Settings = Settings;
  readonly Send = Send;
  readonly X = X;
  readonly Check = Check;
  readonly AlertCircle = AlertCircle;
  readonly Loader2 = Loader2;
  readonly Search = Search;
  readonly Filter = Filter;

  // Services
  private fb = inject(FormBuilder);
  boardsStore = inject(BoardsStore);
  i18n = inject(TranslationService);
  private toastService = inject(ToastService);

  // Inputs
  @Input({ required: true }) board!: Board;

  // Component State
  searchQuery = signal('');
  roleFilter = signal('');
  showInviteModal = signal(false);
  showRoleModal = signal(false);
  inviteMode = signal<'single' | 'multiple'>('single');
  selectedMember = signal<BoardMember | null>(null);
  newRole = signal('');

  // Forms
  inviteForm!: FormGroup;

  // Form validation effect - update validators based on invite mode
  private validatorEffect = effect(() => {
    const mode = this.inviteMode();
    if (this.inviteForm) {
      if (mode === 'single') {
        this.inviteForm
          .get('email')
          ?.setValidators([Validators.required, Validators.email]);
        this.inviteForm.get('emails')?.clearValidators();
      } else {
        this.inviteForm.get('email')?.clearValidators();
        this.inviteForm.get('emails')?.setValidators([Validators.required]);
      }
      this.inviteForm.get('email')?.updateValueAndValidity();
      this.inviteForm.get('emails')?.updateValueAndValidity();
    }
  });

  // Computed Properties
  filteredMembers = computed(() => {
    let members = this.boardsStore.boardMembers();

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      members = members.filter(
        (member) =>
          member.user.fullName.toLowerCase().includes(query) ||
          member.user.email.toLowerCase().includes(query)
      );
    }

    // Filter by role
    const role = this.roleFilter();
    if (role) {
      members = members.filter((member) => member.role === role);
    }

    return members;
  });

  currentUserId = computed(() => {
    // This should come from AuthStore
    return 'current-user-id'; // TODO: Get from auth store
  });

  canManageMembers = computed(() => {
    return this.board?.userRole === 'OWNER' || this.board?.userRole === 'ADMIN';
  });

  ngOnInit() {
    this.initializeForms();
    this.loadMembers();
  }

  private initializeForms() {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      emails: [''],
      role: ['', Validators.required],
      message: [''],
    });
  }

  private async loadMembers() {
    if (this.board?.id) {
      await this.boardsStore.loadBoardMembers(this.board.id);
    }
  }

  // Member Management
  canManageMember(member: BoardMember): boolean {
    if (member.user.id === this.currentUserId()) {
      return false; // Can't manage self
    }

    if (this.board?.userRole === 'OWNER') {
      return true; // Owner can manage everyone
    }

    if (this.board?.userRole === 'ADMIN') {
      return member.role !== 'OWNER'; // Admin can't manage owners
    }

    return false;
  }

  canAssignRole(role: string): boolean {
    if (this.board?.userRole === 'OWNER') {
      return true; // Owner can assign any role except owner
    }

    if (this.board?.userRole === 'ADMIN') {
      return role !== 'OWNER'; // Admin can't assign owner role
    }

    return false;
  }

  getMemberMenuItems(member: BoardMember) {
    const items: import('@shared/components/dropdown-menu/dropdown-menu').DropdownMenuItem[] =
      [];

    // Change Role
    if (this.canManageMember(member)) {
      items.push({
        id: 'changeRole',
        label: this.i18n.t('boards.members.changeRole'),
        icon: this.Settings,
        action: () => this.openRoleModal(member),
        type: 'item',
      });
    }

    // Remove Member
    if (this.canManageMember(member)) {
      items.push({
        id: 'divider-1',
        label: '',
        type: 'divider',
      });
      items.push({
        id: 'remove',
        label: this.i18n.t('boards.members.removeMember'),
        icon: this.Trash2,
        variant: 'danger',
        action: () => this.removeMember(member),
        type: 'item',
      });
    }

    return items;
  }

  // Modal Management
  openInviteModal() {
    this.showInviteModal.set(true);
    this.inviteForm.reset();
    this.inviteForm.patchValue({ role: 'MEMBER' });
  }

  closeInviteModal() {
    this.showInviteModal.set(false);
    this.inviteForm.reset();
  }

  openRoleModal(member: BoardMember) {
    this.selectedMember.set(member);
    this.newRole.set(member.role);
    this.showRoleModal.set(true);
  }

  closeRoleModal() {
    this.showRoleModal.set(false);
    this.selectedMember.set(null);
    this.newRole.set('');
  }

  setInviteMode(mode: 'single' | 'multiple') {
    this.inviteMode.set(mode);
    this.inviteForm.reset();
    this.inviteForm.patchValue({ role: 'MEMBER' });
  }

  // Form Handling
  async onInviteSubmit() {
    if (this.inviteForm.invalid || !this.board?.id) {
      return;
    }

    const formValue = this.inviteForm.value;

    try {
      if (this.inviteMode() === 'single') {
        const request: InviteMemberRequest = {
          email: formValue.email,
          role: formValue.role,
          message: formValue.message,
        };

        await this.boardsStore.inviteMember(this.board.id, request);
      } else {
        const emails = formValue.emails
          .split(/[,\n]/)
          .map((email: string) => email.trim())
          .filter((email: string) => email.length > 0);

        const request: InviteMultipleMembersRequest = {
          emails,
          role: formValue.role,
          message: formValue.message,
        };

        await this.boardsStore.inviteMultipleMembers(this.board.id, request);
      }

      this.closeInviteModal();
    } catch (error) {
      console.error('Failed to invite members:', error);
    }
  }

  async confirmRoleChange() {
    const member = this.selectedMember();
    const role = this.newRole();

    if (!member || !role || !this.board?.id) {
      return;
    }

    try {
      await this.boardsStore.updateMemberRole(this.board.id, member.id, {
        role: role as AssignableBoardRole,
      });
      this.closeRoleModal();
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  }

  async removeMember(member: BoardMember) {
    if (
      !confirm(
        this.i18n.t('boards.members.confirmRemove', {
          name: member.user.fullName,
        })
      )
    ) {
      return;
    }

    if (!this.board?.id) {
      return;
    }

    try {
      await this.boardsStore.removeMember(this.board.id, member.id);
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  }

  // Helper Methods
  getRoleIcon(role: string) {
    switch (role) {
      case 'OWNER':
        return Crown;
      case 'ADMIN':
        return Shield;
      case 'MEMBER':
        return User;
      case 'GUEST':
        return Eye;
      default:
        return User;
    }
  }

  getRoleBadgeVariant(
    role: string
  ): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
    switch (role) {
      case 'OWNER':
        return 'primary';
      case 'ADMIN':
        return 'success';
      case 'MEMBER':
        return 'default';
      case 'GUEST':
        return 'warning';
      default:
        return 'default';
    }
  }

  getRoleLabel(role: string): string {
    return this.i18n.t(`boards.roles.${role.toLowerCase()}`);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.inviteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.inviteForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return this.i18n.t('validation.required');
      }
      if (field.errors['email']) {
        return this.i18n.t('validation.email');
      }
    }
    return '';
  }
}

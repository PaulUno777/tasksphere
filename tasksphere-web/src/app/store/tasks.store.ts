import { Injectable, inject, computed } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState,
} from '@ngrx/signals';
import { TaskService } from '@core/services/task.service';
import { CreateTaskRequest, UpdateTaskRequest } from '@core/types/task.types';
import { KanbanBoard, PageMetadata, Task } from '@core/models';
import { TaskQuery, TaskStatus } from '@core/types';

interface TasksState {
  tasks: Task[];
  kanbanTasks: KanbanBoard | null;
  myTasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDragging: boolean;
  error: string | null;
  filters: TaskQuery;
  viewMode: 'kanban' | 'list';
  pagination: PageMetadata;
}

const initialTaskFilters: TaskQuery = {
  status: undefined,
  priority: undefined,
  assignedTo: undefined,
  categoryId: undefined,
  search: '',
  isOverdue: undefined,
  page: 1,
  limit: 50,
  sortBy: 'position',
  sortOrder: 'asc',
};

const initialState: TasksState = {
  tasks: [],
  kanbanTasks: null,
  myTasks: [],
  currentTask: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDragging: false,
  error: null,
  filters: initialTaskFilters,
  viewMode: 'kanban',
  pagination: {
    page: 1,
    limit: 50,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
};

export const TasksStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(
    ({
      tasks,
      kanbanTasks,
      myTasks,
      currentTask,
      filters,
      isLoading,
      isCreating,
      isUpdating,
      isDragging,
      error,
    }) => ({
      filteredTasks: computed(() => {
        let filtered = tasks();
        const f = filters();

        if (f.search) {
          const searchLower = f.search.toLowerCase();
          filtered = filtered.filter(
            (task) =>
              task.title.toLowerCase().includes(searchLower) ||
              (task.description &&
                task.description.toLowerCase().includes(searchLower))
          );
        }

        if (f.status) {
          filtered = filtered.filter((task) => task.status === f.status);
        }

        if (f.priority) {
          filtered = filtered.filter((task) => task.priority === f.priority);
        }

        if (f.assignedTo) {
          filtered = filtered.filter(
            (task) =>
              Array.isArray(task.assignees) &&
              task.assignees.findIndex((item) => item.id === f.assignedTo) >= 0
          );
        }

        if (f.categoryId) {
          filtered = filtered.filter(
            (task) => task.categoryId === f.categoryId
          );
        }

        if (f.isOverdue !== undefined) {
          filtered = filtered.filter((task) => task.isOverdue === f.isOverdue);
        }

        return filtered;
      }),
      taskCount: computed(() => tasks().length),
      myTaskCount: computed(() => myTasks().length),
      hasError: computed(() => !!error()),
      isAnyLoading: computed(() => isLoading() || isCreating() || isUpdating()),
      currentTaskTitle: computed(() => currentTask()?.title || ''),
      overdueTasks: computed(() => tasks().filter((task) => task.isOverdue)),
      overdueCount: computed(
        () => tasks().filter((task) => task.isOverdue).length
      ),
      tasksByStatus: computed(() => {
        const taskList = tasks();
        return {
          todo: taskList.filter((task) => task.status === 'TODO'),
          inProgress: taskList.filter((task) => task.status === 'IN_PROGRESS'),
          review: taskList.filter((task) => task.status === 'REVIEW'),
          completed: taskList.filter((task) => task.status === 'COMPLETED'),
        };
      }),
      tasksByPriority: computed(() => {
        const taskList = tasks();
        return {
          critical: taskList.filter((task) => task.priority === 'CRITICAL'),
          high: taskList.filter((task) => task.priority === 'HIGH'),
          medium: taskList.filter((task) => task.priority === 'MEDIUM'),
          low: taskList.filter((task) => task.priority === 'LOW'),
        };
      }),
      canDrop: computed(() => !isDragging()),
    })
  ),
  withMethods((store, taskService = inject(TaskService)) => ({
    // Task CRUD Operations
    async createTask(boardId: string, taskData: CreateTaskRequest) {
      patchState(store, { isCreating: true, error: null });

      try {
        const newTask = await taskService.createTask(boardId, taskData);

        patchState(store, {
          tasks: [...store.tasks(), newTask],
          isCreating: false,
          error: null,
        });

        // Update kanban view if active
        if (store.kanbanTasks()) {
          this.loadKanbanTasks(boardId);
        }

        return newTask;
      } catch (error: any) {
        patchState(store, {
          isCreating: false,
          error: error.message || 'Failed to create task',
        });
        throw error;
      }
    },

    async loadTask(taskId: string) {
      patchState(store, { isLoading: true, error: null });

      try {
        const task = await taskService.getTask(taskId);

        patchState(store, {
          currentTask: task,
          isLoading: false,
          error: null,
        });

        return task;
      } catch (error: any) {
        patchState(store, {
          currentTask: null,
          isLoading: false,
          error: error.message || 'Failed to load task',
        });
        throw error;
      }
    },

    async loadBoardTasks(boardId: string, filters?: TaskQuery) {
      patchState(store, { isLoading: true, error: null });

      // Update filters if provided
      if (filters) {
        patchState(store, {
          filters: { ...store.filters(), ...filters },
        });
      }

      try {
        const response = await taskService.getBoardTasks(
          boardId,
          store.filters()
        );

        patchState(store, {
          tasks: response.list,
          pagination: {
            ...store.pagination(),
            totalItems: response.metadata.totalItems,
            totalPages: response.metadata.totalPages,
            hasNext: response.metadata.hasNext,
            hasPrev: response.metadata.hasPrev,
          },
          isLoading: false,
          error: null,
        });

        return response;
      } catch (error: any) {
        patchState(store, {
          isLoading: false,
          error: error.message || 'Failed to load tasks',
        });
        throw error;
      }
    },

    async loadKanbanTasks(boardId: string) {
      patchState(store, { isLoading: true, error: null });

      try {
        const kanbanData = await taskService.getKanbanBoard(boardId);

        patchState(store, {
          kanbanTasks: kanbanData,
          tasks: [
            ...kanbanData.todo,
            ...kanbanData.inProgress,
            ...kanbanData.review,
            ...kanbanData.completed,
          ],
          isLoading: false,
          error: null,
        });

        return kanbanData;
      } catch (error: any) {
        patchState(store, {
          isLoading: false,
          error: error.message || 'Failed to load kanban tasks',
        });
        throw error;
      }
    },

    async loadMyTasks(filters?: TaskQuery) {
      patchState(store, { isLoading: true, error: null });

      try {
        const response = await taskService.getMyTasks(filters);

        patchState(store, {
          myTasks: response.list,
          isLoading: false,
          error: null,
        });

        return response;
      } catch (error: any) {
        patchState(store, {
          isLoading: false,
          error: error.message || 'Failed to load my tasks',
        });
        throw error;
      }
    },

    async updateTask(taskId: string, taskData: UpdateTaskRequest) {
      patchState(store, { isUpdating: true, error: null });

      try {
        const updatedTask = await taskService.updateTask(taskId, taskData);

        patchState(store, {
          tasks: store
            .tasks()
            .map((task) => (task.id === taskId ? updatedTask : task)),
          currentTask:
            store.currentTask()?.id === taskId
              ? updatedTask
              : store.currentTask(),
          isUpdating: false,
          error: null,
        });

        // Update kanban view if active
        if (store.kanbanTasks()) {
          this.updateKanbanTask(updatedTask);
        }

        return updatedTask;
      } catch (error: any) {
        patchState(store, {
          isUpdating: false,
          error: error.message || 'Failed to update task',
        });
        throw error;
      }
    },

    async updateTaskStatus(taskId: string, status: TaskStatus) {
      patchState(store, { isUpdating: true, error: null });

      try {
        const updatedTask = await taskService.updateTaskStatus(taskId, {
          status,
        });

        patchState(store, {
          tasks: store
            .tasks()
            .map((task) => (task.id === taskId ? updatedTask : task)),
          currentTask:
            store.currentTask()?.id === taskId
              ? updatedTask
              : store.currentTask(),
          isUpdating: false,
          error: null,
        });

        // Update kanban view if active
        if (store.kanbanTasks()) {
          this.updateKanbanTask(updatedTask);
        }

        return updatedTask;
      } catch (error: any) {
        patchState(store, {
          isUpdating: false,
          error: error.message || 'Failed to update task status',
        });
        throw error;
      }
    },

    async assignTask(taskId: string, assignedTo?: string) {
      patchState(store, { isUpdating: true, error: null });

      try {
        const updatedTask = await taskService.assignTask(taskId, {
          assignedTo,
        });

        patchState(store, {
          tasks: store
            .tasks()
            .map((task) => (task.id === taskId ? updatedTask : task)),
          currentTask:
            store.currentTask()?.id === taskId
              ? updatedTask
              : store.currentTask(),
          isUpdating: false,
          error: null,
        });

        // Update kanban view if active
        if (store.kanbanTasks()) {
          this.updateKanbanTask(updatedTask);
        }

        return updatedTask;
      } catch (error: any) {
        patchState(store, {
          isUpdating: false,
          error: error.message || 'Failed to assign task',
        });
        throw error;
      }
    },

    async moveTask(taskId: string, newStatus: TaskStatus, newPosition: number) {
      patchState(store, { isUpdating: true, error: null });

      try {
        const updatedTask = await taskService.updateTaskPosition(taskId, {
          position: newPosition,
          status: newStatus,
        });

        patchState(store, {
          tasks: store
            .tasks()
            .map((task) => (task.id === taskId ? updatedTask : task)),
          isUpdating: false,
          error: null,
        });

        // Update kanban view if active
        if (store.kanbanTasks()) {
          this.updateKanbanTask(updatedTask);
        }

        return updatedTask;
        return updatedTask;
      } catch (error: any) {
        patchState(store, {
          isUpdating: false,
          error: error.message || 'Failed to move task',
        });
        throw error;
      }
    },

    async deleteTask(taskId: string) {
      patchState(store, { isUpdating: true, error: null });

      try {
        await taskService.deleteTask(taskId);

        patchState(store, {
          tasks: store.tasks().filter((task) => task.id !== taskId),
          currentTask:
            store.currentTask()?.id === taskId ? null : store.currentTask(),
          isUpdating: false,
          error: null,
        });

        // Update kanban view if active
        if (store.kanbanTasks()) {
          const kanban = store.kanbanTasks()!;
          patchState(store, {
            kanbanTasks: {
              todo: kanban.todo.filter((task) => task.id !== taskId),
              inProgress: kanban.inProgress.filter(
                (task) => task.id !== taskId
              ),
              review: kanban.review.filter((task) => task.id !== taskId),
              completed: kanban.completed.filter((task) => task.id !== taskId),
            },
          });
        }
      } catch (error: any) {
        patchState(store, {
          isUpdating: false,
          error: error.message || 'Failed to delete task',
        });
        throw error;
      }
    },

    async archiveTask(taskId: string) {
      patchState(store, { isUpdating: true, error: null });

      try {
        await taskService.archiveTask(taskId);

        patchState(store, {
          tasks: store.tasks().filter((task) => task.id !== taskId),
          currentTask:
            store.currentTask()?.id === taskId ? null : store.currentTask(),
          isUpdating: false,
          error: null,
        });
      } catch (error: any) {
        patchState(store, {
          isUpdating: false,
          error: error.message || 'Failed to archive task',
        });
        throw error;
      }
    },

    async restoreTask(taskId: string) {
      patchState(store, { isUpdating: true, error: null });

      try {
        await taskService.restoreTask(taskId);

        patchState(store, {
          isUpdating: false,
          error: null,
        });
      } catch (error: any) {
        patchState(store, {
          isUpdating: false,
          error: error.message || 'Failed to restore task',
        });
        throw error;
      }
    },

    // Drag & Drop Operations
    setDragging(isDragging: boolean) {
      patchState(store, { isDragging });
    },

    optimisticMoveTask(
      taskId: string,
      fromStatus: TaskStatus,
      toStatus: TaskStatus,
      newPosition: number
    ) {
      const task = store.tasks().find((t) => t.id === taskId);
      if (!task) return;

      // Optimistically update task status and position
      const updatedTask = {
        ...task,
        status: toStatus,
        position: newPosition,
      };

      patchState(store, {
        tasks: store.tasks().map((t) => (t.id === taskId ? updatedTask : t)),
      });

      // Update kanban view
      if (store.kanbanTasks()) {
        this.updateKanbanTask(updatedTask);
      }
    },

    updateKanbanTask(updatedTask: Task) {
      const kanban = store.kanbanTasks();
      if (!kanban) return;

      // Remove task from all columns
      const todo = kanban.todo.filter((task) => task.id !== updatedTask.id);
      const inProgress = kanban.inProgress.filter(
        (task) => task.id !== updatedTask.id
      );
      const review = kanban.review.filter((task) => task.id !== updatedTask.id);
      const completed = kanban.completed.filter(
        (task) => task.id !== updatedTask.id
      );

      // Add task to appropriate column
      switch (updatedTask.status) {
        case 'TODO':
          todo.push(updatedTask);
          break;
        case 'IN_PROGRESS':
          inProgress.push(updatedTask);
          break;
        case 'REVIEW':
          review.push(updatedTask);
          break;
        case 'COMPLETED':
          completed.push(updatedTask);
          break;
      }

      patchState(store, {
        kanbanTasks: {
          todo: todo.sort((a, b) => a.position - b.position),
          inProgress: inProgress.sort((a, b) => a.position - b.position),
          review: review.sort((a, b) => a.position - b.position),
          completed: completed.sort((a, b) => a.position - b.position),
        },
      });
    },

    // State Management
    setCurrentTask(task: Task | null) {
      patchState(store, { currentTask: task });
    },

    setViewMode(mode: 'kanban' | 'list') {
      patchState(store, { viewMode: mode });
    },

    updateFilters(filters: Partial<TaskQuery>) {
      patchState(store, {
        filters: { ...store.filters(), ...filters },
      });
    },

    resetFilters() {
      patchState(store, {
        filters: initialTaskFilters,
        pagination: initialState.pagination,
      });
    },

    clearError() {
      patchState(store, { error: null });
    },

    clearTasks() {
      patchState(store, {
        tasks: [],
        kanbanTasks: null,
        currentTask: null,
      });
    },
  }))
);

/**
 * Task Store - Zustand
 * Task management state with filtering, sorting, and real-time updates
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/services/storage';
import {
  Task,
  TaskStatus,
  TaskCategory,
  TaskUrgency,
  TaskFilters,
  TaskSortOptions,
  PaginatedResponse
} from '@/types';
import { apiGet, apiPost, apiPut, apiDelete, ENDPOINTS, isMockApiEnabled } from '@/services/api';

// Review entry as consumed by the task-reviews screen
export interface TaskReviewEntry {
  id: string;
  taskId?: string;
  taskTitle?: string;
  reviewerId?: string;
  reviewerName?: string;
  revieweeId?: string;
  type: 'given' | 'received';
  rating: number;
  comment?: string;
  createdAt: string;
}

// Application entry as consumed by the task-applications screen
export interface TaskApplication {
  id: string;
  taskId?: string;
  applicantId: string;
  applicantName: string;
  applicantRating?: number;
  applicantCompletedTasks?: number;
  applicantDistance?: number;
  message?: string;
  proposedBudget?: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: string;
}

interface TaskState {
  // State
  tasks: Task[];
  myTasks: Task[]; // Tasks created by current user
  assignedTasks: Task[]; // Tasks assigned to current user (buddy)
  nearbyTasks: Task[]; // Tasks near current location
  currentTask: Task | null;
  filters: TaskFilters;
  sortOptions: TaskSortOptions;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  isLoadingMore: boolean;
  isCreating: boolean;
  isApplying: boolean;
  error: string | null;

  // Screen-consumed collections
  reviews: TaskReviewEntry[];
  applications: TaskApplication[];

  // Real-time subscriptions
  isSubscribed: boolean;

  // Async (REST-first) actions used by screens
  fetchTasks: (params?: Record<string, any>) => Promise<Task[]>;
  fetchTaskById: (taskId: string) => Promise<Task | undefined>;
  createTask: (payload: Record<string, any>) => Promise<boolean>;
  applyToTask: (taskId: string, payload?: { message?: string; proposedBudget?: number }) => Promise<boolean>;
  fetchReviews: (taskId?: string) => Promise<TaskReviewEntry[]>;
  refreshTasks: () => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus | string) => Promise<void>;
  refreshApplications: (taskId: string) => Promise<void>;
  acceptApplication: (applicationId: string) => void;
  rejectApplication: (applicationId: string) => void;
  clearError: () => void;
  clearCurrentTask: () => void;

  // Derived lists (expose as state-shaped getters for destructuring screens)
  readonly postedTasks: Task[];
  readonly appliedTasks: Task[];
  readonly completedTasks: Task[];

  // Actions
  setTasks: (tasks: Task[]) => void;
  setMyTasks: (tasks: Task[]) => void;
  setAssignedTasks: (tasks: Task[]) => void;
  setNearbyTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskOrId: Task | string, payload?: Record<string, any>) => void | Promise<void>;
  removeTask: (taskId: string) => void;
  setCurrentTask: (task: Task | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  setSortOptions: (options: Partial<TaskSortOptions>) => void;
  setPagination: (pagination: Partial<TaskState['pagination']>) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSubscribed: (subscribed: boolean) => void;
  
  // Real-time updates
  handleTaskCreated: (task: Task) => void;
  handleTaskUpdated: (task: Task) => void;
  handleTaskDeleted: (taskId: string) => void;
  handleTaskAssigned: (task: Task, buddyId: string) => void;
  handleTaskStatusChanged: (taskId: string, status: TaskStatus, updatedBy: string) => void;
  
  // Computed
  getFilteredTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByCategory: (category: TaskCategory) => Task[];
  clearAll: () => void;
}

const defaultFilters: TaskFilters = {};
const defaultSortOptions: TaskSortOptions = {
  field: 'createdAt',
  order: 'desc',
};

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: true,
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      myTasks: [],
      assignedTasks: [],
      nearbyTasks: [],
      currentTask: null,
      filters: defaultFilters,
      sortOptions: defaultSortOptions,
      pagination: defaultPagination,
      isLoading: false,
      isLoadingMore: false,
      isCreating: false,
      isApplying: false,
      error: null,
      reviews: [],
      applications: [],
      isSubscribed: false,
      
      // Actions
      setTasks: (tasks) => set({ tasks, isLoading: false, error: null }),
      
      setMyTasks: (myTasks) => set({ myTasks }),
      
      setAssignedTasks: (assignedTasks) => set({ assignedTasks }),
      
      setNearbyTasks: (nearbyTasks) => set({ nearbyTasks }),
      
      addTask: (task) => set((state) => ({
        tasks: [task, ...state.tasks],
        myTasks: [task, ...state.myTasks],
        pagination: { ...state.pagination, total: state.pagination.total + 1 },
      })),
      
      updateTask: (taskOrId, payload) => {
        // Local update when handed a full Task object (existing behavior)
        if (typeof taskOrId !== 'string') {
          const updatedTask = taskOrId;
          set((state) => ({
            tasks: state.tasks.map((t) => t.id === updatedTask.id ? updatedTask : t),
            myTasks: state.myTasks.map((t) => t.id === updatedTask.id ? updatedTask : t),
            assignedTasks: state.assignedTasks.map((t) => t.id === updatedTask.id ? updatedTask : t),
            nearbyTasks: state.nearbyTasks.map((t) => t.id === updatedTask.id ? updatedTask : t),
            currentTask: state.currentTask?.id === updatedTask.id ? updatedTask : state.currentTask,
          }));
          return;
        }

        // Remote update: PUT /tasks/:id with payload, then merge locally.
        return (async () => {
          const taskId = taskOrId;
          const existing = get().getTaskById(taskId);
          if (!existing) {
            throw new Error('Task not found');
          }

          const optimistic: Task = ({ ...existing, ...(payload || {}) } as Task);
          get().updateTask(optimistic);

          try {
            const body: Record<string, any> = { ...(payload || {}) };
            if (typeof body.budget === 'number') {
              body.budget = { amount: Math.round(body.budget), currency: 'INR', type: 'fixed' };
            }
            await apiPut(ENDPOINTS.tasks.update(taskId), body);
            // Realtime listener will re-sync the authoritative copy.
          } catch (error) {
            console.warn('[TaskStore] updateTask remote failed (optimistic kept):', error);
            if (isMockApiEnabled) return;
            // Roll back optimistic change on hard failure
            get().updateTask(existing);
            throw error;
          }
        })();
      },
      
      removeTask: (taskId) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
        myTasks: state.myTasks.filter((t) => t.id !== taskId),
        assignedTasks: state.assignedTasks.filter((t) => t.id !== taskId),
        nearbyTasks: state.nearbyTasks.filter((t) => t.id !== taskId),
        currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
        pagination: { ...state.pagination, total: Math.max(0, state.pagination.total - 1) },
      })),
      
      setCurrentTask: (currentTask) => set({ currentTask }),
      
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
        pagination: { ...state.pagination, page: 1 }, // Reset to first page
      })),
      
      resetFilters: () => set({ filters: defaultFilters, pagination: { ...defaultPagination, page: 1 } }),
      
      setSortOptions: (options) => set((state) => ({
        sortOptions: { ...state.sortOptions, ...options },
        pagination: { ...state.pagination, page: 1 },
      })),
      
      setPagination: (pagination) => set((state) => ({
        pagination: { ...state.pagination, ...pagination },
      })),
      
      setLoading: (isLoading) => set({ isLoading, error: isLoading ? null : get().error }),
      
      setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
      
      setError: (error) => set({ error, isLoading: false, isLoadingMore: false }),
      
      setSubscribed: (isSubscribed) => set({ isSubscribed }),

      // ------------------------------------------------------------
      // Async (REST-first) actions. Failures are non-fatal by design:
      // realtime Firestore listeners re-sync authoritative data.
      // ------------------------------------------------------------

      fetchTasks: async (params) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiGet<any>(ENDPOINTS.tasks.list, { params });
          const list: Task[] = (data?.tasks ?? data?.data ?? data ?? []) as Task[];
          if (Array.isArray(list)) {
            set({ tasks: list });
          }
          set({ isLoading: false });
          return get().tasks;
        } catch (error) {
          console.warn('[TaskStore] fetchTasks failed:', error);
          set({ isLoading: false });
          return get().tasks;
        }
      },

      fetchTaskById: async (taskId) => {
        const cached = get().getTaskById(taskId);
        if (cached) set({ currentTask: cached });
        try {
          const data = await apiGet<any>(ENDPOINTS.tasks.get(taskId));
          const task = (data?.task ?? data) as Task;
          if (task && task.id) {
            set({ currentTask: task });
            return task;
          }
        } catch (error) {
          console.warn('[TaskStore] fetchTaskById failed:', error);
        }
        return get().currentTask ?? cached;
      },

      createTask: async (payload) => {
        set({ isCreating: true, error: null });
        try {
          const body: Record<string, any> = { ...(payload || {}) };
          if (typeof body.budget === 'number') {
            body.budget = { amount: Math.round(body.budget), currency: 'INR', type: 'fixed' };
          }
          const data = await apiPost<any>(ENDPOINTS.tasks.create, body);
          const task = (data?.task ?? data) as Task;
          if (task && task.id) {
            get().addTask(task);
          }
          set({ isCreating: false });
          return true;
        } catch (error: any) {
          console.warn('[TaskStore] createTask failed:', error);
          set({
            isCreating: false,
            error: error?.response?.data?.message || 'Failed to create task',
          });
          return false;
        }
      },

      applyToTask: async (taskId, payload) => {
        // NOTE: there is no buddy-application endpoint on the backend
        // (POST /tasks/:id/assign is the poster action). We mark the
        // application locally; the realtime listener re-syncs the task.
        set({ isApplying: true, error: null });
        try {
          const task = get().getTaskById(taskId);
          if (task) {
            const application = {
              taskId,
              applicantId: 'current-user',
              applicantName: 'You',
              message: payload?.message,
              proposedBudget: payload?.proposedBudget,
              status: 'pending',
              createdAt: new Date().toISOString(),
            } as any;
            get().updateTask({
              ...(task as any),
              applications: [...(((task as any).applications) || []), application],
              applicationsCount: (((task as any).applicationsCount) || 0) + 1,
            } as Task);
          }
          set({ isApplying: false });
          return true;
        } catch (error) {
          console.warn('[TaskStore] applyToTask failed:', error);
          set({ isApplying: false });
          return false;
        }
      },

      fetchReviews: async (taskId) => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiGet<any>('/reviews', {
            params: { ...(taskId ? { taskId } : {}), limit: 50 },
          });
          const raw: any[] = data?.reviews ?? data?.data ?? [];
          set({
            reviews: raw.map((r: any) => ({
              id: r.id,
              taskId: r.taskId,
              taskTitle: r.taskTitle,
              reviewerId: r.reviewerId,
              reviewerName: r.reviewerName ?? 'User',
              revieweeId: r.revieweeId,
              type: 'received',
              rating: r.rating ?? 0,
              comment: r.comment,
              createdAt: r.createdAt ?? '',
            })),
            isLoading: false,
          });
        } catch (error) {
          console.warn('[TaskStore] fetchReviews failed:', error);
          set({ isLoading: false });
        }
        return get().reviews;
      },

      refreshTasks: async () => {
        await get().fetchTasks();
        try {
          const mine = await apiGet<any>('/tasks/my/posted');
          const list: Task[] = (mine?.tasks ?? mine?.data ?? []) as Task[];
          if (Array.isArray(list) && list.length) {
            set({ myTasks: list });
          }
        } catch (error) {
          console.warn('[TaskStore] refreshTasks (posted) failed:', error);
        }
      },

      deleteTask: async (taskId) => {
        get().removeTask(taskId);
        try {
          await apiDelete(ENDPOINTS.tasks.delete(taskId));
        } catch (error) {
          console.warn('[TaskStore] deleteTask remote failed (local kept):', error);
        }
      },

      updateTaskStatus: async (taskId, status) => {
        // Normalize to backend statuses when possible
        const backendStatus = String(status);
        const existing = get().getTaskById(taskId);
        if (existing) {
          get().updateTask({ ...existing, status: backendStatus as TaskStatus });
        }
        try {
          await apiPut(`/tasks/${taskId}/status`, { status: backendStatus });
        } catch (error) {
          console.warn('[TaskStore] updateTaskStatus remote failed (local kept):', error);
        }
      },

      refreshApplications: async (_taskId) => {
        // No backend endpoint for applications yet; keep local list.
        set({ applications: get().applications });
      },

      acceptApplication: (applicationId) => set((state) => ({
        applications: state.applications.map((a) =>
          a.id === applicationId ? { ...a, status: 'accepted' } : a
        ),
      })),

      rejectApplication: (applicationId) => set((state) => ({
        applications: state.applications.map((a) =>
          a.id === applicationId ? { ...a, status: 'rejected' } : a
        ),
      })),

      clearError: () => set({ error: null }),

      clearCurrentTask: () => set({ currentTask: null }),

      // Derived lists (destructured by screens)
      get postedTasks() {
        return get().myTasks;
      },
      get appliedTasks() {
        return get().assignedTasks;
      },
      get completedTasks() {
        const { tasks, myTasks, assignedTasks } = get();
        const all = [...tasks, ...myTasks, ...assignedTasks];
        const seen = new Set<string>();
        return all.filter((t) => {
          if (t.status !== 'completed') return false;
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });
      },

      // Real-time handlers
      handleTaskCreated: (task) => {
        set((s) => ({
          tasks: [task, ...s.tasks],
          pagination: { ...s.pagination, total: s.pagination.total + 1 },
        }));
      },
      
      handleTaskUpdated: (task) => {
        get().updateTask(task);
      },
      
      handleTaskDeleted: (taskId) => {
        get().removeTask(taskId);
      },
      
      handleTaskAssigned: (task, buddyId) => {
        const state = get();
        const updatedTask = { ...task, buddy: task.buddy || { id: buddyId } as any };
        get().updateTask(updatedTask);
        
        // If current user is the buddy, add to assigned tasks
        // This would need auth store integration
      },
      
      handleTaskStatusChanged: (taskId, status, updatedBy) => {
        const task = get().getTaskById(taskId);
        if (task) {
          get().updateTask({ ...task, status });
        }
      },
      
      // Computed
      getFilteredTasks: () => {
        const { tasks, filters, sortOptions } = get();
        let filtered = [...tasks];
        
        // Apply filters
        if (filters.status?.length) {
          filtered = filtered.filter((t) => filters.status!.includes(t.status));
        }
        if (filters.category?.length) {
          filtered = filtered.filter((t) => filters.category!.includes(t.category));
        }
        if (filters.urgency?.length) {
          filtered = filtered.filter((t) => filters.urgency!.includes(t.urgency));
        }
        if (filters.minBudget !== undefined) {
          filtered = filtered.filter((t) => t.budget.amount >= filters.minBudget!);
        }
        if (filters.maxBudget !== undefined) {
          filtered = filtered.filter((t) => t.budget.amount <= filters.maxBudget!);
        }
        if (filters.distance !== undefined) {
          filtered = filtered.filter((t) => (t.buddy?.distance || 0) <= filters.distance! * 1000);
        }
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filtered = filtered.filter((t) => 
            t.title.toLowerCase().includes(search) ||
            t.description.toLowerCase().includes(search) ||
            t.location.address.toLowerCase().includes(search)
          );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          let aVal: any = (a as any)[sortOptions.field];
          let bVal: any = (b as any)[sortOptions.field];
          
          if (sortOptions.field === 'budget') {
            aVal = a.budget.amount;
            bVal = b.budget.amount;
          } else if (sortOptions.field === 'distance') {
            aVal = a.buddy?.distance || Infinity;
            bVal = b.buddy?.distance || Infinity;
          } else if (sortOptions.field === 'urgency') {
            const urgencyOrder = { low: 0, normal: 1, high: 2, urgent: 3 };
            aVal = urgencyOrder[a.urgency];
            bVal = urgencyOrder[b.urgency];
          }
          
          if (aVal < bVal) return sortOptions.order === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortOptions.order === 'asc' ? 1 : -1;
          return 0;
        });
        
        return filtered;
      },
      
      getTaskById: (id) => {
        const { tasks, myTasks, assignedTasks, nearbyTasks, currentTask } = get();
        return tasks.find((t) => t.id === id) ||
               myTasks.find((t) => t.id === id) ||
               assignedTasks.find((t) => t.id === id) ||
               nearbyTasks.find((t) => t.id === id) ||
               (currentTask?.id === id ? currentTask : undefined);
      },
      
      getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
      
      getTasksByCategory: (category) => get().tasks.filter((t) => t.category === category),
      
      clearAll: () => set({
        tasks: [],
        myTasks: [],
        assignedTasks: [],
        nearbyTasks: [],
        currentTask: null,
        filters: defaultFilters,
        sortOptions: defaultSortOptions,
        pagination: defaultPagination,
        isLoading: false,
        isLoadingMore: false,
        error: null,
      }),
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        filters: state.filters,
        sortOptions: state.sortOptions,
      }),
    }
  )
);

// Selectors
export const selectTasks = (state: TaskState) => state.tasks;
export const selectMyTasks = (state: TaskState) => state.myTasks;
export const selectAssignedTasks = (state: TaskState) => state.assignedTasks;
export const selectNearbyTasks = (state: TaskState) => state.nearbyTasks;
export const selectCurrentTask = (state: TaskState) => state.currentTask;
export const selectTaskFilters = (state: TaskState) => state.filters;
export const selectTaskSortOptions = (state: TaskState) => state.sortOptions;
export const selectTaskPagination = (state: TaskState) => state.pagination;
export const selectTaskLoading = (state: TaskState) => state.isLoading;
export const selectTaskLoadingMore = (state: TaskState) => state.isLoadingMore;
export const selectTaskError = (state: TaskState) => state.error;
export const selectFilteredTasks = (state: TaskState) => state.getFilteredTasks();
export const selectOpenTasks = (state: TaskState) => state.tasks.filter(t => t.status === 'open');
export const selectAssignedTasksCount = (state: TaskState) => state.assignedTasks.length;
export const selectMyTasksCount = (state: TaskState) => state.myTasks.length;
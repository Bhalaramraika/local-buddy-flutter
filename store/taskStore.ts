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
import { apiGet, apiPost, apiPut, apiDelete, ENDPOINTS, getApiErrorMessage } from '@/services/api';

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
  applicantAvatar?: string;
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
  acceptApplication: (taskId: string, applicationId: string) => Promise<boolean>;
  rejectApplication: (taskId: string, applicationId: string) => Promise<boolean>;
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

/**
 * Normalize a raw task document coming from the REST backend
 * (Firestore shape: budget NUMBER, location {latitude, longitude, address},
 * applicants: string[]) into the app's Task shape used by screens.
 * Mirrors mapTask() in services/realtime.ts so realtime and REST data look
 * identical to the UI.
 */
function normalizeTask(raw: any): Task {
  if (!raw || typeof raw !== 'object') return raw;
  return {
    ...raw,
    id: raw.id,
    budget: {
      amount: typeof raw.budget === 'number' ? raw.budget : (raw.budget?.amount ?? 0),
      currency: raw.budget?.currency ?? 'INR',
      type: raw.budget?.type ?? 'fixed',
    },
    location: {
      address: raw.location?.address ?? (typeof raw.location === 'string' ? raw.location : ''),
      area: raw.location?.area ?? '',
      city: raw.location?.city ?? '',
      coordinates: {
        latitude: raw.location?.latitude ?? raw.location?.coordinates?.latitude ?? 0,
        longitude: raw.location?.longitude ?? raw.location?.coordinates?.longitude ?? 0,
      },
      landmark: raw.location?.landmark,
    },
    applicants: Array.isArray(raw.applicants) ? raw.applicants : [],
    applicationsCount: Array.isArray(raw.applicants)
      ? raw.applicants.length
      : (raw.applicationsCount ?? 0),
    skills: raw.skills ?? raw.requirements ?? [],
    images: raw.images ?? [],
  } as Task;
}

/** Current signed-in user's id (lazy require avoids store import cycles). */
function currentUserId(): string | undefined {
  try {
    return require('@/store/authStore').useAuthStore.getState().user?.id;
  } catch {
    return undefined;
  }
}

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
            console.warn('[TaskStore] updateTask remote failed:', error);
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
          const rawList: any[] = data?.tasks ?? data?.data ?? (Array.isArray(data) ? data : []);
          if (Array.isArray(rawList)) {
            set({ tasks: rawList.map(normalizeTask) });
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
          const raw = data?.task ?? data;
          if (raw && raw.id) {
            const task = normalizeTask(raw);
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
          const src: Record<string, any> = { ...(payload || {}) };

          // Map the screen payload to the backend schema
          // (backend/src/routes/tasks.ts :: createTaskSchema):
          //   budget: NUMBER, location: {latitude, longitude, address},
          //   paymentMode: 'online'|'cash', requirements: string[]
          const budgetNumber =
            typeof src.budget === 'number'
              ? src.budget
              : Number(src.budget?.amount ?? 0);
          const location =
            src.location && typeof src.location === 'object'
              ? {
                  latitude: Number(src.location.latitude ?? src.latitude ?? 0),
                  longitude: Number(src.location.longitude ?? src.longitude ?? 0),
                  address: String(src.location.address ?? src.location.addressLine ?? '').trim(),
                }
              : {
                  latitude: Number(src.latitude ?? 0),
                  longitude: Number(src.longitude ?? 0),
                  address: String(src.location ?? '').trim(),
                };

          const body = {
            title: String(src.title ?? '').trim(),
            description: String(src.description ?? '').trim(),
            category: String(src.category ?? '').trim(),
            budget: Math.round(budgetNumber),
            tip: Number(src.tip ?? 0) || 0,
            location,
            deadline: src.deadline ? new Date(src.deadline).toISOString() : undefined,
            paymentMode: src.paymentMode === 'cash' ? 'cash' : 'online',
            requirements: Array.isArray(src.requirements)
              ? src.requirements
              : Array.isArray(src.skills)
                ? src.skills.slice(0, 10)
                : [],
            attachments: Array.isArray(src.attachments) ? src.attachments.slice(0, 5) : [],
          };

          const data = await apiPost<any>(ENDPOINTS.tasks.create, body);
          const task = (data?.task ?? data) as Task;
          if (task && task.id) {
            get().addTask(normalizeTask(task));
          }
          set({ isCreating: false, error: null });
          return true;
        } catch (error: any) {
          const message = getApiErrorMessage(error, 'Failed to create task. Please try again.');
          console.warn('[TaskStore] createTask failed:', error?.response?.data ?? error);
          set({ isCreating: false, error: message });
          // Rethrow so screens show the real backend message
          // (validation error, KYC requirement, ...) instead of failing silently.
          throw new Error(message);
        }
      },

      applyToTask: async (taskId, payload) => {
        // FIRST-COME-FIRST-SERVED: POST /tasks/:id/apply atomically assigns
        // the task to this buddy (no poster confirmation). Response carries
        // `assigned: true` + chatId; realtime listeners re-sync the doc.
        set({ isApplying: true, error: null });
        const uid = currentUserId();
        try {
          const res = await apiPost<any>(ENDPOINTS.tasks.apply(taskId), {
            message: payload?.message?.slice(0, 500),
            proposedAmount: payload?.proposedBudget,
          });

          const task = get().getTaskById(taskId);
          if (task && uid) {
            get().updateTask({
              ...(task as any),
              applicants: [...new Set([...(task.applicants || []), uid])],
              applicationsCount: ((task as any).applicationsCount || (task.applicants?.length ?? 0)) + 1,
              ...(res?.assigned
                ? { status: 'assigned' as TaskStatus, buddyId: uid, assignedAt: new Date().toISOString() }
                : {}),
            } as Task);
          }
          // Pull the authoritative task (assigned state + startedAt/paidAt etc.)
          get().fetchTaskById(taskId).catch(() => {});
          set({ isApplying: false, error: null });
          return true;
        } catch (error: any) {
          const message = getApiErrorMessage(error, 'Could not submit your application. Please try again.');
          console.warn('[TaskStore] applyToTask failed:', error?.response?.data ?? error);
          set({ isApplying: false, error: message });
          // Rethrow so the screen can show the real backend message
          // (KYC required, dues unpaid, already applied, task taken, ...).
          throw new Error(message);
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
          const list: any[] = mine?.tasks ?? mine?.data ?? [];
          if (Array.isArray(list)) {
            // Always sync on success — even an empty list means the server
            // says "no posted tasks", so don't keep stale local entries.
            set({ myTasks: list.map(normalizeTask) });
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

      refreshApplications: async (taskId) => {
        // Poster-only endpoint: GET /tasks/:id/applications returns each
        // application enriched with the applicant's public profile.
        set({ isLoading: true, error: null });
        try {
          const data = await apiGet<any>(ENDPOINTS.tasks.applications(taskId));
          const raw: any[] = data?.applications ?? data?.data ?? [];
          const applications: TaskApplication[] = raw.map((a: any) => ({
            id: a.id,
            taskId: a.taskId ?? taskId,
            applicantId: a.buddyId ?? a.id,
            applicantName: a.buddy?.name ?? 'Buddy',
            applicantAvatar: a.buddy?.avatar ?? undefined,
            applicantRating: a.buddy?.rating ?? 0,
            applicantCompletedTasks: a.buddy?.completedTasks ?? 0,
            applicantDistance: a.buddy?.distance, // present only if backend provides it
            message: a.message ?? '',
            proposedBudget: a.proposedAmount,
            status: (a.status ?? 'pending') as TaskApplication['status'],
            createdAt: a.createdAt ?? '',
          }));
          set({ applications, isLoading: false });
        } catch (error: any) {
          const message = getApiErrorMessage(error, 'Could not load applications.');
          console.warn('[TaskStore] refreshApplications failed:', error?.response?.data ?? error);
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      acceptApplication: async (taskId, applicationId) => {
        // Decide endpoint: accept also assigns the task + creates the chat
        // server-side. Optimistic update, rolled back on failure.
        const prev = get().applications;
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === applicationId ? { ...a, status: 'accepted' } : a
          ),
        }));
        try {
          await apiPost<any>(ENDPOINTS.tasks.decideApplication(taskId, applicationId), { action: 'accept' });
          // Realtime task listener re-syncs status → 'assigned'.
          return true;
        } catch (error: any) {
          set({ applications: prev });
          const message = getApiErrorMessage(error, 'Could not accept this application.');
          console.warn('[TaskStore] acceptApplication failed:', error?.response?.data ?? error);
          throw new Error(message);
        }
      },

      rejectApplication: async (taskId, applicationId) => {
        const prev = get().applications;
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === applicationId ? { ...a, status: 'rejected' } : a
          ),
        }));
        try {
          await apiPost<any>(ENDPOINTS.tasks.decideApplication(taskId, applicationId), { action: 'reject' });
          return true;
        } catch (error: any) {
          set({ applications: prev });
          const message = getApiErrorMessage(error, 'Could not reject this application.');
          console.warn('[TaskStore] rejectApplication failed:', error?.response?.data ?? error);
          throw new Error(message);
        }
      },

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
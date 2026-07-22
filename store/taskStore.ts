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
  error: string | null;
  
  // Real-time subscriptions
  isSubscribed: boolean;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  setMyTasks: (tasks: Task[]) => void;
  setAssignedTasks: (tasks: Task[]) => void;
  setNearbyTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
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
      error: null,
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
      
      updateTask: (updatedTask) => set((state) => ({
        tasks: state.tasks.map((t) => t.id === updatedTask.id ? updatedTask : t),
        myTasks: state.myTasks.map((t) => t.id === updatedTask.id ? updatedTask : t),
        assignedTasks: state.assignedTasks.map((t) => t.id === updatedTask.id ? updatedTask : t),
        nearbyTasks: state.nearbyTasks.map((t) => t.id === updatedTask.id ? updatedTask : t),
        currentTask: state.currentTask?.id === updatedTask.id ? updatedTask : state.currentTask,
      })),
      
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
      
      // Real-time handlers
      handleTaskCreated: (task) => {
        const state = get();
        // Add to appropriate lists based on current user
        set((s) => ({
          tasks: [task, ...s.tasks],
          myTasks: task.customer.id === state.currentTask?.customer.id ? [task, ...s.myTasks] : s.myTasks,
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
          let aVal: any = a[sortOptions.field];
          let bVal: any = b[sortOptions.field];
          
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
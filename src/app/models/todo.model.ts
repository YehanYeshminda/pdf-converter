export interface Todo {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: Date;
    dueDate?: Date;
    priority: TodoPriority;
    notificationSent?: boolean;
}

export enum TodoPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent'
}

export interface CreateTodoRequest {
    title: string;
    description?: string;
    dueDate?: Date;
    priority: TodoPriority;
}

export interface UpdateTodoRequest {
    id: string;
    title?: string;
    description?: string;
    completed?: boolean;
    dueDate?: Date;
    priority?: TodoPriority;
    notificationSent?: boolean;
}

export interface TodoFilter {
    showCompleted: boolean;
    priority?: TodoPriority;
    search?: string;
}

export interface TodoStats {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    dueToday: number;
}
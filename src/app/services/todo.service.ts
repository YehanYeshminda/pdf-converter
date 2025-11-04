import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilter, TodoStats, TodoPriority } from '../models/todo.model';

@Injectable({
    providedIn: 'root'
})
export class TodoService {
    private readonly STORAGE_KEY = 'yydev-todos';
    private todosSubject = new BehaviorSubject<Todo[]>([]);

    todos$ = this.todosSubject.asObservable();

    constructor() {
        this.loadTodosFromStorage();
    }

    private loadTodosFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const todos = JSON.parse(stored).map((todo: any) => ({
                    ...todo,
                    createdAt: new Date(todo.createdAt),
                    dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined
                }));
                this.todosSubject.next(todos);
            }
        } catch (error) {
            console.error('Error loading todos from localStorage:', error);
        }
    }

    private saveTodosToStorage(todos: Todo[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos));
        } catch (error) {
            console.error('Error saving todos to localStorage:', error);
        }
    }

    private updateTodos(todos: Todo[]): void {
        this.todosSubject.next(todos);
        this.saveTodosToStorage(todos);
    }

    createTodo(request: CreateTodoRequest): string {
        const newTodo: Todo = {
            id: this.generateId(),
            title: request.title.trim(),
            description: request.description?.trim(),
            completed: false,
            createdAt: new Date(),
            dueDate: request.dueDate,
            priority: request.priority,
            notificationSent: false
        };

        const currentTodos = this.todosSubject.value;
        this.updateTodos([...currentTodos, newTodo]);

        return newTodo.id;
    }

    updateTodo(request: UpdateTodoRequest): boolean {
        const currentTodos = this.todosSubject.value;
        const todoIndex = currentTodos.findIndex(todo => todo.id === request.id);

        if (todoIndex === -1) {
            return false;
        }

        const updatedTodos = [...currentTodos];
        updatedTodos[todoIndex] = {
            ...updatedTodos[todoIndex],
            ...request,
            title: request.title?.trim() || updatedTodos[todoIndex].title,
            description: request.description?.trim() || updatedTodos[todoIndex].description
        };

        this.updateTodos(updatedTodos);
        return true;
    }

    deleteTodo(id: string): boolean {
        const currentTodos = this.todosSubject.value;
        const filteredTodos = currentTodos.filter(todo => todo.id !== id);

        if (filteredTodos.length === currentTodos.length) {
            return false; // Todo not found
        }

        this.updateTodos(filteredTodos);
        return true;
    }

    toggleTodoCompletion(id: string): boolean {
        return this.updateTodo({ id, completed: !this.getTodoById(id)?.completed });
    }

    getTodoById(id: string): Todo | undefined {
        return this.todosSubject.value.find(todo => todo.id === id);
    }

    getFilteredTodos(filter: TodoFilter): Observable<Todo[]> {
        return this.todos$.pipe(
            map(todos => this.filterTodos(todos, filter))
        );
    }

    private filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
        return todos.filter(todo => {
            // Filter by completion status
            if (!filter.showCompleted && todo.completed) {
                return false;
            }

            // Filter by priority
            if (filter.priority && todo.priority !== filter.priority) {
                return false;
            }

            // Filter by search term
            if (filter.search) {
                const searchTerm = filter.search.toLowerCase();
                const matchesTitle = todo.title.toLowerCase().includes(searchTerm);
                const matchesDescription = todo.description?.toLowerCase().includes(searchTerm);

                if (!matchesTitle && !matchesDescription) {
                    return false;
                }
            }

            return true;
        });
    }

    getTodoStats(): Observable<TodoStats> {
        return this.todos$.pipe(
            map(todos => {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const completed = todos.filter(todo => todo.completed).length;
                const pending = todos.filter(todo => !todo.completed).length;

                const overdue = todos.filter(todo =>
                    !todo.completed &&
                    todo.dueDate &&
                    todo.dueDate < today
                ).length;

                const dueToday = todos.filter(todo =>
                    !todo.completed &&
                    todo.dueDate &&
                    todo.dueDate >= today &&
                    todo.dueDate < tomorrow
                ).length;

                return {
                    total: todos.length,
                    completed,
                    pending,
                    overdue,
                    dueToday
                };
            })
        );
    }

    getDueTodos(): Observable<Todo[]> {
        return this.todos$.pipe(
            map(todos => {
                const now = new Date();
                return todos.filter(todo =>
                    !todo.completed &&
                    todo.dueDate &&
                    todo.dueDate <= now &&
                    !todo.notificationSent
                );
            })
        );
    }

    markNotificationSent(id: string): void {
        this.updateTodo({ id, notificationSent: true });
    }

    clearCompletedTodos(): number {
        const currentTodos = this.todosSubject.value;
        const activeTodos = currentTodos.filter(todo => !todo.completed);
        const clearedCount = currentTodos.length - activeTodos.length;

        this.updateTodos(activeTodos);
        return clearedCount;
    }

    exportTodos(): string {
        return JSON.stringify(this.todosSubject.value, null, 2);
    }

    importTodos(todosJson: string): boolean {
        try {
            const importedTodos = JSON.parse(todosJson);

            if (!Array.isArray(importedTodos)) {
                return false;
            }

            // Validate and transform imported todos
            const validTodos: Todo[] = importedTodos
                .filter(this.isValidTodo)
                .map(todo => ({
                    ...todo,
                    id: this.generateId(), // Generate new IDs to avoid conflicts
                    createdAt: new Date(todo.createdAt || new Date()),
                    dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
                    notificationSent: false
                }));

            const currentTodos = this.todosSubject.value;
            this.updateTodos([...currentTodos, ...validTodos]);

            return true;
        } catch (error) {
            console.error('Error importing todos:', error);
            return false;
        }
    }

    private isValidTodo(todo: any): boolean {
        return todo &&
            typeof todo.title === 'string' &&
            typeof todo.completed === 'boolean' &&
            Object.values(TodoPriority).includes(todo.priority);
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
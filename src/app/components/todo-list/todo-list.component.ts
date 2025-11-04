import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Todo, TodoPriority, TodoFilter, TodoStats, CreateTodoRequest } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-todo-list',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule,
        MatMenuModule,
        MatTooltipModule,
        MatProgressBarModule,
        MatSnackBarModule,
        MatDialogModule
    ],
    templateUrl: './todo-list.component.html',
    styleUrls: ['./todo-list.component.scss']
})
export class TodoListComponent implements OnInit, OnDestroy {
    todos$: Observable<Todo[]>;
    stats$: Observable<TodoStats>;

    private destroy$ = new Subject<void>();

    // Form for creating new todos
    todoForm = new FormGroup({
        title: new FormControl('', [Validators.required, Validators.minLength(2)]),
        description: new FormControl(''),
        dueDate: new FormControl(),
        priority: new FormControl(TodoPriority.MEDIUM, [Validators.required])
    });

    // Filter form
    filterForm = new FormGroup({
        search: new FormControl(''),
        showCompleted: new FormControl(false),
        priority: new FormControl()
    });

    // Current filter
    currentFilter: TodoFilter = {
        showCompleted: false
    };

    // Priority options
    priorities = [
        { value: TodoPriority.LOW, label: 'Low', color: 'primary' },
        { value: TodoPriority.MEDIUM, label: 'Medium', color: 'accent' },
        { value: TodoPriority.HIGH, label: 'High', color: 'warn' },
        { value: TodoPriority.URGENT, label: 'Urgent', color: 'warn' }
    ];

    // Quick time options
    quickTimeOptions = [
        { label: 'In 5 minutes', minutes: 5, icon: 'schedule' },
        { label: 'In 15 minutes', minutes: 15, icon: 'schedule' },
        { label: 'In 30 minutes', minutes: 30, icon: 'schedule' },
        { label: 'In 1 hour', minutes: 60, icon: 'access_time' },
        { label: 'In 2 hours', minutes: 120, icon: 'access_time' },
        { label: 'In 4 hours', minutes: 240, icon: 'access_time' },
        { label: 'Tomorrow 9 AM', minutes: 'tomorrow_9am', icon: 'today' },
        { label: 'End of day', minutes: 'end_of_day', icon: 'today' },
        { label: 'Next week', minutes: 'next_week', icon: 'date_range' }
    ];    // UI state
    isCreating = false;
    notificationPermissionGranted = false;

    constructor(
        private todoService: TodoService,
        public notificationService: NotificationService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.todos$ = this.todoService.getFilteredTodos(this.currentFilter);
        this.stats$ = this.todoService.getTodoStats();
    }

    ngOnInit(): void {
        this.setupFilterWatching();
        this.checkNotificationPermission();
        this.notificationService.scheduleAllPendingNotifications();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupFilterWatching(): void {
        this.filterForm.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(filterValues => {
                this.currentFilter = {
                    showCompleted: filterValues.showCompleted || false,
                    priority: filterValues.priority || undefined,
                    search: filterValues.search || undefined
                };
                this.todos$ = this.todoService.getFilteredTodos(this.currentFilter);
            });
    }

    private checkNotificationPermission(): void {
        this.notificationService.permission$
            .pipe(takeUntil(this.destroy$))
            .subscribe(permission => {
                this.notificationPermissionGranted = permission.granted;
            });
    }

    async requestNotificationPermission(): Promise<void> {
        const granted = await this.notificationService.requestPermission();
        if (granted) {
            this.snackBar.open('Notification permission granted!', 'Close', { duration: 3000 });
            this.notificationService.scheduleAllPendingNotifications();
        } else {
            this.snackBar.open('Notification permission denied', 'Close', { duration: 3000 });
        }
    }

    testNotification(): void {
        this.notificationService.sendTestNotification();
        this.snackBar.open('Test notification sent!', 'Close', { duration: 2000 });
    }

    onCreateTodo(): void {
        if (this.todoForm.invalid) {
            this.markFormGroupTouched(this.todoForm);
            return;
        }

        this.isCreating = true;

        const formValue = this.todoForm.value;
        const createRequest: CreateTodoRequest = {
            title: formValue.title!,
            description: formValue.description || undefined,
            dueDate: formValue.dueDate || undefined,
            priority: formValue.priority!
        };

        try {
            const todoId = this.todoService.createTodo(createRequest);

            // Schedule notification if due date is set
            if (createRequest.dueDate) {
                const newTodo = this.todoService.getTodoById(todoId);
                if (newTodo) {
                    this.notificationService.scheduleNotification(newTodo);
                }
            }

            this.todoForm.reset({
                priority: TodoPriority.MEDIUM
            });

            this.snackBar.open('Todo created successfully!', 'Close', { duration: 2000 });
        } catch (error) {
            this.snackBar.open('Error creating todo', 'Close', { duration: 3000 });
        } finally {
            this.isCreating = false;
        }
    }

    onToggleTodo(todo: Todo): void {
        this.todoService.toggleTodoCompletion(todo.id);

        if (todo.completed) {
            // Cancel notification if todo is marked as completed
            this.notificationService.cancelScheduledNotification(todo.id);
        } else {
            // Reschedule notification if todo is unmarked and has due date
            if (todo.dueDate) {
                this.notificationService.scheduleNotification(todo);
            }
        }
    }

    onDeleteTodo(todo: Todo): void {
        this.todoService.deleteTodo(todo.id);
        this.notificationService.cancelScheduledNotification(todo.id);
        this.snackBar.open('Todo deleted', 'Undo', { duration: 3000 });
    }

    onClearCompleted(): void {
        const clearedCount = this.todoService.clearCompletedTodos();
        if (clearedCount > 0) {
            this.snackBar.open(`${clearedCount} completed todos cleared`, 'Close', { duration: 2000 });
        } else {
            this.snackBar.open('No completed todos to clear', 'Close', { duration: 2000 });
        }
    }

    onQuickTimeSelect(option: any): void {
        const now = new Date();
        let dueDate: Date;

        if (typeof option.minutes === 'number') {
            // Add minutes to current time
            dueDate = new Date(now.getTime() + option.minutes * 60000);
        } else {
            // Handle special cases
            switch (option.minutes) {
                case 'tomorrow_9am':
                    dueDate = new Date(now);
                    dueDate.setDate(dueDate.getDate() + 1);
                    dueDate.setHours(9, 0, 0, 0);
                    break;
                case 'end_of_day':
                    dueDate = new Date(now);
                    dueDate.setHours(17, 0, 0, 0); // 5 PM
                    break;
                case 'next_week':
                    dueDate = new Date(now);
                    dueDate.setDate(dueDate.getDate() + 7);
                    dueDate.setHours(9, 0, 0, 0);
                    break;
                default:
                    dueDate = now;
            }
        }

        this.todoForm.patchValue({
            dueDate: dueDate
        });

        this.snackBar.open(`Due date set to ${this.formatDateTime(dueDate)}`, 'Close', { duration: 2000 });
    }

    formatDateTime(date: Date): string {
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } getPriorityIcon(priority: TodoPriority): string {
        switch (priority) {
            case TodoPriority.LOW: return 'low_priority';
            case TodoPriority.MEDIUM: return 'drag_indicator';
            case TodoPriority.HIGH: return 'priority_high';
            case TodoPriority.URGENT: return 'error';
            default: return 'drag_indicator';
        }
    }

    getPriorityColor(priority: TodoPriority): string {
        switch (priority) {
            case TodoPriority.LOW: return 'primary';
            case TodoPriority.MEDIUM: return 'accent';
            case TodoPriority.HIGH: return 'warn';
            case TodoPriority.URGENT: return 'warn';
            default: return 'primary';
        }
    }

    formatDueDate(date: Date): string {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (dueDate.getTime() === today.getTime()) {
            return 'Today';
        } else if (dueDate.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else if (dueDate < today) {
            return 'Overdue';
        } else {
            return date.toLocaleDateString();
        }
    }

    isDueToday(date: Date): boolean {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return dueDate.getTime() === today.getTime();
    }

    isOverdue(date: Date): boolean {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return dueDate < today;
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    trackByTodoId(index: number, todo: Todo): string {
        return todo.id;
    }
}
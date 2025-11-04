import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { Todo } from '../models/todo.model';
import { TodoService } from './todo.service';

export interface NotificationPermission {
    granted: boolean;
    denied: boolean;
    default: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private permissionSubject = new BehaviorSubject<NotificationPermission>(this.getPermissionStatus());
    private notificationTimers = new Map<string, number>();

    permission$ = this.permissionSubject.asObservable();

    constructor(private todoService: TodoService) {
        this.initializeNotificationChecking();
    }

    private getPermissionStatus(): NotificationPermission {
        if (!('Notification' in window)) {
            return { granted: false, denied: true, default: false };
        }

        const permission = Notification.permission;
        return {
            granted: permission === 'granted',
            denied: permission === 'denied',
            default: permission === 'default'
        };
    }

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            const newPermissionStatus = this.getPermissionStatus();
            this.permissionSubject.next(newPermissionStatus);

            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    private initializeNotificationChecking(): void {
        // Check for due todos every minute
        interval(60000).pipe(
            filter(() => this.getPermissionStatus().granted),
            switchMap(() => this.todoService.getDueTodos())
        ).subscribe(dueTodos => {
            dueTodos.forEach(todo => this.sendTodoNotification(todo));
        });
    }

    private sendTodoNotification(todo: Todo): void {
        if (!this.getPermissionStatus().granted) {
            return;
        }

        try {
            const notification = new Notification(`Todo Due: ${todo.title}`, {
                body: todo.description || 'A todo item is now due',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `todo-${todo.id}`,
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                // Navigate to todo list
                window.location.hash = '/todo-list';
                notification.close();
            };

            // Auto-close notification after 10 seconds
            setTimeout(() => {
                notification.close();
            }, 10000);

            // Mark notification as sent
            this.todoService.markNotificationSent(todo.id);

        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    scheduleNotification(todo: Todo): void {
        if (!todo.dueDate || todo.completed) {
            return;
        }

        const now = new Date().getTime();
        const dueTime = todo.dueDate.getTime();
        const timeUntilDue = dueTime - now;

        // If already due, send notification immediately
        if (timeUntilDue <= 0) {
            this.sendTodoNotification(todo);
            return;
        }

        // Schedule notification for due time
        const timerId = window.setTimeout(() => {
            this.sendTodoNotification(todo);
            this.notificationTimers.delete(todo.id);
        }, timeUntilDue);

        // Clear existing timer if any
        this.cancelScheduledNotification(todo.id);
        this.notificationTimers.set(todo.id, timerId);
    }

    cancelScheduledNotification(todoId: string): void {
        const timerId = this.notificationTimers.get(todoId);
        if (timerId) {
            clearTimeout(timerId);
            this.notificationTimers.delete(todoId);
        }
    }

    sendTestNotification(): void {
        if (!this.getPermissionStatus().granted) {
            console.warn('Notification permission not granted');
            return;
        }

        try {
            const notification = new Notification('Test Notification', {
                body: 'This is a test notification from ToolVerse Todo',
                icon: '/favicon.ico',
                tag: 'test-notification'
            });

            setTimeout(() => {
                notification.close();
            }, 5000);

        } catch (error) {
            console.error('Error sending test notification:', error);
        }
    }

    isSupported(): boolean {
        return 'Notification' in window;
    }

    getPermissionStatusSync(): NotificationPermission {
        return this.getPermissionStatus();
    }

    // Schedule notifications for all pending todos
    scheduleAllPendingNotifications(): void {
        this.todoService.todos$.subscribe(todos => {
            todos
                .filter(todo => !todo.completed && todo.dueDate && !todo.notificationSent)
                .forEach(todo => this.scheduleNotification(todo));
        });
    }

    // Clear all scheduled notifications
    clearAllScheduledNotifications(): void {
        this.notificationTimers.forEach((timerId) => {
            clearTimeout(timerId);
        });
        this.notificationTimers.clear();
    }
}
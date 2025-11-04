import { Component } from '@angular/core';
import { TodoListComponent } from '../../components/todo-list/todo-list.component';

@Component({
    selector: 'app-todo-page',
    imports: [TodoListComponent],
    template: '<app-todo-list></app-todo-list>',
    standalone: true
})
export class TodoPage { }
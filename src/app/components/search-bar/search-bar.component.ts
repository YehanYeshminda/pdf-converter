import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

export interface SearchResult {
    title: string;
    description: string;
    route: string;
    icon: string;
    category: string;
}

@Component({
    selector: 'app-search-bar',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatListModule,
        MatCardModule,
        MatInputModule
    ],
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit, OnDestroy {
    @Input() placeholder: string = 'Search tools...';
    @Output() toolSelected = new EventEmitter<void>();

    searchControl = new FormControl('');
    searchResults: SearchResult[] = [];
    showResults = false;
    private destroy$ = new Subject<void>();

    private readonly allTools: SearchResult[] = [
        {
            title: 'PDF Converter',
            description: 'Convert PDF files to images (JPG, PNG)',
            route: '/pdf-converter',
            icon: 'picture_as_pdf',
            category: 'Converters'
        },
        {
            title: 'Text Encoder',
            description: 'Encode and decode text using various methods',
            route: '/text-encoder-decoder',
            icon: 'text_fields',
            category: 'Converters'
        },
        {
            title: 'JSON to Code',
            description: 'Convert JSON to TypeScript, C#, Python and more',
            route: '/json-to-typescript',
            icon: 'data_object',
            category: 'Converters'
        },
        {
            title: 'JWT Decoder',
            description: 'Decode and debug JSON Web Tokens',
            route: '/jwt-decoder',
            icon: 'key',
            category: 'Converters'
        },
        {
            title: 'RegEx Tester',
            description: 'Test regular expressions in real-time',
            route: '/regex-tester',
            icon: 'search',
            category: 'Converters'
        },
        {
            title: 'Timestamp Converter',
            description: 'Convert Unix timestamps to dates and vice versa',
            route: '/timestamp-converter',
            icon: 'schedule',
            category: 'Converters'
        },
        // {
        //     title: 'Todo List',
        //     description: 'Create, track, and manage your tasks with due dates and notifications',
        //     route: '/todo-list',
        //     icon: 'task_alt',
        //     category: 'Productivity'
        // },
        {
            title: 'PDF Editor',
            description: 'Draw, annotate & erase PDF content',
            route: '/pdf-editor',
            icon: 'edit',
            category: 'PDF Tools'
        },
        {
            title: 'PDF Splitter',
            description: 'Split PDF into multiple files',
            route: '/pdf-splitter',
            icon: 'content_cut',
            category: 'PDF Tools'
        },
        {
            title: 'PDF Signature',
            description: 'Add electronic signatures to PDF documents',
            route: '/pdf-signature',
            icon: 'draw',
            category: 'PDF Tools'
        }
    ];

    constructor(
        private router: Router,
        private dialogRef: MatDialogRef<SearchBarComponent>
    ) { }

    ngOnInit(): void {
        this.searchControl.valueChanges
            .pipe(
                debounceTime(200),
                distinctUntilChanged(),
                takeUntil(this.destroy$)
            )
            .subscribe(query => {
                this.performSearch(query || '');
            });

        // Show all tools initially
        this.searchResults = this.allTools;
        this.showResults = true;

        // Auto-focus the search input
        setTimeout(() => {
            const input = document.querySelector('.search-dialog-input') as HTMLInputElement;
            if (input) {
                input.focus();
            }
        }, 100);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private performSearch(query: string): void {
        if (!query.trim()) {
            this.searchResults = this.allTools; // Show all tools when no query
            this.showResults = true;
            return;
        }

        const normalizedQuery = query.toLowerCase().trim();
        this.searchResults = this.allTools.filter(tool =>
            tool.title.toLowerCase().includes(normalizedQuery) ||
            tool.description.toLowerCase().includes(normalizedQuery) ||
            tool.category.toLowerCase().includes(normalizedQuery)
        );

        this.showResults = true;
    }

    onResultClick(result: SearchResult): void {
        this.router.navigate([result.route]);
        this.toolSelected.emit();
        this.dialogRef.close();
    }

    closeDialog(): void {
        this.dialogRef.close();
    }

    clearSearch(): void {
        this.searchControl.setValue('');
        this.searchResults = [];
        this.showResults = false;
    }

    onInputFocus(): void {
        if (this.searchControl.value && this.searchResults.length > 0) {
            this.showResults = true;
        }
    }

    onInputBlur(): void {
        // Delay hiding results to allow click events on results
        setTimeout(() => {
            this.showResults = false;
        }, 200);
    }

    trackByRoute(index: number, item: SearchResult): string {
        return item.route;
    }
}
import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

interface SplitResult {
    id: number;
    name: string;
    pages: number[];
    blob: Blob;
    previewUrl: string;
}

@Component({
    selector: 'app-pdf-splitter-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatRadioModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressBarModule,
        MatChipsModule,
        MatCheckboxModule,
        MatSnackBarModule,
        MatTooltipModule
    ],
    templateUrl: './pdf-splitter-page.html',
    styleUrl: './pdf-splitter-page.scss'
})
export class PdfSplitterPage {
    @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

    // PDF file state
    pdfFile: File | null = null;
    pdfDoc: any = null;
    fileName = '';
    totalPages = 0;
    isDragging = false;

    // Split options
    splitMode: 'each-page' | 'by-range' | 'custom-selection' = 'each-page';
    rangeInput = '';
    selectedPages: Set<number> = new Set();
    pageThumbnails: { pageNumber: number; imageUrl: string; selected: boolean }[] = [];

    // Processing state
    isProcessing = false;
    processingProgress = 0;

    // Results
    splitResults: SplitResult[] = [];

    constructor(private snackBar: MatSnackBar) { }

    openFileDialog(): void {
        this.fileInput.nativeElement.click();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.handleFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                this.handleFile(file);
            } else {
                this.showMessage('❌ Please upload a PDF file', 'error');
            }
        }
    }

    async handleFile(file: File): Promise<void> {
        this.pdfFile = file;
        this.fileName = file.name;
        this.splitResults = [];

        try {
            await this.loadPDF();
            this.showMessage('✅ PDF loaded successfully!', 'success');
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showMessage('❌ Failed to load PDF', 'error');
        }
    }

    async loadPDF(): Promise<void> {
        if (!this.pdfFile) return;

        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
            this.showMessage('❌ PDF.js library not loaded', 'error');
            return;
        }

        const arrayBuffer = await this.pdfFile.arrayBuffer();
        this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        this.totalPages = this.pdfDoc.numPages;

        // Generate thumbnails for custom selection mode
        if (this.splitMode === 'custom-selection') {
            await this.generateThumbnails();
        }
    }

    async generateThumbnails(): Promise<void> {
        this.pageThumbnails = [];

        for (let i = 1; i <= this.totalPages; i++) {
            const page = await this.pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 0.3 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d')!;

            await page.render({ canvasContext: ctx, viewport }).promise;

            this.pageThumbnails.push({
                pageNumber: i,
                imageUrl: canvas.toDataURL(),
                selected: false
            });
        }
    }

    async onSplitModeChange(): Promise<void> {
        this.splitResults = [];
        this.selectedPages.clear();
        this.rangeInput = '';

        if (this.splitMode === 'custom-selection' && this.pdfDoc && this.pageThumbnails.length === 0) {
            await this.generateThumbnails();
        }

        if (this.splitMode !== 'custom-selection') {
            this.pageThumbnails.forEach(t => t.selected = false);
        }
    }

    togglePageSelection(pageNumber: number): void {
        const thumbnail = this.pageThumbnails.find(t => t.pageNumber === pageNumber);
        if (thumbnail) {
            thumbnail.selected = !thumbnail.selected;
            if (thumbnail.selected) {
                this.selectedPages.add(pageNumber);
            } else {
                this.selectedPages.delete(pageNumber);
            }
        }
    }

    async splitPDF(): Promise<void> {
        if (!this.pdfDoc) {
            this.showMessage('❌ Please upload a PDF first', 'error');
            return;
        }

        this.isProcessing = true;
        this.processingProgress = 0;
        this.splitResults = [];

        try {
            let pageGroups: number[][] = [];
            let allSelectedPages: Set<number> = new Set();

            switch (this.splitMode) {
                case 'each-page':
                    pageGroups = Array.from({ length: this.totalPages }, (_, i) => [i + 1]);
                    for (let i = 1; i <= this.totalPages; i++) {
                        allSelectedPages.add(i);
                    }
                    break;

                case 'by-range':
                    pageGroups = this.parseRanges();
                    if (pageGroups.length === 0) {
                        this.showMessage('❌ Invalid page range format', 'error');
                        this.isProcessing = false;
                        return;
                    }
                    pageGroups.forEach(group => group.forEach(page => allSelectedPages.add(page)));
                    break;

                case 'custom-selection':
                    if (this.selectedPages.size === 0) {
                        this.showMessage('❌ Please select at least one page', 'error');
                        this.isProcessing = false;
                        return;
                    }
                    pageGroups = [Array.from(this.selectedPages).sort((a, b) => a - b)];
                    this.selectedPages.forEach(page => allSelectedPages.add(page));
                    break;
            }

            for (let i = 0; i < pageGroups.length; i++) {
                const pages = pageGroups[i];
                const blob = await this.createPDFFromPages(pages);
                const previewUrl = await this.createPreviewImage(pages[0]);

                this.splitResults.push({
                    id: i + 1,
                    name: `${this.fileName.replace('.pdf', '')}_part_${i + 1}.pdf`,
                    pages: pages,
                    blob: blob,
                    previewUrl: previewUrl
                });

                this.processingProgress = ((i + 1) / (pageGroups.length + 1)) * 100;
            }

            const remainingPages: number[] = [];
            for (let i = 1; i <= this.totalPages; i++) {
                if (!allSelectedPages.has(i)) {
                    remainingPages.push(i);
                }
            }

            if (remainingPages.length > 0 && this.splitMode !== 'each-page') {
                const blob = await this.createPDFFromPages(remainingPages);
                const previewUrl = await this.createPreviewImage(remainingPages[0]);

                this.splitResults.push({
                    id: this.splitResults.length + 1,
                    name: `${this.fileName.replace('.pdf', '')}_remaining_pages.pdf`,
                    pages: remainingPages,
                    blob: blob,
                    previewUrl: previewUrl
                });

                this.processingProgress = 100;
            }

            this.showMessage(`✅ Successfully split into ${this.splitResults.length} files!`, 'success');
        } catch (error) {
            console.error('Error splitting PDF:', error);
            this.showMessage('❌ Failed to split PDF', 'error');
        } finally {
            this.isProcessing = false;
        }
    }

    parseRanges(): number[][] {
        try {
            const ranges = this.rangeInput.split(',').map(r => r.trim());
            const groups: number[][] = [];

            for (const range of ranges) {
                if (range.includes('-')) {
                    const [start, end] = range.split('-').map(n => parseInt(n.trim()));
                    if (start > 0 && end <= this.totalPages && start <= end) {
                        const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                        groups.push(pages);
                    } else {
                        return [];
                    }
                } else {
                    const page = parseInt(range);
                    if (page > 0 && page <= this.totalPages) {
                        groups.push([page]);
                    } else {
                        return [];
                    }
                }
            }

            return groups;
        } catch (error) {
            return [];
        }
    }

    async createPDFFromPages(pages: number[]): Promise<Blob> {
        const { jsPDF } = (window as any).jspdf;
        let pdf: any = null;

        for (let i = 0; i < pages.length; i++) {
            const pageNum = pages[i];
            const page = await this.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d')!;

            await page.render({ canvasContext: ctx, viewport }).promise;

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const aspectRatio = viewport.width / viewport.height;
            let pdfWidth = 210;
            let pdfHeight = pdfWidth / aspectRatio;

            if (pdfHeight > 297) {
                pdfHeight = 297;
                pdfWidth = pdfHeight * aspectRatio;
            }

            if (!pdf) {
                pdf = new jsPDF({
                    orientation: viewport.width > viewport.height ? 'landscape' : 'portrait',
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight]
                });
            } else {
                pdf.addPage([pdfWidth, pdfHeight], viewport.width > viewport.height ? 'landscape' : 'portrait');
            }

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }

        return pdf.output('blob');
    }

    async createPreviewImage(pageNumber: number): Promise<string> {
        const page = await this.pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, viewport }).promise;
        return canvas.toDataURL();
    }

    downloadFile(result: SplitResult): void {
        const url = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.name;
        link.click();
        URL.revokeObjectURL(url);
        this.showMessage(`✅ Downloaded ${result.name}`, 'success');
    }

    previewFile(result: SplitResult): void {
        const url = URL.createObjectURL(result.blob);
        window.open(url, '_blank');
    }

    async downloadAllAsZip(): Promise<void> {
        this.showMessage('📦 Preparing ZIP file...', 'info');
        for (const result of this.splitResults) {
            this.downloadFile(result);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        this.showMessage('✅ All files downloaded!', 'success');
    }

    reset(): void {
        this.pdfFile = null;
        this.pdfDoc = null;
        this.fileName = '';
        this.totalPages = 0;
        this.splitResults = [];
        this.pageThumbnails = [];
        this.selectedPages.clear();
        this.rangeInput = '';
        this.splitMode = 'each-page';
    }

    private showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
        const panelClasses = ['custom-snackbar'];

        switch (type) {
            case 'success':
                panelClasses.push('snackbar-success');
                break;
            case 'error':
                panelClasses.push('snackbar-error');
                break;
            case 'warning':
                panelClasses.push('snackbar-warning');
                break;
            case 'info':
                panelClasses.push('snackbar-info');
                break;
        }

        this.snackBar.open(message, 'Close', {
            duration: type === 'error' ? 5000 : 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: panelClasses
        });
    }
}

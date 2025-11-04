import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'app-pdf-editor-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatTooltipModule,
        MatSliderModule,
        MatSelectModule,
        MatFormFieldModule,
        MatButtonToggleModule,
        MatChipsModule,
        MatSnackBarModule
    ],
    templateUrl: './pdf-editor-page.html',
    styleUrl: './pdf-editor-page.scss'
})
export class PdfEditorPage implements AfterViewInit {
    @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private isDrawing = false;
    private lastX = 0;
    private lastY = 0;

    pdfFile: File | null = null;
    pdfPages: HTMLImageElement[] = [];
    currentPage = 0;
    totalPages = 0;
    private pdfDoc: any = null;

    canvasInitialized = false;

    private pageEdits: Map<number, ImageData> = new Map();

    currentTool: 'draw' | 'erase' | 'text' = 'draw';
    brushSize = 3;
    brushColor = '#FF0000';
    eraserSize = 20;

    textColor = '#000000';
    fontSize = 16;
    textInput = '';
    isAddingText = false;
    private textX = 0;
    private textY = 0;

    colors = [
        { name: 'Red', value: '#FF0000' },
        { name: 'Blue', value: '#0000FF' },
        { name: 'Green', value: '#00FF00' },
        { name: 'Yellow', value: '#FFFF00' },
        { name: 'Black', value: '#000000' },
        { name: 'White', value: '#FFFFFF' },
        { name: 'Orange', value: '#FFA500' },
        { name: 'Purple', value: '#800080' }
    ];

    private history: ImageData[] = [];
    private historyStep = -1;
    private maxHistory = 20;

    downloadFormat: 'pdf' | 'png' | 'jpeg' = 'png';

    constructor(private snackBar: MatSnackBar) { }

    ngAfterViewInit(): void {
        this.checkLibraries();
    }

    private initializeCanvas(): void {
        if (!this.canvasRef) {
            console.error('Canvas element not found');
            return;
        }
        this.canvas = this.canvasRef.nativeElement;
        this.ctx = this.canvas.getContext('2d')!;
    }

    private checkLibraries(): void {
        const win = window as any;
        if (!win.jspdf || !win.jspdf.jsPDF) {
            this.showMessage('⚠️ PDF export library not loaded yet. Please wait a moment.', 'warning');
        } else {
            console.log('jsPDF library loaded successfully');
        }
    }

    private setupCanvas(): void {
        this.initializeCanvas();

        this.canvas.width = 800;
        this.canvas.height = 1000;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.canvasInitialized = true;
        this.saveHistory();
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    private handleTouchStart(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    private handleTouchMove(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    private startDrawing(e: MouseEvent): void {
        if (this.currentTool === 'text') {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.textX = (e.clientX - rect.left) * scaleX;
            this.textY = (e.clientY - rect.top) * scaleY;
            this.isAddingText = true;
            this.textInput = '';
            return;
        }

        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.lastX = (e.clientX - rect.left) * scaleX;
        this.lastY = (e.clientY - rect.top) * scaleY;
    }

    private draw(e: MouseEvent): void {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(currentX, currentY);

        if (this.currentTool === 'draw') {
            this.ctx.strokeStyle = this.brushColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        } else if (this.currentTool === 'erase') {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = this.eraserSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        }

        this.ctx.stroke();

        this.lastX = currentX;
        this.lastY = currentY;
    }

    private stopDrawing(): void {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveHistory();
        }
    }

    private saveHistory(): void {
        this.history = this.history.slice(0, this.historyStep + 1);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history.push(imageData);

        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyStep++;
        }
    }

    async onFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.pdfFile = input.files[0];
            await this.loadPDF();
        }
    }

    async loadPDF(): Promise<void> {
        if (!this.pdfFile) return;

        try {
            const pdfjsLib = (window as any).pdfjsLib;
            if (!pdfjsLib) {
                this.showMessage('❌ PDF.js library not loaded. Please refresh the page.', 'error');
                return;
            }

            this.pageEdits.clear();
            this.history = [];
            this.historyStep = -1;

            const arrayBuffer = await this.pdfFile.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;

            if (!this.canvasInitialized) {
                this.canvasInitialized = true;
                await new Promise(resolve => setTimeout(resolve, 0));
                this.initializeCanvas();
                this.setupEventListeners();
            }

            await this.renderPage(this.currentPage);
            this.showMessage(`✅ PDF loaded successfully! ${this.totalPages} page(s) ready to edit.`, 'success');
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showMessage('❌ Failed to load PDF. Please try another file.', 'error');
        }
    }

    async renderPage(pageNumber: number): Promise<void> {
        if (!this.pdfDoc) return;

        try {
            const page = await this.pdfDoc.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.5 });

            this.canvas.width = viewport.width;
            this.canvas.height = viewport.height;

            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            if (this.pageEdits.has(pageNumber)) {
                const savedEdit = this.pageEdits.get(pageNumber)!;
                this.ctx.putImageData(savedEdit, 0, 0);
            }

            this.saveHistory();
        } catch (error) {
            console.error('Error rendering page:', error);
        }
    }

    selectTool(tool: 'draw' | 'erase' | 'text'): void {
        this.currentTool = tool;
    }

    selectColor(color: string): void {
        this.brushColor = color;
        this.textColor = color;
        if (this.currentTool !== 'text') {
            this.currentTool = 'draw';
        }
    }

    addTextToCanvas(): void {
        if (!this.textInput.trim()) {
            this.isAddingText = false;
            return;
        }

        this.ctx.font = `${this.fontSize}px Arial`;
        this.ctx.fillStyle = this.textColor;
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(this.textInput, this.textX, this.textY);

        this.textInput = '';
        this.isAddingText = false;
        this.saveHistory();
        this.showMessage('✅ Text added to canvas!', 'success');
    }

    cancelTextInput(): void {
        this.textInput = '';
        this.isAddingText = false;
    }

    clearCanvas(): void {
        this.canvasInitialized = false;
        this.pdfDoc = null;
        this.pdfFile = null;
        this.totalPages = 0;
        this.currentPage = 0;
        this.pageEdits.clear();
        this.history = [];
        this.historyStep = -1;
        this.currentTool = 'draw';

        this.showMessage('� Reset to initial state. Choose an option to start again.', 'info');
    }

    undo(): void {
        if (this.historyStep > 0) {
            this.historyStep--;
            const imageData = this.history[this.historyStep];
            this.ctx.putImageData(imageData, 0, 0);
        }
    }

    redo(): void {
        if (this.historyStep < this.history.length - 1) {
            this.historyStep++;
            const imageData = this.history[this.historyStep];
            this.ctx.putImageData(imageData, 0, 0);
        }
    }

    canUndo(): boolean {
        return this.historyStep > 0;
    }

    canRedo(): boolean {
        return this.historyStep < this.history.length - 1;
    }

    async previousPage(): Promise<void> {
        if (this.currentPage > 1) {
            this.saveCurrentPageEdit();

            this.currentPage--;
            await this.renderPage(this.currentPage);
        }
    }

    async nextPage(): Promise<void> {
        if (this.currentPage < this.totalPages) {
            this.saveCurrentPageEdit();

            this.currentPage++;
            await this.renderPage(this.currentPage);
        }
    }

    private saveCurrentPageEdit(): void {
        if (this.currentPage > 0) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            this.pageEdits.set(this.currentPage, imageData);
        }
    }

    downloadCanvas(): void {
        if (this.downloadFormat === 'pdf') {
            this.downloadAsPDF();
        } else {
            this.downloadAsImage();
        }
    }

    private downloadAsImage(): void {
        const link = document.createElement('a');
        const format = this.downloadFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
        const extension = this.downloadFormat === 'jpeg' ? 'jpg' : 'png';
        const fileName = this.currentPage > 0
            ? `edited-pdf-page-${this.currentPage}.${extension}`
            : `edited-canvas.${extension}`;

        link.download = fileName;
        link.href = this.canvas.toDataURL(format, 0.95);
        link.click();
        this.showMessage(`✅ Image downloaded as ${extension.toUpperCase()}!`, 'success');
    }

    private downloadAsPDF(): void {
        const win = window as any;

        if (!win.jspdf || !win.jspdf.jsPDF) {
            console.error('jsPDF library not loaded');
            this.showMessage('❌ PDF export not available. Please try downloading as an image.', 'error');
            return;
        }

        try {
            const { jsPDF } = win.jspdf;

            const imgWidth = this.canvas.width;
            const imgHeight = this.canvas.height;

            const aspectRatio = imgWidth / imgHeight;
            let pdfWidth = 210;
            let pdfHeight = pdfWidth / aspectRatio;

            if (pdfHeight > 297) {
                pdfHeight = 297;
                pdfWidth = pdfHeight * aspectRatio;
            }

            const pdf = new jsPDF({
                orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            const imgData = this.canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            const fileName = this.currentPage > 0
                ? `edited-pdf-page-${this.currentPage}.pdf`
                : `edited-canvas.pdf`;
            pdf.save(fileName);
            this.showMessage('✅ PDF downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error creating PDF:', error);
            this.showMessage('❌ Failed to create PDF. Please try downloading as an image.', 'error');
        }
    }

    async downloadAllPages(): Promise<void> {
        if (!this.pdfDoc) {
            this.downloadCanvas();
            return;
        }

        this.saveCurrentPageEdit();

        if (this.downloadFormat === 'pdf') {
            await this.downloadAllPagesAsPDF();
        } else {
            await this.downloadAllPagesAsImages();
        }
    }

    private async downloadAllPagesAsPDF(): Promise<void> {
        const win = window as any;

        if (!win.jspdf || !win.jspdf.jsPDF) {
            this.showMessage('❌ PDF export not available. Please try downloading as images.', 'error');
            return;
        }

        try {
            this.showMessage('📄 Processing all pages...', 'info');
            const { jsPDF } = win.jspdf;
            let pdf: any = null;

            const originalPageNumber = this.currentPage;

            for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
                const page = await this.pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = viewport.width;
                tempCanvas.height = viewport.height;
                const tempCtx = tempCanvas.getContext('2d')!;

                await page.render({
                    canvasContext: tempCtx,
                    viewport: viewport
                }).promise;

                if (this.pageEdits.has(pageNum)) {
                    const savedEdit = this.pageEdits.get(pageNum)!;
                    tempCtx.putImageData(savedEdit, 0, 0);
                }

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

                const imgData = tempCanvas.toDataURL('image/jpeg', 0.95);
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save('edited-pdf-all-pages.pdf');

            await this.renderPage(originalPageNumber);

            this.showMessage(`✅ Successfully exported all ${this.totalPages} pages to PDF!`, 'success');
        } catch (error) {
            console.error('Error creating multi-page PDF:', error);
            this.showMessage('❌ Failed to create multi-page PDF. Please try downloading individually.', 'error');
        }
    }

    private async downloadAllPagesAsImages(): Promise<void> {
        try {
            this.showMessage('🖼️ Downloading all pages...', 'info');
            const originalPageNumber = this.currentPage;
            const extension = this.downloadFormat === 'jpeg' ? 'jpg' : 'png';
            const format = this.downloadFormat === 'jpeg' ? 'image/jpeg' : 'image/png';

            for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
                const page = await this.pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = viewport.width;
                tempCanvas.height = viewport.height;
                const tempCtx = tempCanvas.getContext('2d')!;

                await page.render({
                    canvasContext: tempCtx,
                    viewport: viewport
                }).promise;

                if (this.pageEdits.has(pageNum)) {
                    const savedEdit = this.pageEdits.get(pageNum)!;
                    tempCtx.putImageData(savedEdit, 0, 0);
                }

                const link = document.createElement('a');
                link.download = `edited-pdf-page-${pageNum}.${extension}`;
                link.href = tempCanvas.toDataURL(format, 0.95);
                link.click();

                await new Promise(resolve => setTimeout(resolve, 200));
            }

            await this.renderPage(originalPageNumber);

            this.showMessage(`✅ Downloaded all ${this.totalPages} pages as ${extension.toUpperCase()} images!`, 'success');
        } catch (error) {
            console.error('Error downloading all pages as images:', error);
            this.showMessage('❌ Failed to download all pages. Please try downloading individually.', 'error');
        }
    }

    openFileDialog(): void {
        this.fileInput.nativeElement.click();
    }

    startBlankCanvas(): void {
        this.canvasInitialized = true;
        setTimeout(() => {
            this.setupCanvas();
            this.showMessage('✅ Blank canvas ready! Start drawing.', 'success');
        }, 0);
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

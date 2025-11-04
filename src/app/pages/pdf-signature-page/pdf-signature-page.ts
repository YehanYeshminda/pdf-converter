import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface SignatureMethod {
  type: 'draw' | 'type' | 'upload';
}

interface SignedPage {
  pageNumber: number;
  signatureDataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FontOption {
  name: string;
  value: string;
}

@Component({
  selector: 'app-pdf-signature-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSliderModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './pdf-signature-page.html',
  styleUrl: './pdf-signature-page.scss'
})
export class PdfSignaturePage implements AfterViewInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('signatureCanvas') signatureCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('signatureImageInput') signatureImageInput!: ElementRef<HTMLInputElement>;

  pdfFile: File | null = null;
  pdfDoc: any = null;
  fileName: string = '';
  totalPages: number = 0;
  currentPage: number = 1;
  pdfScale: number = 1.5;
  isDragging: boolean = false;

  signatureMethod: 'draw' | 'type' | 'upload' = 'draw';
  signatureDataUrl: string = '';

  isDrawing: boolean = false;
  hasDrawn: boolean = false;
  signatureCtx: CanvasRenderingContext2D | null = null;
  lastX: number = 0;
  lastY: number = 0;

  typedSignature: string = '';
  selectedFont: string = 'Dancing Script';
  signatureColor: string = '#000000';
  availableFonts: FontOption[] = [
    { name: 'Dancing Script', value: 'Dancing Script' },
    { name: 'Great Vibes', value: 'Great Vibes' },
    { name: 'Pacifico', value: 'Pacifico' },
    { name: 'Satisfy', value: 'Satisfy' },
    { name: 'Allura', value: 'Allura' }
  ];

  uploadedSignatureUrl: string = '';

  signedPages: SignedPage[] = [];
  placingSignature: boolean = false;
  selectedSignature: SignedPage | null = null;
  isDraggingSignature: boolean = false;
  isResizing: boolean = false;
  dragStartX: number = 0;
  dragStartY: number = 0;
  signatureWidth: number = 150;
  signatureHeight: number = 50;

  isProcessing: boolean = false;
  processingProgress: number = 0;
  signedPdfBlob: Blob | null = null;
  signedPdfUrl: string = '';

  history: SignedPage[][] = [];
  historyStep: number = -1;

  constructor(private snackBar: MatSnackBar) { }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    if (this.signedPdfUrl) {
      URL.revokeObjectURL(this.signedPdfUrl);
    }
    if (this.uploadedSignatureUrl) {
      URL.revokeObjectURL(this.uploadedSignatureUrl);
    }
  }

  showMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`]
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.showMessage('Please upload a valid PDF file', 'error');
      return;
    }

    this.pdfFile = file;
    this.fileName = file.name;
    this.loadPDF(file);
  }

  async loadPDF(file: File): Promise<void> {
    try {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        this.showMessage('PDF.js library not loaded. Please refresh the page.', 'error');
        return;
      }

      const arrayBuffer = await file.arrayBuffer();
      this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      this.signedPages = [];
      this.history = [];
      this.historyStep = -1;

      await this.renderPage(this.currentPage);

      if (this.signatureMethod === 'draw') {
        this.setupSignatureCanvas();
      }

      this.showMessage('PDF loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.showMessage('Failed to load PDF', 'error');
    }
  }

  async renderPage(pageNumber: number): Promise<void> {
    if (!this.pdfDoc || !this.pdfCanvas) return;

    try {
      const page = await this.pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: this.pdfScale });

      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      this.renderSignaturesOnPage(pageNumber);
    } catch (error) {
      console.error('Error rendering page:', error);
      this.showMessage('Failed to render page', 'error');
    }
  }

  renderSignaturesOnPage(pageNumber: number): void {
    const signatures = this.signedPages.filter(s => s.pageNumber === pageNumber);
    const canvas = this.pdfCanvas.nativeElement;
    const ctx = canvas.getContext('2d');

    signatures.forEach(sig => {
      const img = new Image();
      img.onload = () => {
        ctx!.drawImage(img, sig.x, sig.y, sig.width, sig.height);
      };
      img.src = sig.signatureDataUrl;
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.renderPage(this.currentPage);
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPage(this.currentPage);
    }
  }

  zoomIn(): void {
    this.pdfScale = Math.min(this.pdfScale + 0.25, 3);
    this.renderPage(this.currentPage);
  }

  zoomOut(): void {
    this.pdfScale = Math.max(this.pdfScale - 0.25, 0.5);
    this.renderPage(this.currentPage);
  }

  setupSignatureCanvas(): void {
    setTimeout(() => {
      if (!this.signatureCanvas) return;

      const canvas = this.signatureCanvas.nativeElement;
      this.signatureCtx = canvas.getContext('2d');

      if (this.signatureCtx) {
        this.signatureCtx.lineWidth = 2;
        this.signatureCtx.lineCap = 'round';
        this.signatureCtx.strokeStyle = '#000000';
      }
    });
  }

  onSignatureMethodChange(): void {
    this.signatureDataUrl = '';
    this.clearSignatureCanvas();

    if (this.signatureMethod === 'draw') {
      this.setupSignatureCanvas();
    }
  }

  startDrawing(event: MouseEvent): void {
    if (!this.signatureCtx) return;

    this.isDrawing = true;
    this.hasDrawn = true;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    this.lastX = event.clientX - rect.left;
    this.lastY = event.clientY - rect.top;
  }

  draw(event: MouseEvent): void {
    if (!this.isDrawing || !this.signatureCtx) return;

    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.signatureCtx.beginPath();
    this.signatureCtx.moveTo(this.lastX, this.lastY);
    this.signatureCtx.lineTo(x, y);
    this.signatureCtx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  stopDrawing(): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveDrawnSignature();
    }
  }

  startDrawingTouch(event: TouchEvent): void {
    event.preventDefault();
    if (!this.signatureCtx || event.touches.length === 0) return;

    this.isDrawing = true;
    this.hasDrawn = true;
    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const touch = event.touches[0];
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
  }

  drawTouch(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing || !this.signatureCtx || event.touches.length === 0) return;

    const rect = this.signatureCanvas.nativeElement.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    this.signatureCtx.beginPath();
    this.signatureCtx.moveTo(this.lastX, this.lastY);
    this.signatureCtx.lineTo(x, y);
    this.signatureCtx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  saveDrawnSignature(): void {
    if (!this.signatureCanvas) return;
    this.signatureDataUrl = this.signatureCanvas.nativeElement.toDataURL('image/png');
  }

  clearSignatureCanvas(): void {
    if (!this.signatureCanvas || !this.signatureCtx) return;

    const canvas = this.signatureCanvas.nativeElement;
    this.signatureCtx.clearRect(0, 0, canvas.width, canvas.height);
    this.signatureDataUrl = '';
    this.hasDrawn = false;
  }

  generateTypedSignature(): void {
    if (!this.typedSignature.trim()) {
      this.showMessage('Please enter your name', 'warning');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `48px "${this.selectedFont}", cursive`;
      ctx.fillStyle = this.signatureColor;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(this.typedSignature, canvas.width / 2, canvas.height / 2);

      this.signatureDataUrl = canvas.toDataURL('image/png');
      this.showMessage('Signature generated', 'success');
    }
  }

  onSignatureImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.showMessage('Please upload a valid image file', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedSignatureUrl = e.target?.result as string;
        this.signatureDataUrl = this.uploadedSignatureUrl;
        this.showMessage('Signature image uploaded', 'success');
      };
      reader.readAsDataURL(file);
    }
  }

  triggerSignatureImageUpload(): void {
    this.signatureImageInput.nativeElement.click();
  }

  onPdfCanvasClick(event: MouseEvent): void {
    if (!this.signatureDataUrl) {
      this.showMessage('Please create a signature first', 'warning');
      return;
    }

    if (!this.placingSignature) {
      this.placingSignature = true;
      this.showMessage('Click on the PDF to place your signature', 'info');
      return;
    }

    const rect = this.pdfCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newSignature: SignedPage = {
      pageNumber: this.currentPage,
      signatureDataUrl: this.signatureDataUrl,
      x: x - this.signatureWidth / 2,
      y: y - this.signatureHeight / 2,
      width: this.signatureWidth,
      height: this.signatureHeight
    };

    this.signedPages.push(newSignature);
    this.addToHistory();
    this.renderPage(this.currentPage);
    this.placingSignature = false;
    this.showMessage('Signature placed successfully', 'success');
  }

  addToHistory(): void {
    this.history = this.history.slice(0, this.historyStep + 1);
    this.history.push([...this.signedPages]);
    this.historyStep++;
  }

  undo(): void {
    if (this.historyStep > 0) {
      this.historyStep--;
      this.signedPages = [...this.history[this.historyStep]];
      this.renderPage(this.currentPage);
      this.showMessage('Undo', 'info');
    }
  }

  redo(): void {
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.signedPages = [...this.history[this.historyStep]];
      this.renderPage(this.currentPage);
      this.showMessage('Redo', 'info');
    }
  }

  removeLastSignature(): void {
    if (this.signedPages.length > 0) {
      this.signedPages.pop();
      this.addToHistory();
      this.renderPage(this.currentPage);
      this.showMessage('Last signature removed', 'info');
    }
  }

  async applySignatureToPDF(): Promise<void> {
    if (!this.pdfDoc || this.signedPages.length === 0) {
      this.showMessage('Please add at least one signature', 'warning');
      return;
    }

    this.isProcessing = true;
    this.processingProgress = 0;

    try {
      const win = window as any;
      if (!win.jspdf || !win.jspdf.jsPDF) {
        this.showMessage('PDF export library not loaded. Please refresh the page.', 'error');
        this.isProcessing = false;
        return;
      }

      const { jsPDF } = win.jspdf;
      const pdf = new jsPDF();
      pdf.deletePage(1);

      for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
        this.processingProgress = (pageNum / this.totalPages) * 100;

        const page = await this.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: this.pdfScale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');

        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        const pageSignatures = this.signedPages.filter(s => s.pageNumber === pageNum);
        for (const sig of pageSignatures) {
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = () => {
              ctx!.drawImage(img, sig.x, sig.y, sig.width, sig.height);
              resolve(null);
            };
            img.src = sig.signatureDataUrl;
          });
        }

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = viewport.width * 0.264583;
        const pdfHeight = viewport.height * 0.264583;

        pdf.addPage([pdfWidth, pdfHeight]);
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      this.signedPdfBlob = pdf.output('blob');
      if (this.signedPdfBlob) {
        this.signedPdfUrl = URL.createObjectURL(this.signedPdfBlob);
      }

      this.showMessage('Signature applied successfully!', 'success');
    } catch (error) {
      console.error('Error applying signature:', error);
      this.showMessage('Failed to apply signature', 'error');
    } finally {
      this.isProcessing = false;
      this.processingProgress = 0;
    }
  }

  downloadSignedPDF(): void {
    if (!this.signedPdfBlob) return;

    const link = document.createElement('a');
    link.href = this.signedPdfUrl;
    link.download = `signed_${this.fileName}`;
    link.click();

    this.showMessage('Download started', 'success');
  }

  previewSignedPDF(): void {
    if (this.signedPdfUrl) {
      window.open(this.signedPdfUrl, '_blank');
    }
  }

  resetAll(): void {
    this.pdfFile = null;
    this.pdfDoc = null;
    this.fileName = '';
    this.totalPages = 0;
    this.currentPage = 1;
    this.signedPages = [];
    this.signatureDataUrl = '';
    this.signedPdfBlob = null;
    this.signedPdfUrl = '';
    this.history = [];
    this.historyStep = -1;
    this.clearSignatureCanvas();

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    this.showMessage('Reset complete', 'info');
  }
}

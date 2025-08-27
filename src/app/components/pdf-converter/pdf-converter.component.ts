import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { SafeUrlPipe } from '../../safe-url.pipe';

@Component({
  selector: 'app-pdf-converter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatRadioModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule,
    SafeUrlPipe,
  ],
  templateUrl: './pdf-converter.component.html',
  styleUrls: ['./pdf-converter.component.scss']
})
export class PdfConverter implements OnInit {
  mode: 'pdf2b64' | 'b642pdf' = 'pdf2b64';
  outputType: 'trimmed' | 'raw' = 'trimmed';

  selectedFile?: File;
  outputBase64: string = '';

  inputBase64: string = '';
  filenameForDownload: string = 'converted.pdf';

  loading = false;
  dragOver = false;
  previewUrl: string | null = null;
  private lastBlob: Blob | null = null;

  constructor(private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.outputBase64 = '';
    this.inputBase64 = '';
    this.selectedFile = undefined;
    this.previewUrl = null;
  }

  onModeChange(value: 'pdf2b64' | 'b642pdf') {
    this.mode = value;
    this.outputBase64 = '';
    this.inputBase64 = '';
    this.selectedFile = undefined;
    this.previewUrl = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      this.outputBase64 = '';
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const dt = event.dataTransfer;
    if (dt && dt.files && dt.files.length) {
      this.selectedFile = dt.files[0];
      this.outputBase64 = '';
    }
  }

  convertPdfToBase64() {
    if (!this.selectedFile) return;
    this.loading = true;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const raw = dataUrl;
      const trimmed = raw.replace(/^data:.*;base64,/, '');
      this.outputBase64 = this.outputType === 'trimmed' ? trimmed : raw;
      this.inputBase64 = this.outputBase64;
      this.loading = false;
    };
    reader.onerror = () => {
      this.loading = false;
      this.showSnack('Failed reading file');
    };
    reader.readAsDataURL(this.selectedFile);
  }

  downloadBase64AsFile(filename = 'file.txt') {
    if (!this.outputBase64) return;
    const blob = new Blob([this.outputBase64], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.showSnack('Base64 downloaded');
  }

  convertBase64ToPdf() {
    const raw = (this.inputBase64 || '').trim();
    if (!raw) return;
    const b64 = raw.replace(/^data:.*;base64,/, '').replace(/\s+/g, '');
    try {
      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      this.setPreviewFromBlob(blob);
      this.showSnack('Preview ready — open or download the PDF');
    } catch (err) {
      this.showSnack('Invalid base64 input');
    }
  }

  private setPreviewFromBlob(blob: Blob) {
    if (this.previewUrl) {
      try { URL.revokeObjectURL(this.previewUrl); } catch (e) { }
    }
    this.lastBlob = blob;
    this.previewUrl = URL.createObjectURL(blob);
  }

  downloadPreviewPdf() {
    if (!this.lastBlob) return;
    const url = URL.createObjectURL(this.lastBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filenameForDownload || 'converted.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.showSnack('PDF downloaded');
  }

  openPreviewInNewTab() {
    if (!this.previewUrl) return;
    window.open(this.previewUrl, '_blank');
  }

  ngOnDestroy(): void {
    if (this.previewUrl) {
      try { URL.revokeObjectURL(this.previewUrl); } catch (e) { }
    }
  }

  copyToClipboard() {
    if (!this.outputBase64) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.outputBase64).then(() => {
        this.showSnack('Copied to clipboard');
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = this.outputBase64;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      this.showSnack('Copied to clipboard');
    }
  }

  private showSnack(message: string) {
    try {
      this.snackBar.open(message, 'OK', { duration: 1800 });
    } catch (e) {
    }
  }
}

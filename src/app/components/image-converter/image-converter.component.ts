import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
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
  selector: 'app-image-converter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIf,
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
  templateUrl: './image-converter.component.html',
  styleUrls: ['./image-converter.component.scss']
})
export class ImageConverter implements OnDestroy, OnInit {
  mode: 'img2b64' | 'b642img' = 'img2b64';
  outputType: 'trimmed' | 'raw' = 'trimmed';

  selectedFile?: File;
  outputBase64: string = '';

  inputBase64: string = '';
  filenameForDownload: string = 'converted.png';

  loading = false;
  dragOver = false;

  previewUrl: string | null = null;
  private lastBlob: Blob | null = null;

  constructor(private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.outputBase64 = '';
    this.inputBase64 = '';
    this.selectedFile = undefined;
    this.clearPreview();
  }

  onModeChange(value: 'img2b64' | 'b642img') {
    this.mode = value;
    this.outputBase64 = '';
    this.inputBase64 = '';
    this.selectedFile = undefined;
    this.clearPreview();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      this.outputBase64 = '';
      this.clearPreview();
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
      this.clearPreview();
    }
  }

  convertImageToBase64() {
    if (!this.selectedFile) return;
    this.loading = true;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const trimmed = dataUrl.replace(/^data:.*;base64,/, '');
      this.outputBase64 = this.outputType === 'trimmed' ? trimmed : dataUrl;
      this.inputBase64 = this.outputBase64;
      this.loading = false;
      this.showSnack('Image converted to Base64');
    };
    reader.onerror = () => {
      this.loading = false;
      this.showSnack('Failed reading image');
    };
    reader.readAsDataURL(this.selectedFile);
  }

  downloadBase64AsFile(filename = 'image.b64') {
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

  async convertBase64ToImage() {
    const raw = (this.inputBase64 || '').trim();
    if (!raw) return;

    let dataUrl = raw;
    if (!/^data:/.test(raw)) {
      const mime = this.guessMimeFromFilename(this.filenameForDownload) || 'image/png';
      dataUrl = `data:${mime};base64,${raw.replace(/\s+/g, '')}`;
    }

    try {
      const res = await fetch(dataUrl);
      if (!res.ok) throw new Error('Failed to decode image');
      const blob = await res.blob();
      this.setPreviewFromBlob(blob);
      this.showSnack('Image preview ready');
    } catch (err) {
      console.error('Invalid base64 input or decode failed', err);
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

  downloadPreviewImage() {
    if (!this.previewUrl) return;
    const a = document.createElement('a');
    a.href = this.previewUrl;
    a.download = this.filenameForDownload || 'converted.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.showSnack('Image downloaded');
  }

  private guessMimeFromFilename(name: string | undefined): string | null {
    if (!name) return null;
    const ext = name.split('.').pop()?.toLowerCase();
    if (!ext) return null;
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'gif') return 'image/gif';
    return null;
  }

  openPreviewInNewTab() {
    if (!this.previewUrl) return;
    window.open(this.previewUrl, '_blank');
  }

  copyToClipboard() {
    if (!this.outputBase64) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.outputBase64).then(() => this.showSnack('Copied to clipboard'));
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

  private clearPreview() {
    if (this.previewUrl) {
      try { URL.revokeObjectURL(this.previewUrl); } catch (e) { }
    }
    this.previewUrl = null;
    this.lastBlob = null;
  }

  private showSnack(message: string) {
    try { this.snackBar.open(message, 'OK', { duration: 1600 }); } catch (e) { }
  }

  ngOnDestroy(): void {
    this.clearPreview();
  }
}

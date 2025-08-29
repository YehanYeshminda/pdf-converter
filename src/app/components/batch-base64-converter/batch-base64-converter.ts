import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { SafeUrlPipe } from '../../safe-url.pipe';

interface OutputItem {
  name: string;
  type: string;
  base64: string;
  previewUrl?: string | null;
}

@Component({
  selector: 'app-batch-base64-converter',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    SafeUrlPipe,
  ],
  templateUrl: './batch-base64-converter.html',
  styleUrls: ['./batch-base64-converter.scss']
})
export class BatchBase64Converter implements OnDestroy, OnInit {
  mode: 'image' | 'pdf' = 'image';
  outputType: 'trimmed' | 'raw' = 'trimmed';

  items: OutputItem[] = [];
  maxItems = 5;

  dragOver = false;
  isMobileView = false;

  constructor(private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobileView = window.innerWidth <= 600;
  }

  onModeChange(mode: 'image' | 'pdf') {
    this.mode = mode;
    this.clearAll();
  }

  canAcceptMore(): boolean {
    return this.items.length < this.maxItems;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
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
    if (!dt || !dt.files) return;
    this.addFiles(Array.from(dt.files));
  }

  private addFiles(files: File[]) {
    for (const f of files) {
      if (!this.canAcceptMore()) {
        this.showSnack(`Limit reached: ${this.maxItems} files`);
        break;
      }
      if (this.mode === 'image' && !f.type.startsWith('image/')) {
        this.showSnack(`Skipped ${f.name}: not an image`);
        continue;
      }
      if (this.mode === 'pdf' && f.type !== 'application/pdf') {
        this.showSnack(`Skipped ${f.name}: not a PDF`);
        continue;
      }
      this.convertFileToBase64(f);
    }
  }

  private convertFileToBase64(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const trimmed = dataUrl.replace(/^data:.*;base64,/, '');
      const base64 = this.outputType === 'trimmed' ? trimmed : dataUrl;
      const item: OutputItem = { name: file.name, type: file.type, base64 };
      if (this.mode === 'image') {
        item.previewUrl = dataUrl;
      }
      this.items.push(item);
    };
    reader.onerror = () => this.showSnack(`Failed to read ${file.name}`);
    reader.readAsDataURL(file);
  }

  remove(index: number) {
    const it = this.items.splice(index, 1)[0];
    if (it && it.previewUrl) {
      try { URL.revokeObjectURL(it.previewUrl); } catch (e) { }
    }
  }

  downloadBase64(item: OutputItem) {
    const blob = new Blob([item.base64], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name + '.b64';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.showSnack('Downloaded base64');
  }

  downloadFileFromBase64(item: OutputItem) {
    const dataUrl = item.base64.startsWith('data:') ? item.base64 : `data:${item.type};base64,${item.base64}`;
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.showSnack('Downloaded file');
    }).catch(() => this.showSnack('Failed to download file'))
  }

  copy(item: OutputItem) {
    if (!item.base64) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(item.base64).then(() => this.showSnack('Copied'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = item.base64;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      this.showSnack('Copied');
    }
  }

  processAll() {
    if (!this.items.length) {
      this.showSnack('No files to process');
      return;
    }

    // Process is already complete in this case as files are converted on upload
    // But we can show a success message to provide feedback
    this.showSnack(`Successfully processed ${this.items.length} files`);
  }

  clearAll() {
    this.items = [];
  }

  private showSnack(message: string) {
    try { this.snackBar.open(message, 'OK', { duration: 1200 }); } catch (e) { }
  }

  ngOnDestroy(): void {
    for (const it of this.items) {
      if (it.previewUrl) try { URL.revokeObjectURL(it.previewUrl); } catch (e) { }
    }
  }
}

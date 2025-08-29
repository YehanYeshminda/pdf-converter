import { Component, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { NgxImageCompressService } from 'ngx-image-compress';
import { SafeUrlPipe } from '../../safe-url.pipe';

interface CompressedImage {
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  type: string;
}

@Component({
  selector: 'app-image-compress',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    SafeUrlPipe
  ],
  templateUrl: './image-compress.component.html',
  styleUrls: ['./image-compress.component.scss']
})
export class ImageCompress implements OnInit, OnDestroy {
  quality: number = 75;
  maxSize: number = 800;
  loading: boolean = false;
  isMobileView: boolean = false;
  dragOver: boolean = false;
  uploadedImages: CompressedImage[] = [];

  // Store original image data to allow recompression with new settings
  private originalImages: Map<string, { file: File, dataUrl: string }> = new Map();

  constructor(
    private imageCompress: NgxImageCompressService,
    private snackBar: MatSnackBar
  ) { }

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

  onQualityChange(event: any): void {
    if (event && event.value !== undefined && event.value !== this.quality) {
      const newQuality = Math.max(1, Math.min(100, event.value));
      console.log('Quality changed from', this.quality, 'to', newQuality);
      this.quality = newQuality;

      if (this.uploadedImages.length > 0) {
        this.recompressImages();
      }
    }
  }

  onMaxSizeChange(event: any): void {
    if (event && event.value !== undefined && event.value !== this.maxSize) {
      const newMaxSize = Math.max(100, Math.min(3000, event.value));
      console.log('Max size changed from', this.maxSize, 'to', newMaxSize);
      this.maxSize = newMaxSize;

      if (this.uploadedImages.length > 0) {
        this.recompressImages();
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const dt = event.dataTransfer;
    if (dt && dt.files && dt.files.length) {
      this.processFiles(Array.from(dt.files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.processFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  private async processFiles(files: File[]): Promise<void> {
    this.loading = true;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.showSnack(`Skipped ${file.name}: Not an image file`);
        continue;
      }

      try {
        await this.compressImage(file);
      } catch (error) {
        console.error('Compression error:', error);
        this.showSnack(`Failed to compress ${file.name}`);
      }
    }

    this.loading = false;
  }

  private async recompressImages(): Promise<void> {
    if (this.uploadedImages.length === 0 || this.originalImages.size === 0) return;

    console.log(`Recompressing images with quality: ${this.quality}%, maxSize: ${this.maxSize}px`);
    this.loading = true;
    const currentImages = [...this.uploadedImages];

    // First revoke old object URLs to prevent memory leaks
    for (const img of currentImages) {
      try {
        URL.revokeObjectURL(img.compressedUrl);
      } catch (e) {
        // Ignore errors
      }
    }

    // Process each image with current settings
    for (const img of currentImages) {
      const originalData = this.originalImages.get(img.name);
      if (originalData) {
        try {
          // Make sure to use the current quality and maxSize values
          const qualityToUse = Math.max(1, Math.min(100, this.quality));
          const maxSizeToUse = Math.max(100, Math.min(3000, this.maxSize));

          console.log(`Processing ${img.name} with quality: ${qualityToUse}%, maxSize: ${maxSizeToUse}px`);

          const compressedImage = await this.imageCompress.compressFile(
            originalData.dataUrl,
            -1,
            qualityToUse,
            maxSizeToUse
          );

          const compressedBlob = await fetch(compressedImage).then(r => r.blob());
          const compressedSize = compressedBlob.size;
          const compressedUrl = URL.createObjectURL(compressedBlob);

          const index = this.uploadedImages.findIndex(i => i.name === img.name);
          if (index !== -1) {
            this.uploadedImages[index].compressedSize = compressedSize;
            this.uploadedImages[index].compressedUrl = compressedUrl;
          }
        } catch (error) {
          console.error('Recompression error:', error);
        }
      }
    }

    this.loading = false;
    this.showSnack('Settings applied to all images');
  }

  private async compressImage(file: File): Promise<void> {
    const originalUrl = URL.createObjectURL(file);
    const originalSize = file.size;

    const reader = new FileReader();

    const readFilePromise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const dataUrl = await readFilePromise;

    this.originalImages.set(file.name, { file, dataUrl });

    const compressedImage = await this.imageCompress.compressFile(
      dataUrl,
      -1,
      this.quality,
      this.maxSize
    );

    const compressedBlob = await fetch(compressedImage).then(r => r.blob());
    const compressedSize = compressedBlob.size;
    const compressedUrl = URL.createObjectURL(compressedBlob);

    this.uploadedImages.unshift({
      name: file.name,
      originalSize,
      compressedSize,
      originalUrl,
      compressedUrl,
      type: file.type
    });

    this.showSnack(`Compressed ${file.name}`);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  calculateSavings(original: number, compressed: number): string {
    if (original <= 0) return '0%';
    const savings = ((original - compressed) / original) * 100;
    return savings.toFixed(1) + '%';
  }

  downloadImage(url: string, fileName: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.showSnack('Download started');
  }

  removeImage(index: number): void {
    const image = this.uploadedImages[index];
    URL.revokeObjectURL(image.originalUrl);
    URL.revokeObjectURL(image.compressedUrl);

    this.originalImages.delete(image.name);

    this.uploadedImages.splice(index, 1);
  }

  showSnack(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 2000 });
  }

  private cleanupUrls(): void {
    for (const image of this.uploadedImages) {
      try {
        URL.revokeObjectURL(image.originalUrl);
        URL.revokeObjectURL(image.compressedUrl);
      } catch (e) {
      }
    }

    this.originalImages.clear();
  }

  ngOnDestroy(): void {
    this.cleanupUrls();
  }
}

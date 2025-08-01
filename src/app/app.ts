
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { SafeUrlPipe } from './safe-url.pipe';


@Component({
  selector: 'app-root',
  imports: [FormsModule, NgIf, SafeUrlPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  showBase64Preview = false;
  copied = false;
  isLoading = false;
  isPreviewLoading = false;

  selectedFile: File | null = null;
  pdfObjectUrl: string | null = null;
  base64Result: string | null = null;
  convertType: 'base64' | 'base64Raw' = 'base64';

  activeTab: 'pdf2base64' | 'base642pdf' = 'pdf2base64';
  base64Input = '';
  base64ToPdfError: string | null = null;

  onFileChange(event: Event): void {
    this.isPreviewLoading = true;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.#revokePdfObjectUrl();
      this.pdfObjectUrl = URL.createObjectURL(this.selectedFile);
      setTimeout(() => (this.isPreviewLoading = false), 600);
    } else {
      this.selectedFile = null;
      this.#revokePdfObjectUrl();
      this.isPreviewLoading = false;
    }
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.selectedFile || !['base64', 'base64Raw'].includes(this.convertType)) return;
    this.isLoading = true;
    try {
      const base64 = await this.#fileToBase64(this.selectedFile);
      this.base64Result = this.convertType === 'base64Raw' ? this.#extractRawBase64(base64) : base64;
    } finally {
      setTimeout(() => (this.isLoading = false), 500);
    }
  }

  #fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  #extractRawBase64(dataUrl: string): string {
    const commaIdx = dataUrl.indexOf(',');
    return commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl;
  }

  setTab(tab: 'pdf2base64' | 'base642pdf'): void {
    this.activeTab = tab;
    this.selectedFile = null;
    this.base64Result = null;
    this.base64Input = '';
    this.base64ToPdfError = null;
    this.showBase64Preview = false;
    this.#revokePdfObjectUrl();
  }

  onBase64InputChange(value: string): void {
    if (this.#isValidBase64(value)) {
      this.isPreviewLoading = true;
      this.base64Input = value;
      setTimeout(() => (this.isPreviewLoading = false), 100);
    }
  }

  #isValidBase64(str: string): boolean {
    str = str.replace(/\s/g, '');
    const base64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return base64Pattern.test(str);
  }

  onBase64ToPdf(event: Event): void {
    event.preventDefault();
    this.base64ToPdfError = null;
    let base64 = this.base64Input.trim();
    if (!base64) {
      this.base64ToPdfError = 'Please enter a Base64 string.';
      return;
    }
    let base64Data = base64;
    if (base64.startsWith('data:')) {
      base64Data = this.#extractRawBase64(base64);
    }
    if (!this.#isValidBase64(base64Data)) {
      this.base64ToPdfError = 'Invalid Base64 string format.';
      return;
    }
    try {
      this.#downloadPdfFromBase64(base64Data, 'converted_pdf');
    } catch {
      this.base64ToPdfError = 'Invalid Base64 string.';
    }
  }

  onCopyToClipboard(): void {
    if (!this.base64Result) return;
    const raw = this.base64Result.startsWith('data:') ? this.#extractRawBase64(this.base64Result) : this.base64Result;
    navigator.clipboard.writeText(raw);
    this.copied = true;
    setTimeout(() => (this.copied = false), 500);
  }

  #revokePdfObjectUrl(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = null;
    }
  }

  #downloadPdfFromBase64(base64String: string, fileName: string) {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const base64FileType = this.#GetBase64DocumentType(base64String);

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: base64FileType.split('$')[0] });

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName + '.' + base64FileType.split('$')[1];
    link.click();
  }

  #GetBase64DocumentType(base64String: string) {
    const documentTypesToReturn: string[] = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
    const base64DocumentTypeChecks: string[] = ['JVBERi0', '/9j/', 'iVBORw0KGgo', 'R0lGODlh'];
    const documentExtensions: string[] = ['pdf', 'jpeg', 'png', 'gif'];

    const base64StringToCheckForPdf = base64String.substring(0, 7);
    const base64StringToCheckForJpeg = base64String.substring(0, 4);
    const base64StringToCheckForGif = base64String.substring(0, 8);
    const base64StringToCheckForPng = base64String.substring(0, 11);

    if (base64StringToCheckForPdf === base64DocumentTypeChecks[0]) {
      return documentTypesToReturn[0] + "$" + documentExtensions[0];
    } else if (base64StringToCheckForJpeg === base64DocumentTypeChecks[1]) {
      return documentTypesToReturn[1] + "$" + documentExtensions[1];
    } else if (base64StringToCheckForPng === base64DocumentTypeChecks[2]) {
      return documentTypesToReturn[2] + "$" + documentExtensions[2];
    } else if (base64StringToCheckForGif === base64DocumentTypeChecks[3]) {
      return documentTypesToReturn[3] + "$" + documentExtensions[3];
    } else {
      return 'unknown';
    }
  }
}

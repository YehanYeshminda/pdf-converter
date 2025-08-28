
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PdfConverter } from './components/pdf-converter/pdf-converter.component';
import { ImageConverter } from './components/image-converter/image-converter.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from './theme.service';
import { BatchBase64Converter } from './components/batch-base64-converter/batch-base64-converter';
import { Title, Meta } from '@angular/platform-browser';
import { ImageCompress } from "./components/image-compress/image-compress.component";


@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    MatTabsModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatSlideToggleModule,
    PdfConverter,
    ImageConverter,
    MatTooltipModule,
    BatchBase64Converter,
    ImageCompress
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class App implements OnInit {
  onChangeTab: boolean = false;
  isDark = false;

  constructor(private theme: ThemeService, private title: Title, private meta: Meta) { }

  ngOnInit(): void {
    this.isDark = this.theme.isDark();
    this.theme.applyClass(this.isDark);
    this.setDefaultSEO();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    this.theme.setDark(this.isDark);
  }

  onTabChange(event: any) {
    this.onChangeTab = !this.onChangeTab;
    this.updateSEOForTab(event.index);
  }

  private setDefaultSEO() {
    this.title.setTitle('File Converter - Convert PDFs, Images & Base64 Online');
    this.meta.updateTag({ name: 'description', content: 'Free online file converter tool. Convert PDFs to images, images to PDFs, and batch convert files to Base64. Fast, local, and privacy-first conversion.' });
  }

  private updateSEOForTab(tabIndex: number) {
    switch (tabIndex) {
      case 0: // PDF tab
        this.title.setTitle('PDF Converter - Convert PDFs to Images Online');
        this.meta.updateTag({ name: 'description', content: 'Convert PDF files to images (JPG, PNG) quickly and securely. Free online PDF converter with privacy-first processing.' });
        break;
      case 1: // Image tab
        this.title.setTitle('Image Converter - Convert Images to PDF Online');
        this.meta.updateTag({ name: 'description', content: 'Convert images (JPG, PNG, GIF) to PDF format. Free online image to PDF converter with batch processing support.' });
        break;
      case 2: // Batch Base64 tab
        this.title.setTitle('Base64 Converter - Batch Encode/Decode Files');
        this.meta.updateTag({ name: 'description', content: 'Batch convert files to Base64 encoding or decode Base64 strings back to files. Free online Base64 converter tool.' });
        break;
      default:
        this.setDefaultSEO();
    }
  }
}

import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { PdfConverter } from '../../components/pdf-converter/pdf-converter.component';
import { ImageConverter } from '../../components/image-converter/image-converter.component';
import { BatchBase64Converter } from '../../components/batch-base64-converter/batch-base64-converter';
import { ImageCompress } from '../../components/image-compress/image-compress.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-converter-page',
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatDividerModule,
    PdfConverter,
    ImageConverter,
    BatchBase64Converter,
    ImageCompress
  ],
  templateUrl: './pdf-converter-page.html',
  styleUrl: './pdf-converter-page.scss'
})
export class PdfConverterPage {
  onChangeTab: boolean = false;

  onTabChange(event: any): void {
    this.onChangeTab = !this.onChangeTab;
  }
}

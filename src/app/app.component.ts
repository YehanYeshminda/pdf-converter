
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { PdfConverter } from './components/pdf-converter/pdf-converter.component';
import { ImageConverter } from './components/image-converter/image-converter.component';


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
    PdfConverter,
    ImageConverter,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class App {
  onChangeTab: boolean = false;

  onTabChange(event: any) {
    this.onChangeTab = !this.onChangeTab;
  }
}

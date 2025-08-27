
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
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class App implements OnInit {
  onChangeTab: boolean = false;
  isDark = false;

  constructor(private theme: ThemeService) { }

  ngOnInit(): void {
    this.isDark = this.theme.isDark();
    this.theme.applyClass(this.isDark);
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    this.theme.setDark(this.isDark);
  }

  onTabChange(event: any) {
    this.onChangeTab = !this.onChangeTab;
  }
}

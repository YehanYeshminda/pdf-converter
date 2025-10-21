
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSidenav } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from './theme.service';
import { Title, Meta } from '@angular/platform-browser';
import { VisitorCounterService } from './services/visitor-counter.service';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    DecimalPipe,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSidenavModule,
    MatListModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class App implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  isDark = false;
  visitorCount: number = 0;
  currentRoute: string = '';

  constructor(
    private theme: ThemeService,
    private title: Title,
    private meta: Meta,
    private visitorCounter: VisitorCounterService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isDark = this.theme.isDark();
    this.theme.applyClass(this.isDark);
    this.fetchVisitorCount();
    this.updateCounter();
    this.setupResponsiveSidenav();
    this.trackRouteChanges();
    this.updateSEOBasedOnRoute();
  }

  private setupResponsiveSidenav(): void {
    setTimeout(() => {
      if (window.innerWidth <= 768) {
        this.sidenav.mode = 'over';
        this.sidenav.close();
      } else {
        this.sidenav.mode = 'side';
        this.sidenav.open();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        this.sidenav.mode = 'over';
        this.sidenav.close();
      } else {
        this.sidenav.mode = 'side';
        this.sidenav.open();
      }
    });
  }

  private fetchVisitorCount(): void {
    this.visitorCount = -1;

    this.visitorCounter.getCounter().subscribe({
      next: (count) => {
        if (count.code && count.code !== "200") {
          this.visitorCount = 0;
          return;
        } else {
          this.visitorCount = count.data.up_count || 0;
        }
      },
    });
  }

  private updateCounter(): void {
    this.visitorCounter.upCounter().subscribe();
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    this.theme.setDark(this.isDark);
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  onNavigate() {
    if (this.sidenav.mode === 'over') {
      this.sidenav.close();
    }
  }

  private trackRouteChanges(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        this.updateSEOBasedOnRoute();
      });
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute === route || this.router.url === route;
  }

  private updateSEOBasedOnRoute(): void {
    const route = this.router.url;

    switch (route) {
      case '/pdf-converter':
        this.title.setTitle('PDF Converter - Convert PDFs to Images Online');
        this.meta.updateTag({
          name: 'description',
          content: 'Convert PDF files to images (JPG, PNG) quickly and securely. Free online PDF converter with privacy-first processing.'
        });
        break;
      case '/text-encoder-decoder':
        this.title.setTitle('Text Encoder/Decoder - Encode & Decode Text Online');
        this.meta.updateTag({
          name: 'description',
          content: 'Encode and decode text using various encoding methods. Free online text encoder and decoder tool.'
        });
        break;
      case '/json-to-typescript':
        this.title.setTitle('JSON to TypeScript Converter - Generate TypeScript Interfaces');
        this.meta.updateTag({
          name: 'description',
          content: 'Convert JSON objects to TypeScript interfaces instantly. Generate typed interfaces with optional fields, readonly properties, and nested types.'
        });
        break;
      default:
        this.title.setTitle('ToolVerse - Free Online Developer Tools');
        this.meta.updateTag({
          name: 'description',
          content: 'Free online developer tools. Convert PDFs, encode/decode text, generate TypeScript interfaces from JSON, and more. Fast, local, and privacy-first.'
        });
    }
  }
}

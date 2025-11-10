
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ThemeService } from './theme.service';
import { Title, Meta } from '@angular/platform-browser';
import { VisitorCounterService } from './services/visitor-counter.service';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SearchBarComponent } from './components/search-bar/search-bar.component';


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
    MatDialogModule,
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
  
  convertersExpanded = true;
  pdfToolsExpanded = false;
  aboutExpanded = false;

  constructor(
    private theme: ThemeService,
    private title: Title,
    private meta: Meta,
    private visitorCounter: VisitorCounterService,
    private router: Router,
    private dialog: MatDialog
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

  toggleSection(section: 'converters' | 'pdfTools' | 'about') {
    switch (section) {
      case 'converters':
        this.convertersExpanded = !this.convertersExpanded;
        break;
      case 'pdfTools':
        this.pdfToolsExpanded = !this.pdfToolsExpanded;
        break;
      case 'about':
        this.aboutExpanded = !this.aboutExpanded;
        break;
    }
  }

  onNavigate() {
    if (this.sidenav.mode === 'over') {
      this.sidenav.close();
    }
  }

  onToolSelected() {
    // Close sidenav on mobile when a tool is selected from search
    if (this.sidenav.mode === 'over') {
      this.sidenav.close();
    }
  }

  openSearchDialog() {
    const dialogRef = this.dialog.open(SearchBarComponent, {
      width: '90vw',
      maxWidth: '600px',
      maxHeight: '80vh',
      panelClass: 'search-dialog-panel',
      hasBackdrop: true,
      disableClose: false,
      autoFocus: true
    });

    dialogRef.componentInstance.toolSelected.subscribe(() => {
      dialogRef.close();
      this.onToolSelected();
    });
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
        this.title.setTitle('JSON to Code Converter - TypeScript, C#, Python, Java, Go, Rust, Kotlin');
        this.meta.updateTag({
          name: 'description',
          content: 'Convert JSON to TypeScript, C#, Python, Java, Go, Rust, or Kotlin code instantly. Generate typed interfaces, classes, and structs with optional fields and nested types.'
        });
        break;
      case '/jwt-decoder':
        this.title.setTitle('JWT Decoder & Debugger - Decode JSON Web Tokens');
        this.meta.updateTag({
          name: 'description',
          content: 'Decode and debug JWT tokens instantly. View header, payload, signature, and expiration details. Free online JWT decoder tool.'
        });
        break;
      case '/regex-tester':
        this.title.setTitle('RegEx Tester - Test Regular Expressions Online');
        this.meta.updateTag({
          name: 'description',
          content: 'Test and debug regular expressions in real-time. Highlight matches, view capture groups, and access common regex patterns. Free online regex tester.'
        });
        break;
      case '/timestamp-converter':
        this.title.setTitle('Timestamp Converter - Unix Timestamp to Date Converter');
        this.meta.updateTag({
          name: 'description',
          content: 'Convert Unix timestamps to dates and vice versa. Compare dates, calculate relative time, and convert between timezones. Free online timestamp converter.'
        });
        break;
      case '/pdf-editor':
        this.title.setTitle('PDF Editor - Draw, Annotate & Erase PDF Content Online');
        this.meta.updateTag({
          name: 'description',
          content: 'Edit PDF files online with drawing and erasing tools. Annotate PDFs, remove sensitive information, and add custom notes. Free online PDF editor.'
        });
        break;
      case '/pdf-splitter':
        this.title.setTitle('PDF Splitter - Split PDF into Multiple Files Online');
        this.meta.updateTag({
          name: 'description',
          content: 'Split PDF files into individual pages or custom page ranges. Extract specific pages, create multiple PDFs, and download instantly. Free online PDF splitter tool.'
        });
        break;
      case '/pdf-signature':
        this.title.setTitle('PDF Signature - Sign PDF Documents Online');
        this.meta.updateTag({
          name: 'description',
          content: 'Add electronic or handwritten signatures to PDF documents online. Draw, type, or upload your signature and place it on any page. Free online PDF signature tool.'
        });
        break;
      case '/todo-list':
        this.title.setTitle('Todo List - Task Manager with Notifications');
        this.meta.updateTag({
          name: 'description',
          content: 'Manage your tasks with a powerful todo list. Set due dates, priorities, get browser notifications, and track your productivity. Free online task manager.'
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

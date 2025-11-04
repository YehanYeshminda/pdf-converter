import { Routes } from '@angular/router';
import { PdfConverterPage } from './pages/pdf-converter-page/pdf-converter-page';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'pdf-converter',
        pathMatch: 'full'
    },
    {
        path: 'pdf-converter',
        component: PdfConverterPage
    },
    {
        path: 'text-encoder-decoder',
        loadComponent: () => import('./pages/text-encoder-page/text-encoder-page').then(m => m.TextEncoderPage)
    },
    {
        path: 'json-to-typescript',
        loadComponent: () => import('./pages/json-to-ts-page/json-to-ts-page').then(m => m.JsonToTsPage)
    },
    {
        path: 'jwt-decoder',
        loadComponent: () => import('./pages/jwt-decoder-page/jwt-decoder-page').then(m => m.JwtDecoderPage)
    },
    {
        path: 'regex-tester',
        loadComponent: () => import('./pages/regex-tester-page/regex-tester-page').then(m => m.RegexTesterPage)
    },
    {
        path: 'timestamp-converter',
        loadComponent: () => import('./pages/timestamp-converter-page/timestamp-converter-page').then(m => m.TimestampConverterPage)
    },
    {
        path: 'pdf-editor',
        loadComponent: () => import('./pages/pdf-editor-page/pdf-editor-page').then(m => m.PdfEditorPage)
    },
    {
        path: 'pdf-splitter',
        loadComponent: () => import('./pages/pdf-splitter-page/pdf-splitter-page').then(m => m.PdfSplitterPage)
    }
];

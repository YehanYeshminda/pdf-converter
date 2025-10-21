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
    }
];

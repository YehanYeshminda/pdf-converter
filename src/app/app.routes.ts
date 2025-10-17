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
    }
];

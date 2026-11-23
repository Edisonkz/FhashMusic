import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'search',
    pathMatch: 'full'
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/pages/search-page/search-page.component')
        .then((m) => m.SearchPageComponent),
    title: 'FhashMusic — Explorar'
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./features/library/pages/library-page/library-page.component')
        .then((m) => m.LibraryPageComponent),
    title: 'FhashMusic — Mi Biblioteca'
  },
  {
    path: 'download',
    loadComponent: () =>
      import('./features/download/pages/download-page/download-page.component')
        .then((m) => m.DownloadPageComponent),
    title: 'FhashMusic — Descargas'
  },
  {
    path: 'recognition',
    loadComponent: () =>
      import('./features/recognition/pages/recognition-page/recognition-page.component')
        .then((m) => m.RecognitionPageComponent),
    title: 'FhashMusic — Adivinator'
  },
  {
    path: '**',
    redirectTo: 'search'
  }
];

import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Register } from './pages/register/register';

import { Home } from './pages/home/home';
import { Profile } from './pages/profile/profile';
import { SinglePost } from './pages/single-post/single-post';
import { MainLayout } from './pages/main-layout/main-layout';

import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },

  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: Home },
      { path: 'posts/:id', component: SinglePost },
      { path: 'users/:id', component: Profile },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: '' },
];

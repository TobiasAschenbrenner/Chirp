import { Component, DestroyRef, OnInit } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Sidebar } from '../../components/sidebar/sidebar';
import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';
import { ApiError } from '../../models/api-error.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss'],
})
export class MainLayout implements OnInit {
  constructor(private auth: Auth, private usersApi: Users, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) return;

    this.usersApi
      .loadBookmarks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: ApiError) => console.log('loadBookmarks failed:', err),
      });
  }
}

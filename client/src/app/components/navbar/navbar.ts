import { Component, EventEmitter, Output, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Auth } from '../../services/auth/auth';
import { Users, User } from '../../services/users/users';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit {
  keyword = '';
  @Output() keywordChange = new EventEmitter<string>();

  user = signal<User | null>(null);

  constructor(
    public auth: Auth,
    private usersApi: Users,
    private router: Router,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;

    this.usersApi
      .getUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (u) => this.user.set(u),
        error: (err) => console.log(err),
      });
  }

  onKeywordInput(): void {
    this.keywordChange.emit(this.keyword);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

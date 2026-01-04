import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  loginData = { email: '', password: '' };
  error = '';
  showPassword = false;
  loading = false;

  constructor(private auth: Auth, private usersApi: Users, private router: Router) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  loginUser(): void {
    this.error = '';

    const email = this.loginData.email.trim();
    const password = this.loginData.password;

    if (!email || !password) {
      this.error = 'Email and password are required.';
      return;
    }

    this.loading = true;

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.usersApi.loadBookmarks().subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/home']);
          },
          error: () => {
            this.loading = false;
            this.router.navigate(['/home']);
          },
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed.';
      },
    });
  }
}

// alice.schneider@example.com
// Password123!

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { Auth } from '../../services/auth/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login {
  email = '';
  password = '';

  loading = false;
  error: string | null = null;

  constructor(private auth: Auth, private router: Router) {}

  onSubmit(): void {
    if (!this.email.trim() || !this.password) {
      this.error = 'Please enter email and password.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: (res: any) => {
        this.loading = false;

        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed. Please try again.';
      },
    });
  }
}

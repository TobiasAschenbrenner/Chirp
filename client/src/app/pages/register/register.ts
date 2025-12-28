import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../services/auth/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register {
  userData = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  error = '';
  showPassword = false;
  loading = false;

  constructor(private auth: Auth, private router: Router) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  registerUser(): void {
    this.error = '';

    const fullName = this.userData.fullName.trim();
    const email = this.userData.email.trim();
    const password = this.userData.password;
    const confirmPassword = this.userData.confirmPassword;

    // Basic validation like the React tutorial
    if (!fullName || !email || !password || !confirmPassword) {
      this.error = 'Please fill out all fields.';
      return;
    }

    if (password !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    this.auth.register({ fullName, email, password, confirmPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Registration failed.';
      },
    });
  }
}

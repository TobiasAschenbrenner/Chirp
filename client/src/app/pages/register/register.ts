import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';

import { Auth } from '../../services/auth/auth';
import { EMAIL_PATTERN, utf8ByteLength, VALIDATION_LIMITS } from '../../utils/input-validation';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register {
  readonly validationLimits = VALIDATION_LIMITS;

  userData = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  error = '';
  showPassword = false;
  loading = false;

  constructor(
    private auth: Auth,
    private router: Router,
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  registerUser(): void {
    this.error = '';

    const fullName = this.userData.fullName.trim();
    const email = this.userData.email.trim();
    const password = this.userData.password;
    const confirmPassword = this.userData.confirmPassword;

    if (!fullName || !email || !password || !confirmPassword) {
      this.error = 'Please fill out all fields.';
      return;
    }

    if (fullName.length > VALIDATION_LIMITS.fullName) {
      this.error = 'Full name must be 80 characters or fewer.';
      return;
    }

    if (email.length > VALIDATION_LIMITS.email) {
      this.error = 'Email must be 254 characters or fewer.';
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    if (password.length < VALIDATION_LIMITS.registrationPassword) {
      this.error = 'Password must be at least 15 characters.';
      return;
    }

    if (utf8ByteLength(password) > VALIDATION_LIMITS.passwordBytes) {
      this.error = 'Password must not exceed 72 UTF-8 bytes.';
      return;
    }

    if (password !== confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;

    this.auth
      .register({
        fullName,
        email,
        password,
        confirmPassword,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          void this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || 'Registration failed.';
        },
      });
  }
}

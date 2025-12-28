import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { Auth } from '../../services/auth/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar {
  keyword = '';

  @Output() keywordChange = new EventEmitter<string>();

  constructor(public auth: Auth, private router: Router) {}

  get userId(): string | null {
    return this.auth.getUserId();
  }

  onKeywordInput(): void {
    this.keywordChange.emit(this.keyword);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

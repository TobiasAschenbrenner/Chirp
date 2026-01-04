import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../../components/sidebar/sidebar';
import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.scss'],
})
export class MainLayout implements OnInit {
  constructor(private auth: Auth, private usersApi: Users) {}

  ngOnInit(): void {
    if (this.auth.getToken?.() || this.auth.isLoggedIn?.()) {
      this.usersApi.loadBookmarks().subscribe({
        error: () => {},
      });
    }
  }

  openThemes(): void {
    console.log('Open themes modal (todo)');
  }
}

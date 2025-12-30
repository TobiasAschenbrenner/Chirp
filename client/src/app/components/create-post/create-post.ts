import { Component, EventEmitter, Input, Output, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Auth } from '../../services/auth/auth';
import { Users, User } from '../../services/users/users';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './create-post.html',
  styleUrls: ['./create-post.scss'],
})
export class CreatePost implements OnInit {
  @Input() error = '';
  @Output() createPost = new EventEmitter<FormData>();

  body = '';
  image: File | null = null;

  user = signal<User | null>(null);

  constructor(private auth: Auth, private usersApi: Users, private destroyRef: DestroyRef) {}

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

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.image = input.files[0];
    }
  }

  onSubmit(): void {
    const postData = new FormData();
    postData.set('body', this.body);

    if (this.image) postData.set('image', this.image);

    this.createPost.emit(postData);

    this.body = '';
    this.image = null;
  }
}

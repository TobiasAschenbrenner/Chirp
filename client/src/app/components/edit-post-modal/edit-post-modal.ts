import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Posts as PostsApi } from '../../services/posts/posts';
import { Post } from '../../models/post.model';
import { ApiError } from '../../models/api-error.model';

import { VALIDATION_LIMITS } from '../../utils/input-validation';

@Component({
  selector: 'app-edit-post-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-post-modal.html',
  styleUrls: ['./edit-post-modal.scss'],
})
export class EditPostModal implements OnInit {
  @Input({ required: true }) postId!: string;

  @Output() updated = new EventEmitter<Post>();
  @Output() closed = new EventEmitter<void>();

  body = signal('');
  loading = signal(false);
  error = signal('');

  readonly validationLimits = VALIDATION_LIMITS;

  constructor(
    private postsApi: PostsApi,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.loadPost();
  }

  submit(): void {
    const body = this.body().trim();

    if (!body || body.length > VALIDATION_LIMITS.post) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    // Keep the existing API call below.

    this.postsApi
      .editPost(this.postId, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post) => {
          this.updated.emit(post);
          this.closed.emit();
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          console.log(err);
          this.error.set(err?.error?.message || 'Failed to update post.');
          this.loading.set(false);
        },
      });
  }

  close(e?: MouseEvent): void {
    if (!e) {
      this.closed.emit();
      return;
    }

    if (e.target === e.currentTarget) {
      this.closed.emit();
    }
  }

  private loadPost(): void {
    this.loading.set(true);
    this.error.set('');

    this.postsApi
      .getPost(this.postId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (post) => {
          this.body.set(post.body || '');
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          console.log(err);
          this.error.set(err?.error?.message || 'Failed to load post.');
          this.loading.set(false);
        },
      });
  }
}

import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';

import { Posts } from '../../services/posts/posts';
import { Post } from '../../models/post.model';
import { Auth } from '../../services/auth/auth';
import { ApiError } from '../../models/api-error.model';

@Component({
  selector: 'app-like-post',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './like-post.html',
  styleUrls: ['./like-post.scss'],
})
export class LikePost {
  @Input({ required: true }) post!: Post;
  @Output() postUpdated = new EventEmitter<Post>();

  busy = signal(false);

  private userId = computed(() => this.auth.getUserId());

  liked = computed(() => {
    const uid = this.userId();
    return !!uid && Array.isArray(this.post?.likes) && this.post.likes.includes(uid);
  });

  likesCount = computed(() => this.post?.likes?.length ?? 0);

  constructor(private postsApi: Posts, private auth: Auth) {}

  toggleLike(): void {
    if (!this.post?._id || this.busy()) return;

    this.busy.set(true);

    this.postsApi
      .likePost(this.post._id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (updated) => this.postUpdated.emit(updated),
        error: (err: ApiError) => console.log(err),
      });
  }

  get ariaLabel(): string {
    return this.liked() ? 'Unlike post' : 'Like post';
  }
}

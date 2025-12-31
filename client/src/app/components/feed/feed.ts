import { Component, EventEmitter, Input, Output, OnInit, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';

import { Post } from '../../services/posts/posts';
import { Posts as PostsApi } from '../../services/posts/posts';
import { Auth } from '../../services/auth/auth';
import { Users, User } from '../../services/users/users';
import { LikeDislikePost } from '../like-dislike-post/like-dislike-post';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { ProfileImage } from '../profile-image/profile-image';
import { BookmarkPost } from '../bookmark-post/bookmark-post';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    FormsModule,
    LikeDislikePost,
    TimeAgoPipe,
    RouterModule,
    ProfileImage,
    BookmarkPost,
  ],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss'],
})
export class Feed implements OnInit {
  @Input({ required: true }) post!: Post;
  @Input() bookmarked = false;
  @Output() postUpdated = new EventEmitter<Post>();
  @Output() postDeleted = new EventEmitter<string>();

  creator = signal<User | null>(null);
  creatorLoading = signal(false);

  editing = signal(false);
  editBody = signal('');
  busy = signal(false);

  constructor(
    private usersApi: Users,
    private postsApi: PostsApi,
    private auth: Auth,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    const creatorId = this.creatorId();
    if (!creatorId) return;

    this.creatorLoading.set(true);

    this.usersApi
      .getUser(creatorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.creator.set(user);
          this.creatorLoading.set(false);
        },
        error: (err) => {
          console.log(err);
          this.creatorLoading.set(false);
        },
      });
  }

  private creatorId(): string | null {
    const c: any = this.post?.creator;
    if (!c) return null;
    return typeof c === 'string' ? c : c._id;
  }

  isOwner(): boolean {
    const me = this.auth.getUserId();
    const owner = this.creatorId();
    return !!me && !!owner && me === owner;
  }

  startEdit(): void {
    this.editBody.set(this.post.body || '');
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.editBody.set('');
  }

  saveEdit(): void {
    const body = this.editBody().trim();
    if (!body || !this.post?._id) return;

    this.busy.set(true);

    this.postsApi.editPost(this.post._id, body).subscribe({
      next: (updated) => {
        this.postUpdated.emit(updated);
        this.editing.set(false);
        this.busy.set(false);
      },
      error: (err) => {
        console.log(err);
        this.busy.set(false);
      },
    });
  }

  deletePost(): void {
    if (!this.post?._id) return;

    this.busy.set(true);

    this.postsApi.deletePost(this.post._id).subscribe({
      next: () => {
        this.postDeleted.emit(this.post._id);
        this.busy.set(false);
      },
      error: (err) => {
        console.log(err);
        this.busy.set(false);
      },
    });
  }

  emitUpdatedPost(updated: Post): void {
    this.postUpdated.emit(updated);
  }
}

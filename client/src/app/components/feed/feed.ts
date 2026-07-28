import { Component, EventEmitter, Input, Output, OnInit, signal, DestroyRef } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Posts as PostsApi } from '../../services/posts/posts';
import { Post } from '../../models/post.model';
import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';
import { User } from '../../models/user.model';

import { LikePost } from '../like-post/like-post';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { ProfileImage } from '../profile-image/profile-image';
import { BookmarkPost } from '../bookmark-post/bookmark-post';
import { EditPostModal } from '../edit-post-modal/edit-post-modal';
import { ApiError } from '../../models/api-error.model';

type PostCreator = string | { _id: string };

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    MatIconModule,
    FormsModule,
    RouterModule,
    LikePost,
    TimeAgoPipe,
    ProfileImage,
    BookmarkPost,
    EditPostModal
],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss'],
})
export class Feed implements OnInit {
  @Input({ required: true }) post!: Post;
  @Input() bookmarked = false;

  @Output() postUpdated = new EventEmitter<Post>();
  @Output() postDeleted = new EventEmitter<string>();
  @Output() bookmarkChanged = new EventEmitter<{
    postId: string;
    bookmarked: boolean;
  }>();

  creator = signal<User | null>(null);
  creatorLoading = signal(false);

  editing = signal(false);
  editBody = signal('');
  editModalOpen = signal(false);

  busy = signal(false);

  constructor(
    private usersApi: Users,
    private postsApi: PostsApi,
    private auth: Auth,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    const postCreator = this.post?.creator;

    if (!postCreator) return;

    if (typeof postCreator !== 'string') {
      this.creator.set(postCreator);
      return;
    }

    this.creatorLoading.set(true);

    this.usersApi
      .getUser(postCreator)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.creator.set(user);
          this.creatorLoading.set(false);
        },
        error: (err: ApiError) => {
          console.log(err);
          this.creatorLoading.set(false);
        },
      });
  }

  authorLinkId(): string | null {
    return this.creator()?._id ?? this.getCreatorId();
  }

  isOwner(): boolean {
    const me = this.auth.getUserId();
    const owner = this.getCreatorId();
    return !!me && !!owner && me === owner;
  }

  onBookmarkChanged(e: { postId: string; bookmarked: boolean }): void {
    this.bookmarkChanged.emit(e);
  }

  startEdit(): void {
    if (!this.post?._id) return;
    this.editModalOpen.set(true);
  }

  closeEditModal(): void {
    this.editModalOpen.set(false);
  }

  onModalUpdated(updated: Post): void {
    this.postUpdated.emit(updated);
    this.editModalOpen.set(false);
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
      error: (err: ApiError) => {
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
      error: (err: ApiError) => {
        console.log(err);
        this.busy.set(false);
      },
    });
  }

  emitUpdatedPost(updated: Post): void {
    this.postUpdated.emit(updated);
  }

  private getCreatorId(): string | null {
    const creator = this.post?.creator as PostCreator | undefined;
    if (!creator) return null;
    return typeof creator === 'string' ? creator : creator._id;
  }
}

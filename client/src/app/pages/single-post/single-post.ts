import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { BookmarkPost } from '../../components/bookmark-post/bookmark-post';
import { PostComment } from '../../components/post-comment/post-comment';
import { ProfileImage } from '../../components/profile-image/profile-image';
import { ApiError } from '../../models/api-error.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { Comments as CommentsApi } from '../../services/comments/comments';
import { Posts } from '../../services/posts/posts';
import { Users } from '../../services/users/users';
import { Post, PostUser } from '../../models/post.model';
import { Comment } from '../../models/comment.model';

import { VALIDATION_LIMITS } from '../../utils/input-validation';

@Component({
  selector: 'app-single-post',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    PostComment,
    TimeAgoPipe,
    BookmarkPost,
    ProfileImage,
  ],
  templateUrl: './single-post.html',
  styleUrls: ['./single-post.scss'],
})
export class SinglePost implements OnInit {
  readonly post = signal<Post | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly commentText = signal('');

  readonly validationLimits = VALIDATION_LIMITS;

  readonly creator = computed<PostUser | null>(() => {
    const c = this.post()?.creator;
    return !c || typeof c === 'string' ? null : c;
  });

  readonly authorId = computed<string | null>(() => {
    const c = this.post()?.creator;
    if (!c) return null;
    return typeof c === 'string' ? c : c._id;
  });

  readonly comments = computed<Comment[]>(() => {
    const list = this.post()?.comments ?? [];
    return list.filter((c): c is Comment => typeof c !== 'string');
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly postsApi: Posts,
    private readonly commentsApi: CommentsApi,
    protected readonly usersApi: Users,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loadPost(id);
  }

  createComment(): void {
    const p = this.post();
    if (!p) return;

    const text = this.commentText().trim();

    if (!text || text.length > VALIDATION_LIMITS.comment) {
      return;
    }

    this.error.set('');

    this.commentsApi.createComment(p._id, text).subscribe({
      next: (newComment) => {
        this.post.update((old) => (old ? this.addComment(old, newComment) : old));
        this.commentText.set('');
      },
      error: (err) => this.error.set(this.errorMessage(err, 'Failed to create comment.')),
    });
  }

  deleteComment(commentId: string): void {
    this.error.set('');

    this.commentsApi.deleteComment(commentId).subscribe({
      next: () => {
        this.post.update((old) => (old ? this.removeComment(old, commentId) : old));
      },
      error: (err) => this.error.set(this.errorMessage(err, 'Failed to delete comment.')),
    });
  }

  onPostUpdated(updated: Post): void {
    this.post.set(updated);
  }

  private loadPost(id: string): void {
    this.loading.set(true);
    this.error.set('');

    this.postsApi
      .getPost(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (p) => this.post.set(p),
        error: (err) => this.error.set(this.errorMessage(err, 'Failed to load post.')),
      });
  }

  private addComment(post: Post, newComment: Comment): Post {
    return {
      ...post,
      comments: [newComment, ...(post.comments ?? [])],
    };
  }

  private removeComment(post: Post, commentId: string): Post {
    const nextComments = (post.comments ?? []).filter(
      (c) => typeof c === 'string' || c._id !== commentId,
    );

    return { ...post, comments: nextComments };
  }

  private errorMessage(err: unknown, fallback: string): string {
    const e = err as ApiError | null;
    return e?.error?.message || fallback;
  }
}

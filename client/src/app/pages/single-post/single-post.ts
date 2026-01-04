import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { Posts, Post, Comment, PostUser } from '../../services/posts/posts';
import { Comments as CommentsApi } from '../../services/comments/comments';
import { LikeDislikePost } from '../../components/like-dislike-post/like-dislike-post';
import { PostComment } from '../../components/post-comment/post-comment';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { BookmarkPost } from '../../components/bookmark-post/bookmark-post';
import { ProfileImage } from '../../components/profile-image/profile-image';
import { Users } from '../../services/users/users';

@Component({
  selector: 'app-single-post',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    LikeDislikePost,
    PostComment,
    TimeAgoPipe,
    BookmarkPost,
    ProfileImage,
  ],
  templateUrl: './single-post.html',
  styleUrls: ['./single-post.scss'],
})
export class SinglePost implements OnInit {
  post = signal<Post | null>(null);
  loading = signal(false);
  error = signal('');

  commentText = signal('');

  constructor(
    private route: ActivatedRoute,
    private postsApi: Posts,
    private commentsApi: CommentsApi,
    protected usersApi: Users
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadPost(id);
  }

  private loadPost(id: string): void {
    this.loading.set(true);

    this.postsApi.getPost(id).subscribe({
      next: (p) => {
        this.post.set(p);
        this.loading.set(false);
      },
      error: (err) => {
        console.log(err);
        this.error.set(err?.error?.message || 'Failed to load post.');
        this.loading.set(false);
      },
    });
  }

  creator(): PostUser | null {
    const p = this.post();
    if (!p) return null;
    return typeof p.creator === 'string' ? null : p.creator;
  }

  comments(): Comment[] {
    const p = this.post();
    if (!p) return [];
    return (p.comments || []).filter((c): c is Comment => typeof c !== 'string');
  }

  createComment(): void {
    const p = this.post();
    if (!p) return;

    const text = this.commentText().trim();
    if (!text) return;

    this.commentsApi.createComment(p._id, text).subscribe({
      next: (newComment) => {
        this.post.update((old) => {
          if (!old) return old;
          return { ...old, comments: [newComment, ...(old.comments || [])] };
        });

        this.commentText.set('');
      },
      error: (err) => {
        console.log(err);
        this.error.set(err?.error?.message || 'Failed to create comment.');
      },
    });
  }

  deleteComment(commentId: string): void {
    this.commentsApi.deleteComment(commentId).subscribe({
      next: () => {
        this.post.update((old) => {
          if (!old) return old;
          const nextComments = this.comments().filter((c) => c._id !== commentId);
          return { ...old, comments: nextComments };
        });
      },
      error: (err) => {
        console.log(err);
        this.error.set(err?.error?.message || 'Failed to delete comment.');
      },
    });
  }

  onPostUpdated(updated: Post): void {
    this.post.set(updated);
  }
}

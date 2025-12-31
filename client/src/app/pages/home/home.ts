import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreatePost } from '../../components/create-post/create-post';
import { ForYouOrFollowing } from '../../components/for-you-or-following/for-you-or-following';
import { Posts, Post } from '../../services/posts/posts';
import { FeedSkeleton } from '../../components/feed-skeleton/feed-skeleton';
import { Users } from '../../services/users/users';

import { Feeds } from '../../components/feeds/feeds';

type FeedMode = 'foryou' | 'following';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CreatePost, ForYouOrFollowing, FeedSkeleton, Feeds],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  mode = signal<FeedMode>('foryou');
  posts = signal<Post[]>([]);
  loading = signal(false);
  error = signal('');
  bookmarkedIds = signal<Set<string>>(new Set());

  constructor(private usersApi: Users, private postsApi: Posts) {}

  ngOnInit(): void {
    this.loadPosts();
    this.loadBookmarks();
  }

  openThemes(): void {
    console.log('Open themes modal (todo)');
  }

  onPostUpdated(updated: Post): void {
    this.posts.update((list) => list.map((p) => (p._id === updated._id ? updated : p)));
  }

  onPostDeleted(postId: string): void {
    this.posts.update((list) => list.filter((p) => p._id !== postId));
  }

  onModeChange(mode: FeedMode): void {
    this.mode.set(mode);
    this.loadPosts();
  }

  private loadPosts(): void {
    this.loading.set(true);

    const request$ =
      this.mode() === 'foryou' ? this.postsApi.getPosts() : this.postsApi.getFollowingPosts();

    request$.subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: (err) => {
        console.log('Load posts failed:', err);
        this.loading.set(false);
      },
    });
  }

  private loadBookmarks(): void {
    this.usersApi.getBookmarks().subscribe({
      next: (res) => {
        const ids = new Set(res.bookmarks.map((p) => p._id));
        this.bookmarkedIds.set(ids);
      },
      error: (err) => console.log(err),
    });
  }

  createPost(data: FormData): void {
    this.error.set('');

    this.postsApi.createPost(data).subscribe({
      next: (newPost) => {
        if (this.mode() === 'foryou') {
          this.posts.update((current) => [newPost, ...current]);
        } else {
          this.loadPosts();
        }
      },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to create post.';
        this.error.set(
          msg === "TypeError: Cannot read properties of null (reading 'image')"
            ? 'Please upload an image'
            : msg
        );
      },
    });
  }
}

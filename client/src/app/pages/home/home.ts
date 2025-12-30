import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Sidebar } from '../../components/sidebar/sidebar';
import { CreatePost } from '../../components/create-post/create-post';
import { ForYouOrFollowing } from '../../components/for-you-or-following/for-you-or-following';

import { Posts, Post } from '../../services/posts/posts';

type FeedMode = 'foryou' | 'following';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Sidebar, CreatePost, ForYouOrFollowing],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class Home implements OnInit {
  mode = signal<FeedMode>('foryou');
  posts = signal<Post[]>([]);
  loading = signal(false);
  error = signal('');

  constructor(private postsApi: Posts) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  openThemes(): void {
    console.log('Open themes modal (todo)');
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

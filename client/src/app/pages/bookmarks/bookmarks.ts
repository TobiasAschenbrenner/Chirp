import { Component, DestroyRef, computed, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { finalize } from 'rxjs/operators';

import { Users } from '../../services/users/users';
import { Post } from '../../models/post.model';

import { Feeds } from '../../components/feeds/feeds';
import { FeedSkeleton } from '../../components/feed-skeleton/feed-skeleton';

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [Feeds, FeedSkeleton],
  templateUrl: './bookmarks.html',
  styleUrls: ['./bookmarks.scss'],
})
export class Bookmarks implements OnInit {
  bookmarks = signal<Post[]>([]);
  loading = signal(true);
  error = signal('');

  bookmarkedIds = computed(() => new Set(this.bookmarks().map((p) => p._id)));

  constructor(private usersApi: Users, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    this.loadBookmarks();
  }

  loadBookmarks(): void {
    this.loading.set(true);
    this.error.set('');

    this.usersApi
      .getBookmarks()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.bookmarks.set(res.bookmarks || []);
        },
        error: (err) => {
          console.log(err);
          this.error.set(err?.error?.message || 'Failed to load bookmarks.');
        },
      });
  }

  onPostUpdated(updated: Post): void {
    this.bookmarks.update((list) => list.map((p) => (p._id === updated._id ? updated : p)));
  }

  onPostDeleted(postId: string): void {
    this.bookmarks.update((list) => list.filter((p) => p._id !== postId));
  }

  onBookmarkChanged(e: { postId: string; bookmarked: boolean }): void {
    if (!e.bookmarked) {
      this.bookmarks.update((list) => list.filter((p) => p._id !== e.postId));
    }
  }

  readonly isEmpty = computed(() => !this.loading() && this.bookmarks().length === 0);
  readonly hasBookmarks = computed(() => this.bookmarks().length > 0);
}

import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import { Posts } from '../../services/posts/posts';
import { Users } from '../../services/users/users';

@Component({
  selector: 'app-bookmark-post',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './bookmark-post.html',
  styleUrls: ['./bookmark-post.scss'],
})
export class BookmarkPost {
  @Input({ required: true }) postId!: string;

  bookmarked = signal(false);
  busy = signal(false);

  @Input() set initialBookmarked(value: boolean) {
    this.setBookmarkedState(!!value, { emit: false });
  }

  @Output() changed = new EventEmitter<{ postId: string; bookmarked: boolean }>();

  constructor(private postsApi: Posts, private usersApi: Users) {}

  toggleBookmark(): void {
    if (!this.postId || this.busy()) return;

    this.busy.set(true);

    this.postsApi.toggleBookmark(this.postId).subscribe({
      next: (res) => {
        const isOn = res.bookmarks.includes(this.postId);
        this.setBookmarkedState(isOn, { emit: true });
        this.busy.set(false);
      },
      error: (err) => {
        console.error(err);
        this.busy.set(false);
      },
    });
  }

  private setBookmarkedState(isOn: boolean, opts: { emit: boolean }): void {
    this.bookmarked.set(isOn);
    this.usersApi.setBookmarked(this.postId, isOn);

    if (opts.emit) {
      this.changed.emit({ postId: this.postId, bookmarked: isOn });
    }
  }

  get ariaLabel(): string {
    return this.bookmarked() ? 'Remove bookmark' : 'Bookmark post';
  }
}

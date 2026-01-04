import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { Posts } from '../../services/posts/posts';
import { Users } from '../../services/users/users';

@Component({
  selector: 'app-bookmark-post',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './bookmark-post.html',
  styleUrls: ['./bookmark-post.scss'],
})
export class BookmarkPost {
  @Input({ required: true }) postId!: string;

  bookmarked = signal(false);

  @Input() set initialBookmarked(value: boolean) {
    this.bookmarked.set(!!value);
  }

  @Output() changed = new EventEmitter<{ postId: string; bookmarked: boolean }>();

  constructor(private postsApi: Posts, private usersApi: Users) {}

  toggleBookmark(): void {
    this.postsApi.toggleBookmark(this.postId).subscribe({
      next: (res) => {
        const isOn = res.bookmarks.includes(this.postId);

        this.bookmarked.set(isOn);
        this.usersApi.setBookmarked(this.postId, isOn);

        this.changed.emit({ postId: this.postId, bookmarked: isOn });
      },
      error: (err) => console.error(err),
    });
  }
}

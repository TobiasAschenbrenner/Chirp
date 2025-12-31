import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Posts } from '../../services/posts/posts';

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

  constructor(private postsApi: Posts) {}

  toggleBookmark(): void {
    this.postsApi.toggleBookmark(this.postId).subscribe({
      next: (res) => {
        this.bookmarked.set(res.bookmarks.includes(this.postId));
      },
      error: (err) => console.error(err),
    });
  }
}

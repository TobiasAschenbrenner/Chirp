import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Feed } from '../feed/feed';
import { Post } from '../../services/posts/posts';
import { Users } from '../../services/users/users';

@Component({
  selector: 'app-feeds',
  standalone: true,
  imports: [CommonModule, Feed],
  templateUrl: './feeds.html',
  styleUrls: ['./feeds.scss'],
})
export class Feeds {
  @Input() posts: Post[] = [];
  @Input() bookmarkedIds: Set<string> = new Set();
  @Output() postUpdated = new EventEmitter<Post>();
  @Output() postDeleted = new EventEmitter<string>();
  @Output() bookmarkChanged = new EventEmitter<{ postId: string; bookmarked: boolean }>();

  constructor(public usersApi: Users) {}

  onPostDeleted(id: string): void {
    this.postDeleted.emit(id);
  }

  onPostUpdated(updated: Post): void {
    this.postUpdated.emit(updated);
  }
}

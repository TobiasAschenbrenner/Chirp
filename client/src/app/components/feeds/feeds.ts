import { Component, EventEmitter, Input, Output } from '@angular/core';


import { Feed } from '../feed/feed';
import { Post } from '../../models/post.model';
import { Users } from '../../services/users/users';

@Component({
  selector: 'app-feeds',
  standalone: true,
  imports: [Feed],
  templateUrl: './feeds.html',
  styleUrls: ['./feeds.scss'],
})
export class Feeds {
  @Input() posts: ReadonlyArray<Post> = [];
  @Input() bookmarkedIds: ReadonlySet<string> = new Set<string>();

  @Output() postUpdated = new EventEmitter<Post>();
  @Output() postDeleted = new EventEmitter<string>();
  @Output() bookmarkChanged = new EventEmitter<{
    postId: string;
    bookmarked: boolean;
  }>();

  constructor(public usersApi: Users) {}
}

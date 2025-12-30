import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Post } from '../../services/posts/posts';
import { Users, User } from '../../services/users/users';
import { LikeDislikePost } from '../like-dislike-post/like-dislike-post';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, MatIconModule, LikeDislikePost],
  templateUrl: './feed.html',
  styleUrls: ['./feed.scss'],
})
export class Feed implements OnInit {
  @Input({ required: true }) post!: Post;
  @Output() postUpdated = new EventEmitter<Post>();

  creator = signal<User | null>(null);
  creatorLoading = signal(false);

  initials = computed(() => {
    const name = this.creator()?.fullName?.trim() || '';
    if (!name) return '?';
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[1]?.[0] ?? '' : '';
    return (first + second).toUpperCase();
  });

  constructor(private usersApi: Users, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    if (!this.post?.creator) return;

    this.creatorLoading.set(true);

    this.usersApi
      .getUser(this.post.creator)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.creator.set(user);
          this.creatorLoading.set(false);
        },
        error: (err) => {
          console.log(err);
          this.creatorLoading.set(false);
        },
      });
  }

  emitUpdatedPost(updated: Post): void {
    this.postUpdated.emit(updated);
  }
}

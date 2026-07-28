import { Component, EventEmitter, Input, Output, OnInit, DestroyRef, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';

import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';
import { User } from '../../models/user.model';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { ProfileImage } from '../profile-image/profile-image';
import { Comment } from '../../models/comment.model';

@Component({
  selector: 'app-post-comment',
  standalone: true,
  imports: [MatIconModule, TimeAgoPipe, ProfileImage, RouterModule],
  templateUrl: './post-comment.html',
  styleUrls: ['./post-comment.scss'],
})
export class PostComment implements OnInit {
  @Input({ required: true }) comment!: Comment;
  @Output() delete = new EventEmitter<string>();

  liveCreator = signal<User | null>(null);

  constructor(private auth: Auth, private usersApi: Users, private destroyRef: DestroyRef) {}

  ngOnInit(): void {
    const creatorId = this.creatorId();
    if (!creatorId) return;

    this.usersApi
      .getUser(creatorId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => this.liveCreator.set(user),
        error: () => this.liveCreator.set(null),
      });
  }

  creatorId(): string | null {
    const c = this.comment.creator;
    if (!c) return null;
    return typeof c === 'string' ? c : c.creatorId;
  }

  creatorName(): string {
    return this.liveCreator()?.fullName ?? 'User';
  }

  photoUrl(): string | null {
    return this.liveCreator()?.profilePhoto ?? null;
  }

  isOwner(): boolean {
    const me = this.auth.getUserId();
    const creatorId = this.creatorId();
    return !!me && !!creatorId && me === creatorId;
  }

  onDelete(): void {
    this.delete.emit(this.comment._id);
  }
}

import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { Auth } from '../../services/auth/auth';
import { User } from '../../models/user.model';
import { ProfileImage } from '../profile-image/profile-image';
import { FollowerRef } from '../../models/api-user.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [MatIconModule, RouterModule, ProfileImage],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss'],
})
export class UserProfile {
  @Input() busy = false;

  private readonly _user = signal<User | null>(null);

  @Input({ required: true })
  set user(value: User) {
    this._user.set(value);
  }
  get user(): User {
    return this._user() as User;
  }

  @Output() editProfile = new EventEmitter<void>();
  @Output() followToggle = new EventEmitter<void>();
  @Output() avatarChange = new EventEmitter<File>();

  avatarTouched = signal(false);
  pendingAvatar = signal<File | null>(null);

  constructor(public auth: Auth) {}

  readonly isOwnProfile = computed(() => {
    const u = this._user();
    const me = this.auth.getUserId();
    return !!u && !!me && me === u._id;
  });

  readonly followerCount = computed(() => this._user()?.followers?.length ?? 0);

  readonly followingCount = computed(() => this._user()?.following?.length ?? 0);

  private followerId(ref: FollowerRef): string {
    return typeof ref === 'string' ? ref : ref._id;
  }

  readonly followsUser = computed(() => {
    const u = this._user();
    const me = this.auth.getUserId();
    if (!u || !me) return false;

    const followers = u.followers ?? [];
    return followers.map((f) => this.followerId(f)).includes(me);
  });

  onEditProfile(): void {
    this.editProfile.emit();
  }

  onFollowToggle(): void {
    this.followToggle.emit();
  }

  onPickAvatar(event: Event): void {
    const file = this.getFirstFile(event.target);
    if (!file) return;

    this.pendingAvatar.set(file);
    this.avatarTouched.set(true);
  }

  submitAvatar(): void {
    const file = this.pendingAvatar();
    if (!file) return;

    this.avatarChange.emit(file);
    this.avatarTouched.set(false);
    this.pendingAvatar.set(null);
  }

  private getFirstFile(target: EventTarget | null): File | null {
    const input = target as HTMLInputElement | null;
    return input?.files?.[0] ?? null;
  }
}

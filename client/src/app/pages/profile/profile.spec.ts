import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { vi } from 'vitest';

import { Profile } from './profile';
import { Users } from '../../services/users/users';
import { Auth } from '../../services/auth/auth';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  template: '',
})
class UserProfileStub {
  @Input({ required: true }) user: any;
  @Output() editProfile = new EventEmitter<void>();
  @Output() followToggle = new EventEmitter<void>();
  @Output() avatarChange = new EventEmitter<File>();
}

@Component({
  selector: 'app-feed-skeleton',
  standalone: true,
  template: '',
})
class FeedSkeletonStub {
  @Input() count = 0;
}

@Component({
  selector: 'app-feeds',
  standalone: true,
  template: '',
})
class FeedsStub {
  @Input() posts: any[] = [];
  @Output() postUpdated = new EventEmitter<any>();
  @Output() postDeleted = new EventEmitter<string>();
}

describe('Profile', () => {
  const paramMap$ = new BehaviorSubject<ParamMap>(convertToParamMap({ id: 'u1' }));

  const usersApi = {
    getUser: vi.fn(),
    getUserPosts: vi.fn(),
    followUnfollow: vi.fn(),
    changeAvatar: vi.fn(),
  };

  const auth = {
    getUserId: vi.fn(),
  };

  const afterClosed$ = new Subject<any>();
  const dialog = {
    open: vi.fn().mockReturnValue({
      afterClosed: () => afterClosed$.asObservable(),
    }),
  };

  beforeEach(async () => {
    paramMap$.next(convertToParamMap({ id: 'u1' }));
    usersApi.getUser.mockReset();
    usersApi.getUserPosts.mockReset();
    usersApi.followUnfollow.mockReset();
    usersApi.changeAvatar.mockReset();
    auth.getUserId.mockReset();
    dialog.open.mockClear();

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: Users, useValue: usersApi },
        { provide: Auth, useValue: auth },
        { provide: MatDialog, useValue: dialog },
      ],
    })
      .overrideComponent(Profile, {
        set: {
          imports: [CommonModule, UserProfileStub, FeedSkeletonStub, FeedsStub],
        },
      })

      .compileComponents();
  });

  it('should load profile when route param id is set', () => {
    usersApi.getUser.mockReturnValue(of({ _id: 'u1', fullName: 'Alice', followers: [] }));
    usersApi.getUserPosts.mockReturnValue(of({ posts: [{ _id: 'p1' }, { _id: 'p2' }] }));

    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;

    expect(usersApi.getUser).toHaveBeenCalledWith('u1');
    expect(usersApi.getUserPosts).toHaveBeenCalledWith('u1');

    expect(cmp.user()?._id).toBe('u1');
    expect(cmp.posts().length).toBe(2);
    expect(cmp.loading()).toBe(false);
    expect(cmp.error()).toBe('');
  });

  it('should set error if loading user fails', () => {
    usersApi.getUser.mockReturnValue(throwError(() => ({ error: { message: 'User boom' } })));
    usersApi.getUserPosts.mockReturnValue(of({ posts: [] }));

    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;

    expect(cmp.error()).toBe('User boom');
    expect(cmp.loading()).toBe(false);
  });

  it('should set error and stop loading if loading posts fails', () => {
    usersApi.getUser.mockReturnValue(of({ _id: 'u1', fullName: 'Alice', followers: [] }));
    usersApi.getUserPosts.mockReturnValue(throwError(() => ({ error: { message: 'Posts boom' } })));

    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;

    expect(cmp.error()).toBe('Posts boom');
    expect(cmp.loading()).toBe(false);
  });

  it('should follow/unfollow and update followers list', () => {
    usersApi.getUser.mockReturnValue(of({ _id: 'u1', fullName: 'Alice', followers: [] }));
    usersApi.getUserPosts.mockReturnValue(of({ posts: [] }));

    auth.getUserId.mockReturnValue('me');
    usersApi.followUnfollow.mockReturnValue(of(void 0));

    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;

    cmp.toggleFollow();

    expect(usersApi.followUnfollow).toHaveBeenCalledWith('u1');
    expect(cmp.user()?.followers).toEqual(['me']);
    expect(cmp.busy()).toBe(false);

    cmp.toggleFollow();

    expect(cmp.user()?.followers).toEqual([]);
    expect(cmp.busy()).toBe(false);
  });

  it('should open edit profile dialog and update user after close', () => {
    const initial = { _id: 'u1', fullName: 'Alice', bio: '', followers: [] };
    usersApi.getUser.mockReturnValue(of(initial));
    usersApi.getUserPosts.mockReturnValue(of({ posts: [] }));

    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;

    cmp.openEditProfile();

    expect(dialog.open).toHaveBeenCalled();

    const updated = { ...initial, fullName: 'Alice Updated' };
    afterClosed$.next(updated);

    expect(cmp.user()?.fullName).toBe('Alice Updated');
  });

  it('should update and delete posts in local state', () => {
    usersApi.getUser.mockReturnValue(of({ _id: 'u1', fullName: 'Alice', followers: [] }));
    usersApi.getUserPosts.mockReturnValue(
      of({
        posts: [
          { _id: 'p1', body: 'a' },
          { _id: 'p2', body: 'b' },
        ],
      }),
    );

    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;

    cmp.onPostUpdated({ _id: 'p2', body: 'updated' } as any);
    expect(cmp.posts().find((p: any) => p._id === 'p2')?.body).toBe('updated');

    cmp.onPostDeleted('p1');
    expect(cmp.posts().map((p: any) => p._id)).toEqual(['p2']);
  });

  it('should reload when route param changes', () => {
    usersApi.getUser.mockReturnValue(of({ _id: 'u1', fullName: 'Alice', followers: [] }));
    usersApi.getUserPosts.mockReturnValue(of({ posts: [] }));

    const fixture = TestBed.createComponent(Profile);
    fixture.detectChanges();

    expect(usersApi.getUser).toHaveBeenCalledWith('u1');

    usersApi.getUser.mockClear();
    usersApi.getUserPosts.mockClear();

    usersApi.getUser.mockReturnValue(of({ _id: 'u2', fullName: 'Bob', followers: [] }));
    usersApi.getUserPosts.mockReturnValue(of({ posts: [] }));

    paramMap$.next(convertToParamMap({ id: 'u2' }));
    fixture.detectChanges();

    expect(usersApi.getUser).toHaveBeenCalledWith('u2');
    expect(usersApi.getUserPosts).toHaveBeenCalledWith('u2');
  });
});

import { TestBed } from '@angular/core/testing';
import { PostComment } from './post-comment';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';

class AuthStub {
  getUserId() {
    return 'me';
  }
}

class UsersStub {
  getUser(id: string) {
    return of({
      _id: id,
      fullName: 'Comment Author',
      profilePhoto: 'https://example.com/avatar.png',
    } as any);
  }
  setBookmarked(postId: string, bookmarked: boolean): void {}
}

const BASE_COMMENT = {
  _id: 'c1',
  comment: 'Nice post!',
  createdAt: new Date().toISOString(),
  creator: 'author1',
};

describe('PostComment', () => {
  let auth: AuthStub;
  let users: UsersStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostComment],
      providers: [
        provideRouter([]),
        { provide: Auth, useClass: AuthStub },
        { provide: Users, useClass: UsersStub },
      ],
    }).compileComponents();

    auth = TestBed.inject(Auth) as unknown as AuthStub;
    users = TestBed.inject(Users) as unknown as UsersStub;

    vi.spyOn(auth, 'getUserId');
    vi.spyOn(users, 'getUser');
  });

  function createComponent(commentOverrides: Partial<typeof BASE_COMMENT> = {}) {
    const fixture = TestBed.createComponent(PostComment);
    fixture.componentInstance.comment = { ...BASE_COMMENT, ...commentOverrides } as any;
    fixture.detectChanges();
    return fixture;
  }

  it('should load creator user on init', () => {
    const fixture = createComponent({ creator: 'author1' });

    expect(users.getUser).toHaveBeenCalledWith('author1');
    expect(fixture.componentInstance.liveCreator()?._id).toBe('author1');
  });

  it('should not load creator when creatorId is missing', () => {
    const fixture = createComponent({ creator: null as any });

    expect(users.getUser).not.toHaveBeenCalled();
    expect(fixture.componentInstance.liveCreator()).toBeNull();
  });

  it('creatorName should return user name when loaded', () => {
    const fixture = createComponent();

    expect(fixture.componentInstance.creatorName()).toBe('Comment Author');
  });

  it('creatorName should fall back to "User"', () => {
    vi.spyOn(users, 'getUser').mockReturnValueOnce(throwError(() => new Error('fail')));

    const fixture = createComponent();

    expect(fixture.componentInstance.creatorName()).toBe('User');
  });

  it('photoUrl should return profile photo when available', () => {
    const fixture = createComponent();

    expect(fixture.componentInstance.photoUrl()).toContain('avatar.png');
  });

  it('isOwner should return false when current user is not creator', () => {
    const fixture = createComponent({ creator: 'someone-else' });

    expect(fixture.componentInstance.isOwner()).toBe(false);
  });

  it('isOwner should return true when current user is creator', () => {
    const fixture = createComponent({ creator: 'me' });

    expect(fixture.componentInstance.isOwner()).toBe(true);
  });

  it('should emit delete event with comment id', () => {
    const fixture = createComponent();
    const deleteSpy = vi.spyOn(fixture.componentInstance.delete, 'emit');

    fixture.componentInstance.onDelete();

    expect(deleteSpy).toHaveBeenCalledWith('c1');
  });
});

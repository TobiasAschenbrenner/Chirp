import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { UserProfile } from './user-profile';
import { Auth } from '../../services/auth/auth';

describe('UserProfile', () => {
  const auth = {
    getUserId: vi.fn(),
  };

  const makeUser = (overrides: any = {}) => ({
    _id: 'u1',
    fullName: 'Alice',
    bio: '',
    profilePhoto: 'http://example.com/p.png',
    followers: [],
    following: [],
    ...overrides,
  });

  beforeEach(async () => {
    auth.getUserId.mockReset();

    await TestBed.configureTestingModule({
      imports: [UserProfile],
      providers: [{ provide: Auth, useValue: auth }],
    }).compileComponents();
  });

  it('should detect own profile when auth userId matches', () => {
    auth.getUserId.mockReturnValue('u1');

    const fixture = TestBed.createComponent(UserProfile);
    fixture.componentInstance.user = makeUser({ _id: 'u1' });
    fixture.detectChanges();

    expect(fixture.componentInstance.isOwnProfile()).toBe(true);

    const editBtn = fixture.debugElement.query(By.css('button.btn'));
    expect(editBtn.nativeElement.textContent).toContain('Edit profile');
  });

  it('should show follow button when viewing someone else', () => {
    auth.getUserId.mockReturnValue('me');

    const fixture = TestBed.createComponent(UserProfile);
    fixture.componentInstance.user = makeUser({ _id: 'u1' });
    fixture.detectChanges();

    expect(fixture.componentInstance.isOwnProfile()).toBe(false);

    const followBtn = fixture.debugElement.query(By.css('button.btn.dark'));
    expect(followBtn).toBeTruthy();
    expect(followBtn.nativeElement.textContent).toContain('Follow');
  });

  it('followsUser should return true when current user is in followers (string ids)', () => {
    auth.getUserId.mockReturnValue('me');

    const fixture = TestBed.createComponent(UserProfile);
    fixture.componentInstance.user = makeUser({ followers: ['me'] });
    fixture.detectChanges();

    expect(fixture.componentInstance.followsUser()).toBe(true);

    const followBtn = fixture.debugElement.query(By.css('button.btn.dark'));
    expect(followBtn.nativeElement.textContent).toContain('Unfollow');
  });

  it('followsUser should return true when current user is in followers (object ids)', () => {
    auth.getUserId.mockReturnValue('me');

    const fixture = TestBed.createComponent(UserProfile);
    fixture.componentInstance.user = makeUser({ followers: [{ _id: 'me' }] });
    fixture.detectChanges();

    expect(fixture.componentInstance.followsUser()).toBe(true);
  });

  it('should compute follower/following counts', () => {
    auth.getUserId.mockReturnValue('me');

    const fixture = TestBed.createComponent(UserProfile);
    fixture.componentInstance.user = makeUser({
      followers: ['a', 'b', 'c'],
      following: ['x'],
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.followerCount()).toBe(3);
    expect(fixture.componentInstance.followingCount()).toBe(1);
  });

  it('should emit editProfile when clicking edit', () => {
    auth.getUserId.mockReturnValue('u1');

    const fixture = TestBed.createComponent(UserProfile);
    fixture.componentInstance.user = makeUser({ _id: 'u1' });
    fixture.detectChanges();

    const spy = vi.fn();
    fixture.componentInstance.editProfile.subscribe(spy);

    const btn = fixture.debugElement.query(By.css('button.btn'));
    btn.nativeElement.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should emit followToggle when clicking follow/unfollow', () => {
    auth.getUserId.mockReturnValue('me');

    const fixture = TestBed.createComponent(UserProfile);
    fixture.componentInstance.user = makeUser({ _id: 'u1', followers: [] });
    fixture.detectChanges();

    const spy = vi.fn();
    fixture.componentInstance.followToggle.subscribe(spy);

    const btn = fixture.debugElement.query(By.css('button.btn.dark'));
    btn.nativeElement.click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should stage avatar on file pick and emit avatarChange on submit', () => {
    auth.getUserId.mockReturnValue('u1');

    const fixture = TestBed.createComponent(UserProfile);
    fixture.componentInstance.user = makeUser({ _id: 'u1' });
    fixture.detectChanges();

    const file = new File(['x'], 'avatar.png', { type: 'image/png' });

    fixture.componentInstance.onPickAvatar({
      target: { files: [file] },
    } as any);

    expect(fixture.componentInstance.avatarTouched()).toBe(true);
    expect(fixture.componentInstance.pendingAvatar()).toBe(file);

    const spy = vi.fn();
    fixture.componentInstance.avatarChange.subscribe(spy);

    fixture.componentInstance.submitAvatar();

    expect(spy).toHaveBeenCalledWith(file);
    expect(fixture.componentInstance.avatarTouched()).toBe(false);
    expect(fixture.componentInstance.pendingAvatar()).toBe(null);
  });

  it('should not submit avatar when no file selected', () => {
    auth.getUserId.mockReturnValue('u1');

    const fixture = TestBed.createComponent(UserProfile);
    fixture.componentInstance.user = makeUser({ _id: 'u1' });
    fixture.detectChanges();

    const spy = vi.fn();
    fixture.componentInstance.avatarChange.subscribe(spy);

    fixture.componentInstance.submitAvatar();
    expect(spy).not.toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { LikePost } from './like-post';
import { Posts } from '../../services/posts/posts';
import { Auth } from '../../services/auth/auth';

describe('LikePost', () => {
  const postsApi = {
    likePost: vi.fn(),
  };

  const auth = {
    getUserId: vi.fn(),
  };

  const makePost = (overrides: any = {}) => ({
    _id: 'p1',
    body: 'hello',
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
    creator: 'u1',
    ...overrides,
  });

  beforeEach(async () => {
    postsApi.likePost.mockReset();
    auth.getUserId.mockReset();

    await TestBed.configureTestingModule({
      imports: [LikePost],
      providers: [
        { provide: Posts, useValue: postsApi },
        { provide: Auth, useValue: auth },
      ],
    }).compileComponents();
  });

  it('should render likes count', () => {
    auth.getUserId.mockReturnValue('me');

    const fixture = TestBed.createComponent(LikePost);
    fixture.componentInstance.post = makePost({ likes: ['a', 'b', 'c'] });
    fixture.detectChanges();

    const count = fixture.debugElement.query(By.css('.likeButton__count'));
    expect(count.nativeElement.textContent.trim()).toBe('3');
  });

  it('liked() should be true when current user is in likes', () => {
    auth.getUserId.mockReturnValue('me');

    const fixture = TestBed.createComponent(LikePost);
    fixture.componentInstance.post = makePost({ likes: ['me'] });
    fixture.detectChanges();

    expect(fixture.componentInstance.liked()).toBe(true);

    const btn = fixture.debugElement.query(By.css('button.likeButton'));
    expect(btn.nativeElement.classList.contains('liked')).toBe(true);

    const icon = fixture.debugElement.query(By.css('mat-icon'));
    expect(icon.nativeElement.textContent).toContain('favorite');
  });

  it('liked() should be false when no userId', () => {
    auth.getUserId.mockReturnValue(null);

    const fixture = TestBed.createComponent(LikePost);
    fixture.componentInstance.post = makePost({ likes: ['someone'] });
    fixture.detectChanges();

    expect(fixture.componentInstance.liked()).toBe(false);
  });

  it('should call likePost and emit postUpdated on success', () => {
    auth.getUserId.mockReturnValue('me');

    const updated = makePost({ _id: 'p1', likes: ['me'] });
    postsApi.likePost.mockReturnValue(of(updated));

    const fixture = TestBed.createComponent(LikePost);
    fixture.componentInstance.post = makePost({ _id: 'p1', likes: [] });

    const emitted: any[] = [];
    fixture.componentInstance.postUpdated.subscribe((p) => emitted.push(p));

    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('button.likeButton'));
    btn.nativeElement.click();

    expect(postsApi.likePost).toHaveBeenCalledTimes(1);
    expect(postsApi.likePost).toHaveBeenCalledWith('p1');
    expect(emitted).toEqual([updated]);
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('should not call likePost when post has no _id', () => {
    auth.getUserId.mockReturnValue('me');

    const fixture = TestBed.createComponent(LikePost);
    fixture.componentInstance.post = makePost({ _id: undefined });
    fixture.detectChanges();

    fixture.componentInstance.toggleLike();

    expect(postsApi.likePost).not.toHaveBeenCalled();
  });

  it('should not call likePost while busy', () => {
    auth.getUserId.mockReturnValue('me');

    postsApi.likePost.mockReturnValue(of(makePost()));

    const fixture = TestBed.createComponent(LikePost);
    fixture.componentInstance.post = makePost({ _id: 'p1' });
    fixture.detectChanges();

    fixture.componentInstance.busy.set(true);
    fixture.componentInstance.toggleLike();

    expect(postsApi.likePost).not.toHaveBeenCalled();
  });

  it('should reset busy and not emit on error', () => {
    auth.getUserId.mockReturnValue('me');

    postsApi.likePost.mockReturnValue(throwError(() => ({ error: { message: 'Boom' } })));

    const fixture = TestBed.createComponent(LikePost);
    fixture.componentInstance.post = makePost({ _id: 'p1' });

    const emitted = vi.fn();
    fixture.componentInstance.postUpdated.subscribe(emitted);

    fixture.detectChanges();
    fixture.componentInstance.toggleLike();

    expect(postsApi.likePost).toHaveBeenCalledTimes(1);
    expect(emitted).not.toHaveBeenCalled();
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('should disable button when busy', () => {
    auth.getUserId.mockReturnValue('me');

    const fixture = TestBed.createComponent(LikePost);
    fixture.componentInstance.post = makePost({ _id: 'p1' });
    fixture.detectChanges();

    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();

    const btn = fixture.debugElement.query(By.css('button.likeButton'));
    expect(btn.nativeElement.disabled).toBe(true);
  });
});

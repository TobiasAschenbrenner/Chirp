import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { BookmarkPost } from './bookmark-post';
import { Posts } from '../../services/posts/posts';
import { Users } from '../../services/users/users';

describe('BookmarkPost', () => {
  let fixture: ComponentFixture<BookmarkPost>;
  let component: BookmarkPost;

  let postsApi: { toggleBookmark: ReturnType<typeof vi.fn> };
  let usersApi: { setBookmarked: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    postsApi = {
      toggleBookmark: vi.fn(),
    };

    usersApi = {
      setBookmarked: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BookmarkPost],
      providers: [
        { provide: Posts, useValue: postsApi },
        { provide: Users, useValue: usersApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookmarkPost);
    component = fixture.componentInstance;

    component.postId = 'p1';
  });

  function getButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('button.bookmarkButton')).nativeElement;
  }

  function getIconText(): string {
    const iconEl = fixture.debugElement.query(By.css('mat-icon'))?.nativeElement as HTMLElement;
    return (iconEl?.textContent ?? '').trim();
  }

  it('should render as not bookmarked by default', () => {
    fixture.detectChanges();

    const btn = getButton();
    expect(btn.classList.contains('bookmarked')).toBe(false);
    expect(getIconText()).toBe('bookmark_border');
  });

  it('should reflect initialBookmarked=true in UI', () => {
    component.initialBookmarked = true;

    fixture.detectChanges();

    const btn = getButton();
    expect(btn.classList.contains('bookmarked')).toBe(true);
    expect(getIconText()).toBe('bookmark');
  });

  it('toggleBookmark: should set bookmarked=true, call setBookmarked, and emit changed when API returns id included', () => {
    postsApi.toggleBookmark.mockReturnValue(of({ bookmarks: ['p1', 'p2'] }));

    const emitted: any[] = [];
    component.changed.subscribe((e) => emitted.push(e));

    fixture.detectChanges();

    component.toggleBookmark();

    expect(postsApi.toggleBookmark).toHaveBeenCalledWith('p1');
    expect(component.bookmarked()).toBe(true);
    expect(usersApi.setBookmarked).toHaveBeenCalledWith('p1', true);
    expect(emitted).toEqual([{ postId: 'p1', bookmarked: true }]);

    fixture.detectChanges();
    expect(getButton().classList.contains('bookmarked')).toBe(true);
    expect(getIconText()).toBe('bookmark');
  });

  it('toggleBookmark: should set bookmarked=false, call setBookmarked, and emit changed when API returns id not included', () => {
    component.initialBookmarked = true;

    postsApi.toggleBookmark.mockReturnValue(of({ bookmarks: ['p2'] }));

    const emitted: any[] = [];
    component.changed.subscribe((e) => emitted.push(e));

    fixture.detectChanges();

    component.toggleBookmark();

    expect(postsApi.toggleBookmark).toHaveBeenCalledWith('p1');
    expect(component.bookmarked()).toBe(false);
    expect(usersApi.setBookmarked).toHaveBeenCalledWith('p1', false);
    expect(emitted).toEqual([{ postId: 'p1', bookmarked: false }]);

    fixture.detectChanges();
    expect(getButton().classList.contains('bookmarked')).toBe(false);
    expect(getIconText()).toBe('bookmark_border');
  });

  it('should reset busy state without changing the bookmark when the API fails', () => {
    const error = new Error('Boom');
    postsApi.toggleBookmark.mockReturnValue(throwError(() => error));

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const changedSpy = vi.fn();
    component.changed.subscribe(changedSpy);

    fixture.detectChanges();
    component.toggleBookmark();

    expect(postsApi.toggleBookmark).toHaveBeenCalledWith('p1');
    expect(component.busy()).toBe(false);
    expect(component.bookmarked()).toBe(false);
    expect(usersApi.setBookmarked).not.toHaveBeenCalled();
    expect(changedSpy).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

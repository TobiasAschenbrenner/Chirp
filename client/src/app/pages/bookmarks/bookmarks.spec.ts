import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { vi } from 'vitest';

import { Bookmarks } from './bookmarks';
import { Users } from '../../services/users/users';
import { Post } from '../../models/post.model';

describe('Bookmarks', () => {
  let fixture: ComponentFixture<Bookmarks>;
  let component: Bookmarks;

  let usersApi: {
    getBookmarks: ReturnType<typeof vi.fn>;
    isBookmarked: ReturnType<typeof vi.fn>;
    setBookmarked: ReturnType<typeof vi.fn>;
  };

  const mockPosts: Post[] = [
    { _id: 'p1', body: 'Post 1', likes: [], comments: [] } as any,
    { _id: 'p2', body: 'Post 2', likes: [], comments: [] } as any,
  ];

  beforeEach(async () => {
    usersApi = {
      getBookmarks: vi.fn(),
      isBookmarked: vi.fn(() => false),
      setBookmarked: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Bookmarks, RouterTestingModule],
      providers: [{ provide: Users, useValue: usersApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(Bookmarks);
    component = fixture.componentInstance;
  });

  it('should load bookmarks on init', () => {
    usersApi.getBookmarks.mockReturnValue(of({ bookmarks: mockPosts }));

    fixture.detectChanges();

    expect(usersApi.getBookmarks).toHaveBeenCalled();
    expect(component.bookmarks()).toEqual(mockPosts);
    expect(component.loading()).toBe(false);
  });

  it('should set error when loading bookmarks fails', () => {
    usersApi.getBookmarks.mockReturnValue(throwError(() => ({ error: { message: 'Boom' } })));

    fixture.detectChanges();

    expect(component.error()).toBe('Boom');
    expect(component.loading()).toBe(false);
  });

  it('should compute bookmarkedIds correctly', () => {
    usersApi.getBookmarks.mockReturnValue(of({ bookmarks: mockPosts }));

    fixture.detectChanges();

    const ids = component.bookmarkedIds();
    expect(ids.has('p1')).toBe(true);
    expect(ids.has('p2')).toBe(true);
  });

  it('should update a post when onPostUpdated is called', () => {
    usersApi.getBookmarks.mockReturnValue(of({ bookmarks: mockPosts }));
    fixture.detectChanges();

    const updated: Post = { ...mockPosts[0], body: 'Updated' } as any;

    component.onPostUpdated(updated);

    expect(component.bookmarks()[0].body).toBe('Updated');
  });

  it('should remove a post when onPostDeleted is called', () => {
    usersApi.getBookmarks.mockReturnValue(of({ bookmarks: mockPosts }));
    fixture.detectChanges();

    component.onPostDeleted('p1');

    expect(component.bookmarks().length).toBe(1);
    expect(component.bookmarks()[0]._id).toBe('p2');
  });

  it('should remove a post when bookmarkChanged emits unbookmarked', () => {
    usersApi.getBookmarks.mockReturnValue(of({ bookmarks: mockPosts }));
    fixture.detectChanges();

    component.onBookmarkChanged({ postId: 'p1', bookmarked: false });

    expect(component.bookmarks().length).toBe(1);
    expect(component.bookmarks()[0]._id).toBe('p2');
  });

  it('should not remove post when bookmarkChanged emits bookmarked=true', () => {
    usersApi.getBookmarks.mockReturnValue(of({ bookmarks: mockPosts }));
    fixture.detectChanges();

    component.onBookmarkChanged({ postId: 'p1', bookmarked: true });

    expect(component.bookmarks().length).toBe(2);
  });
});

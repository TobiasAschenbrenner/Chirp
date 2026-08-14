import { TestBed } from '@angular/core/testing';
import { Feed } from './feed';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { of } from 'rxjs';

import { Users } from '../../services/users/users';
import { Posts } from '../../services/posts/posts';
import { Auth } from '../../services/auth/auth';
import type { Post } from '../../models/post.model';

class UsersStub {
  getUser(id: string) {
    return of({
      _id: id,
      fullName: 'Author User',
      profilePhoto: null,
    } as any);
  }
  setBookmarked(postId: string, bookmarked: boolean): void {}
}

class PostsStub {
  editPost(id: string, body: string) {
    return of({ _id: id, body } as any);
  }

  deletePost(id: string) {
    return of(void 0);
  }
}

class AuthStub {
  getUserId() {
    return 'me';
  }
}

const BASE_POST: Post = {
  _id: 'p1',
  body: 'Hello world',
  creator: 'author1',
  comments: [],
  createdAt: new Date().toISOString(),
} as any;

describe('Feed', () => {
  let users: UsersStub;
  let posts: PostsStub;
  let auth: AuthStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Feed],
      providers: [
        provideRouter([]),
        { provide: Users, useClass: UsersStub },
        { provide: Posts, useClass: PostsStub },
        { provide: Auth, useClass: AuthStub },
      ],
    }).compileComponents();

    users = TestBed.inject(Users) as unknown as UsersStub;
    posts = TestBed.inject(Posts) as unknown as PostsStub;
    auth = TestBed.inject(Auth) as unknown as AuthStub;

    vi.spyOn(users, 'getUser');
    vi.spyOn(posts, 'editPost');
    vi.spyOn(posts, 'deletePost');
    vi.spyOn(auth, 'getUserId');
  });

  function createComponent(postOverrides: Partial<Post> = {}) {
    const fixture = TestBed.createComponent(Feed);
    fixture.componentInstance.post = { ...BASE_POST, ...postOverrides };
    fixture.detectChanges();
    return fixture;
  }

  it('should load creator on init', () => {
    const fixture = createComponent({ creator: 'author1' });

    expect(users.getUser).toHaveBeenCalledWith('author1');
    expect(fixture.componentInstance.creator()?._id).toBe('author1');
  });

  it('should use a populated creator without loading it again', () => {
    const populatedCreator = {
      _id: 'author1',
      fullName: 'Embedded Author',
      profilePhoto: 'https://example.com/avatar.png',
    };

    const fixture = createComponent({ creator: populatedCreator });

    expect(users.getUser).not.toHaveBeenCalled();
    expect(fixture.componentInstance.creator()).toEqual(populatedCreator);
  });

  it('should not load creator when post has no creator', () => {
    const fixture = createComponent({ creator: null as any });

    expect(users.getUser).not.toHaveBeenCalled();
    expect(fixture.componentInstance.creator()).toBeNull();
  });

  it('isOwner should return true when current user is the author', () => {
    const fixture = createComponent({ creator: 'me' });

    expect(fixture.componentInstance.isOwner()).toBe(true);
  });

  it('isOwner should return false when current user is not the author', () => {
    const fixture = createComponent({ creator: 'other' });

    expect(fixture.componentInstance.isOwner()).toBe(false);
  });

  it('should open edit modal when startEdit is called', () => {
    const fixture = createComponent();

    fixture.componentInstance.startEdit();

    expect(fixture.componentInstance.editModalOpen()).toBe(true);
  });

  it('should emit postUpdated and close modal on modal update', () => {
    const fixture = createComponent();
    const updatedSpy = vi.spyOn(fixture.componentInstance.postUpdated, 'emit');

    const updatedPost = { ...BASE_POST, body: 'Updated' } as any;

    fixture.componentInstance.onModalUpdated(updatedPost);

    expect(updatedSpy).toHaveBeenCalledWith(updatedPost);
    expect(fixture.componentInstance.editModalOpen()).toBe(false);
  });

  it('should save edit and emit updated post', () => {
    const fixture = createComponent();
    const updatedSpy = vi.spyOn(fixture.componentInstance.postUpdated, 'emit');

    fixture.componentInstance.editBody.set('New body');
    fixture.componentInstance.saveEdit();

    expect(posts.editPost).toHaveBeenCalledWith('p1', 'New body');
    expect(updatedSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('should not save edit when body is empty', () => {
    const fixture = createComponent();

    fixture.componentInstance.editBody.set('   ');
    fixture.componentInstance.saveEdit();

    expect(posts.editPost).not.toHaveBeenCalled();
  });

  it('should delete post and emit postDeleted', () => {
    const fixture = createComponent();
    const deletedSpy = vi.spyOn(fixture.componentInstance.postDeleted, 'emit');

    fixture.componentInstance.deletePost();

    expect(posts.deletePost).toHaveBeenCalledWith('p1');
    expect(deletedSpy).toHaveBeenCalledWith('p1');
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('should emit bookmarkChanged', () => {
    const fixture = createComponent();
    const bookmarkSpy = vi.spyOn(fixture.componentInstance.bookmarkChanged, 'emit');

    fixture.componentInstance.onBookmarkChanged({ postId: 'p1', bookmarked: true });

    expect(bookmarkSpy).toHaveBeenCalledWith({ postId: 'p1', bookmarked: true });
  });
});

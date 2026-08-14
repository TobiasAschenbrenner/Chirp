import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Users } from './users';
import { User } from '../../models/user.model';
import { Post } from '../../models/post.model';

describe('Users service', () => {
  let service: Users;
  let httpMock: HttpTestingController;

  const u1: User = {
    _id: 'u1',
    fullName: 'Tobi',
    email: 'tobi@example.com',
    profilePhoto: 'img.jpg',
    bio: 'hi',
    followers: [],
    following: [],
    posts: [],
  };

  const posts: Post[] = [
    { _id: 'p1', creator: 'u1', body: 'Post 1', image: '', likes: [], comments: [] } as any,
    { _id: 'p2', creator: 'u1', body: 'Post 2', image: '', likes: [], comments: [] } as any,
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Users],
    });

    service = TestBed.inject(Users);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getUser (with cache)', () => {
    it('should request user by id', () => {
      service.getUser('u1').subscribe((u) => expect(u._id).toBe('u1'));

      const req = httpMock.expectOne('/api/users/u1');
      expect(req.request.method).toBe('GET');
      req.flush(u1);
    });

    it('should cache the observable and not issue a second HTTP request', () => {
      let a: User | undefined;
      let b: User | undefined;

      service.getUser('u1').subscribe((u) => (a = u));
      service.getUser('u1').subscribe((u) => (b = u));

      const req = httpMock.expectOne('/api/users/u1');
      expect(req.request.method).toBe('GET');
      req.flush(u1);

      expect(a?._id).toBe('u1');
      expect(b?._id).toBe('u1');
    });
  });

  it('should search users with default paging', () => {
    service.searchUsers('to').subscribe((res) => {
      expect(res.users.length).toBe(1);
      expect(res.total).toBe(1);
      expect(res.page).toBe(1);
      expect(res.limit).toBe(8);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/users/search');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('q')).toBe('to');
    expect(req.request.params.get('limit')).toBe('8');
    expect(req.request.params.get('page')).toBe('1');

    req.flush({ users: [u1], total: 1, page: 1, limit: 8 });
  });

  it('should get user posts', () => {
    service.getUserPosts('u1').subscribe((res) => {
      expect(res.posts.length).toBe(2);
      expect(res.posts[0]._id).toBe('p1');
    });

    const req = httpMock.expectOne('/api/users/u1/posts');
    expect(req.request.method).toBe('GET');
    req.flush({ posts });
  });

  it('should follow/unfollow a user', () => {
    service.followUnfollow('u2').subscribe((u) => {
      expect(u._id).toBe('u1');
    });

    const req = httpMock.expectOne('/api/users/u2/follow-unfollow');
    expect(req.request.method).toBe('GET');
    req.flush(u1);
  });

  it('should change avatar via FormData', () => {
    const file = new File(['x'], 'avatar.png', { type: 'image/png' });

    service.changeAvatar(file).subscribe((u) => {
      expect(u._id).toBe('u1');
    });

    const req = httpMock.expectOne('/api/users/avatar');
    expect(req.request.method).toBe('POST');

    const body = req.request.body as FormData;
    expect(body instanceof FormData).toBe(true);
    expect(body.get('avatar')).toBe(file);

    req.flush(u1);
  });

  it('should update profile via PATCH', () => {
    service.updateProfile({ fullName: 'New Name', bio: 'New bio' }).subscribe((u) => {
      expect(u._id).toBe('u1');
    });

    const req = httpMock.expectOne('/api/users/edit');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ fullName: 'New Name', bio: 'New bio' });

    req.flush(u1);
  });

  it('should get bookmarks', () => {
    service.getBookmarks().subscribe((res) => {
      expect(res.bookmarks.length).toBe(2);
      expect(res.bookmarks[0]._id).toBe('p1');
    });

    const req = httpMock.expectOne('/api/users/bookmarks');
    expect(req.request.method).toBe('GET');

    req.flush({ bookmarks: posts });
  });

  describe('bookmark state', () => {
    it('loadBookmarks should update bookmarkIds signal and return Set', () => {
      let returned: Set<string> | undefined;

      service.loadBookmarks().subscribe((ids) => (returned = ids));

      const req = httpMock.expectOne('/api/users/bookmarks');
      expect(req.request.method).toBe('GET');
      req.flush({ bookmarks: posts });

      expect(returned).toBeInstanceOf(Set);
      expect(returned?.has('p1')).toBe(true);
      expect(returned?.has('p2')).toBe(true);

      const internal = service.bookmarkIds();
      expect(internal.has('p1')).toBe(true);
      expect(internal.has('p2')).toBe(true);
    });

    it('isBookmarked should reflect bookmarkIds signal', () => {
      expect(service.isBookmarked('p1')).toBe(false);

      service.setBookmarked('p1', true);
      expect(service.isBookmarked('p1')).toBe(true);

      service.setBookmarked('p1', false);
      expect(service.isBookmarked('p1')).toBe(false);
    });

    it('setBookmarked should add/remove ids without mutating the previous Set', () => {
      const before = service.bookmarkIds();

      service.setBookmarked('p1', true);
      const afterAdd = service.bookmarkIds();

      expect(before).not.toBe(afterAdd);
      expect(afterAdd.has('p1')).toBe(true);

      service.setBookmarked('p1', false);
      const afterRemove = service.bookmarkIds();

      expect(afterRemove.has('p1')).toBe(false);
    });
  });
});

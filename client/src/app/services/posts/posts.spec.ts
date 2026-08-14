import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { Posts } from './posts';
import { Post } from '../../models/post.model';

describe('Posts service', () => {
  let service: Posts;
  let httpMock: HttpTestingController;

  const mockPost: Post = {
    _id: 'p1',
    creator: 'u1',
    body: 'Hello world',
    image: '',
    likes: [],
    comments: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Posts],
    });

    service = TestBed.inject(Posts);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create a post', () => {
    const formData = new FormData();
    formData.set('body', 'Hello');

    service.createPost(formData).subscribe((post) => {
      expect(post).toEqual(mockPost);
    });

    const req = httpMock.expectOne('/api/posts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(formData);

    req.flush(mockPost);
  });

  it('should get all posts', () => {
    service.getPosts().subscribe((posts) => {
      expect(posts.length).toBe(1);
      expect(posts[0]._id).toBe('p1');
    });

    const req = httpMock.expectOne('/api/posts');
    expect(req.request.method).toBe('GET');

    req.flush([mockPost]);
  });

  it('should get following posts', () => {
    service.getFollowingPosts().subscribe((posts) => {
      expect(posts.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/posts/following');
    expect(req.request.method).toBe('GET');

    req.flush([mockPost]);
  });

  it('should like a post', () => {
    service.likePost('p1').subscribe((post) => {
      expect(post._id).toBe('p1');
    });

    const req = httpMock.expectOne('/api/posts/p1/like');
    expect(req.request.method).toBe('GET');

    req.flush(mockPost);
  });

  it('should get a single post', () => {
    service.getPost('p1').subscribe((post) => {
      expect(post._id).toBe('p1');
    });

    const req = httpMock.expectOne('/api/posts/p1');
    expect(req.request.method).toBe('GET');

    req.flush(mockPost);
  });

  it('should delete a post', () => {
    service.deletePost('p1').subscribe((res) => {
      expect(res.message).toBe('deleted');
    });

    const req = httpMock.expectOne('/api/posts/p1');
    expect(req.request.method).toBe('DELETE');

    req.flush({ message: 'deleted' });
  });

  it('should edit a post', () => {
    service.editPost('p1', 'Updated').subscribe((post) => {
      expect(post.body).toBe('Hello world');
    });

    const req = httpMock.expectOne('/api/posts/p1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ body: 'Updated' });

    req.flush(mockPost);
  });

  it('should toggle bookmark', () => {
    service.toggleBookmark('p1').subscribe((res) => {
      expect(res.bookmarks).toContain('p1');
    });

    const req = httpMock.expectOne('/api/posts/p1/bookmarks');
    expect(req.request.method).toBe('GET');

    req.flush({ bookmarks: ['p1'] });
  });
});

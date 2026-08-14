import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { SinglePost } from './single-post';
import { Posts } from '../../services/posts/posts';
import { Comments as CommentsApi } from '../../services/comments/comments';
import { Users } from '../../services/users/users';

describe('SinglePost', () => {
  let postsApi: { getPost: ReturnType<typeof vi.fn> };
  let commentsApi: {
    createComment: ReturnType<typeof vi.fn>;
    deleteComment: ReturnType<typeof vi.fn>;
  };
  let usersApi: {
    isBookmarked: ReturnType<typeof vi.fn>;
    setBookmarked: ReturnType<typeof vi.fn>;
    getUser: ReturnType<typeof vi.fn>;
  };

  const mockPost = {
    _id: 'p1',
    body: 'Hello world',
    createdAt: '2024-01-01',
    creator: { _id: 'u1', fullName: 'Alice', profilePhoto: null },
    comments: [],
  };

  beforeEach(async () => {
    postsApi = {
      getPost: vi.fn(),
    };

    commentsApi = {
      createComment: vi.fn(),
      deleteComment: vi.fn(),
    };

    usersApi = {
      isBookmarked: vi.fn().mockReturnValue(false),
      setBookmarked: vi.fn(),
      getUser: vi.fn().mockReturnValue(of({ _id: 'u1', fullName: 'User', profilePhoto: null })),
    };

    await TestBed.configureTestingModule({
      imports: [SinglePost],
      providers: [
        { provide: Posts, useValue: postsApi },
        { provide: CommentsApi, useValue: commentsApi },
        { provide: Users, useValue: usersApi },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn().mockReturnValue('p1'),
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should load post on init', () => {
    postsApi.getPost.mockReturnValue(of(mockPost));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(postsApi.getPost).toHaveBeenCalledWith('p1');
    expect(cmp.post()?._id).toBe('p1');
  });

  it('should set error when loading fails', () => {
    postsApi.getPost.mockReturnValue(throwError(() => ({ error: { message: 'Boom' } })));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(cmp.error()).toBe('Boom');
  });

  it('should create a comment and prepend it', () => {
    postsApi.getPost.mockReturnValue(of(mockPost));

    const newComment = {
      _id: 'c1',
      comment: 'Nice post',
      creator: 'u1',
    };

    commentsApi.createComment.mockReturnValue(of(newComment));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    cmp.commentText.set('Nice post');
    cmp.createComment();

    expect(commentsApi.createComment).toHaveBeenCalledWith('p1', 'Nice post');
    expect(cmp.comments()[0]._id).toBe('c1');
    expect(cmp.commentText()).toBe('');
  });

  it('should delete a comment', () => {
    postsApi.getPost.mockReturnValue(
      of({ ...mockPost, comments: [{ _id: 'c1', comment: 'Hi', creator: 'u1' }] }),
    );

    commentsApi.deleteComment.mockReturnValue(of(null));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    cmp.deleteComment('c1');

    expect(commentsApi.deleteComment).toHaveBeenCalledWith('c1');
    expect(cmp.comments().length).toBe(0);
  });

  it('should not create comments longer than 500 characters', () => {
    postsApi.getPost.mockReturnValue(of(mockPost));
    commentsApi.createComment.mockReturnValue(
      of({
        _id: 'c1',
        comment: 'Comment',
        creator: 'u1',
      }),
    );

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.commentText.set('a'.repeat(501));
    component.createComment();

    expect(commentsApi.createComment).not.toHaveBeenCalled();
  });

  it('should expose the comment limit through the textarea', () => {
    postsApi.getPost.mockReturnValue(of(mockPost));

    const fixture = TestBed.createComponent(SinglePost);
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector(
      'textarea[name="comment"]',
    ) as HTMLTextAreaElement;

    expect(textarea.maxLength).toBe(500);
  });
});

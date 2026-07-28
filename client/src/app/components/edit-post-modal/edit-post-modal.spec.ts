import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { By } from '@angular/platform-browser';

import { EditPostModal } from './edit-post-modal';
import { Posts } from '../../services/posts/posts';
import { Post } from '../../models/post.model';

describe('EditPostModal', () => {
  let postsApi: { getPost: any; editPost: any };

  const makePost = (overrides: Partial<Post> = {}): Post =>
    ({
      _id: 'p1',
      body: 'Hello',
      ...overrides,
    }) as Post;

  function createFixture(postOverrides: Partial<Post> = {}) {
    const fixture = TestBed.createComponent(EditPostModal);

    fixture.componentRef.setInput('postId', 'p1');
    postsApi.getPost.mockReturnValue(of(makePost(postOverrides)));

    fixture.detectChanges();

    return fixture;
  }

  beforeEach(() => {
    postsApi = {
      getPost: vi.fn(),
      editPost: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [EditPostModal],
      providers: [{ provide: Posts, useValue: postsApi }],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost()));

    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load post on init and set body', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost({ body: 'Loaded body' })));

    fixture.detectChanges();

    expect(postsApi.getPost).toHaveBeenCalledWith('p1');
    expect(fixture.componentInstance.body()).toBe('Loaded body');
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe('');
  });

  it('should set error when loading post fails', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(throwError(() => ({ error: { message: 'Boom' } })));

    fixture.detectChanges();

    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe('Boom');
  });

  it('should update body signal when typing in textarea', () => {
    const fixture = createFixture();

    const textareaDe = fixture.debugElement.query(By.css('textarea'));
    textareaDe.triggerEventHandler('ngModelChange', 'New text');

    fixture.detectChanges();
    expect(fixture.componentInstance.body()).toBe('New text');
  });

  it('submit should not call editPost when body is empty/whitespace', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost({ body: '' })));
    postsApi.editPost.mockReturnValue(of(makePost({ body: 'x' })));

    fixture.detectChanges();

    fixture.componentInstance.body.set('   ');
    fixture.componentInstance.submit();

    expect(postsApi.editPost).not.toHaveBeenCalled();
  });

  it('submit should emit updated and closed on success', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost({ body: 'Old' })));
    postsApi.editPost.mockReturnValue(of(makePost({ body: 'Updated' })));

    const updatedSpy = vi.fn();
    const closedSpy = vi.fn();

    fixture.detectChanges();

    fixture.componentInstance.updated.subscribe(updatedSpy);
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.componentInstance.body.set('  Updated  ');
    fixture.componentInstance.submit();

    expect(postsApi.editPost).toHaveBeenCalledWith('p1', 'Updated');
    expect(updatedSpy).toHaveBeenCalledTimes(1);
    expect(updatedSpy.mock.calls[0][0].body).toBe('Updated');
    expect(closedSpy).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('submit should set error on failure and not emit closed', () => {
    const fixture = TestBed.createComponent(EditPostModal);
    fixture.componentRef.setInput('postId', 'p1');

    postsApi.getPost.mockReturnValue(of(makePost({ body: 'Old' })));
    postsApi.editPost.mockReturnValue(throwError(() => ({ error: { message: 'Nope' } })));

    const updatedSpy = vi.fn();
    const closedSpy = vi.fn();

    fixture.detectChanges();

    fixture.componentInstance.updated.subscribe(updatedSpy);
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.componentInstance.body.set('Updated');
    fixture.componentInstance.submit();

    expect(updatedSpy).not.toHaveBeenCalled();
    expect(closedSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.error()).toBe('Nope');
  });

  it('close should emit closed when called without event', () => {
    const fixture = createFixture();

    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    fixture.componentInstance.close();

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit closed when clicking backdrop', () => {
    const fixture = createFixture();

    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    const backdrop = document.createElement('form');

    fixture.componentInstance.close({
      target: backdrop,
      currentTarget: backdrop,
    } as unknown as MouseEvent);

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit closed when clicking inside modal content', () => {
    const fixture = createFixture();

    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    const backdrop = document.createElement('form');
    const inner = document.createElement('div');

    fixture.componentInstance.close({
      target: inner,
      currentTarget: backdrop,
    } as unknown as MouseEvent);

    expect(closedSpy).toHaveBeenCalledTimes(0);
  });

  it('close should NOT emit closed when click target is not the backdrop', () => {
    const fixture = createFixture();

    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);

    const el = document.createElement('div');

    fixture.componentInstance.close({
      target: el,
      currentTarget: document.createElement('form'),
    } as unknown as MouseEvent);

    expect(closedSpy).not.toHaveBeenCalled();
  });

  it('submit should not update posts longer than 500 characters', () => {
    const fixture = createFixture();

    postsApi.editPost.mockReturnValue(of(makePost({ body: 'Updated' })));

    fixture.componentInstance.body.set('a'.repeat(501));
    fixture.componentInstance.submit();

    expect(postsApi.editPost).not.toHaveBeenCalled();
  });

  it('should expose the post limit through the textarea', () => {
    const fixture = createFixture();

    const textarea = fixture.nativeElement.querySelector(
      'textarea[name="body"]',
    ) as HTMLTextAreaElement;

    expect(textarea.maxLength).toBe(500);
  });
});

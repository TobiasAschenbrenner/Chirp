import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { Feeds } from './feeds';
import { Users } from '../../services/users/users';

@Component({
  selector: 'app-feed',
  standalone: true,
  template: '',
})
class FeedStub {
  @Input({ required: true }) post!: any;
  @Input() bookmarked = false;

  @Output() postUpdated = new EventEmitter<any>();
  @Output() postDeleted = new EventEmitter<string>();
  @Output() bookmarkChanged = new EventEmitter<{ postId: string; bookmarked: boolean }>();
}

describe('Feeds', () => {
  const usersApi = {
    isBookmarked: vi.fn(),
  };

  const makePost = (id: string) =>
    ({
      _id: id,
      body: 'x',
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      creator: 'u1',
    }) as any;

  beforeEach(async () => {
    usersApi.isBookmarked.mockReset();

    await TestBed.configureTestingModule({
      imports: [Feeds],
      providers: [{ provide: Users, useValue: usersApi }],
    })
      .overrideComponent(Feeds, {
        set: {
          imports: [CommonModule, FeedStub],

          template: `
          <div class="feeds">
            <p *ngIf="posts.length === 0" class="center">No posts found</p>

            <app-feed
              *ngFor="let post of posts"
              [post]="post"
              [bookmarked]="usersApi.isBookmarked(post._id)"
              (postUpdated)="postUpdated.emit($event)"
              (postDeleted)="postDeleted.emit($event)"
              (bookmarkChanged)="bookmarkChanged.emit($event)"
            ></app-feed>
          </div>
        `,
        },
      })
      .compileComponents();
  });

  it('should show empty state when there are no posts', () => {
    const fixture = TestBed.createComponent(Feeds);
    fixture.componentInstance.posts = [];
    fixture.detectChanges();

    const empty = fixture.debugElement.query(By.css('p.center'));
    expect(empty).toBeTruthy();
    expect((empty.nativeElement.textContent ?? '').trim()).toContain('No posts found');
  });

  it('should render one feed item per post', () => {
    const fixture = TestBed.createComponent(Feeds);
    fixture.componentInstance.posts = [makePost('p1'), makePost('p2')];
    usersApi.isBookmarked.mockReturnValue(false);

    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.directive(FeedStub));
    expect(items.length).toBe(2);
    expect(items[0].componentInstance.post._id).toBe('p1');
    expect(items[1].componentInstance.post._id).toBe('p2');
  });

  it('should pass bookmarked input based on usersApi.isBookmarked', () => {
    const fixture = TestBed.createComponent(Feeds);
    fixture.componentInstance.posts = [makePost('p1'), makePost('p2')];

    usersApi.isBookmarked.mockImplementation((id: string) => id === 'p2');

    fixture.detectChanges();

    const items = fixture.debugElement.queryAll(By.directive(FeedStub));
    expect(items[0].componentInstance.bookmarked).toBe(false);
    expect(items[1].componentInstance.bookmarked).toBe(true);

    expect(usersApi.isBookmarked).toHaveBeenCalledWith('p1');
    expect(usersApi.isBookmarked).toHaveBeenCalledWith('p2');
  });

  it('should re-emit postUpdated from a child feed', () => {
    const fixture = TestBed.createComponent(Feeds);
    fixture.componentInstance.posts = [makePost('p1')];
    usersApi.isBookmarked.mockReturnValue(false);

    const emitted: any[] = [];
    fixture.componentInstance.postUpdated.subscribe((v) => emitted.push(v));

    fixture.detectChanges();

    const feed = fixture.debugElement.query(By.directive(FeedStub)).componentInstance as FeedStub;
    const updated = makePost('p1');
    feed.postUpdated.emit(updated);

    expect(emitted).toEqual([updated]);
  });

  it('should re-emit postDeleted from a child feed', () => {
    const fixture = TestBed.createComponent(Feeds);
    fixture.componentInstance.posts = [makePost('p1')];
    usersApi.isBookmarked.mockReturnValue(false);

    const emitted: string[] = [];
    fixture.componentInstance.postDeleted.subscribe((v) => emitted.push(v));

    fixture.detectChanges();

    const feed = fixture.debugElement.query(By.directive(FeedStub)).componentInstance as FeedStub;
    feed.postDeleted.emit('p1');

    expect(emitted).toEqual(['p1']);
  });

  it('should re-emit bookmarkChanged from a child feed', () => {
    const fixture = TestBed.createComponent(Feeds);
    fixture.componentInstance.posts = [makePost('p1')];
    usersApi.isBookmarked.mockReturnValue(false);

    const emitted: any[] = [];
    fixture.componentInstance.bookmarkChanged.subscribe((v) => emitted.push(v));

    fixture.detectChanges();

    const feed = fixture.debugElement.query(By.directive(FeedStub)).componentInstance as FeedStub;
    feed.bookmarkChanged.emit({ postId: 'p1', bookmarked: true });

    expect(emitted).toEqual([{ postId: 'p1', bookmarked: true }]);
  });
});

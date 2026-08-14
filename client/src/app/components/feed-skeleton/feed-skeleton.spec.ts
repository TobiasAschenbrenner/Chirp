import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedSkeleton } from './feed-skeleton';

describe('FeedSkeleton', () => {
  let fixture: ComponentFixture<FeedSkeleton>;
  let component: FeedSkeleton;

  function countArticles(): number {
    return fixture.nativeElement.querySelectorAll('article.feed.skeleton').length;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedSkeleton);
    component = fixture.componentInstance;
  });

  it('should render default count (3)', () => {
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    expect(countArticles()).toBe(3);
  });

  it('should render the provided count (5)', () => {
    fixture.componentRef.setInput('count', 5);
    fixture.detectChanges();
    expect(countArticles()).toBe(5);
  });

  it('should update items when count changes', () => {
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    expect(component.items).toEqual([0, 1, 2]);

    fixture.componentRef.setInput('count', 1);
    fixture.detectChanges();
    expect(component.items).toEqual([0]);
  });

  it('should handle count = 0', () => {
    fixture.componentRef.setInput('count', 0);
    fixture.detectChanges();
    expect(component.items).toEqual([]);
    expect(countArticles()).toBe(0);
  });
});

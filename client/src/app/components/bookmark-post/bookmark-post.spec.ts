import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarkPost } from './bookmark-post';

describe('BookmarkPost', () => {
  let component: BookmarkPost;
  let fixture: ComponentFixture<BookmarkPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookmarkPost]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookmarkPost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

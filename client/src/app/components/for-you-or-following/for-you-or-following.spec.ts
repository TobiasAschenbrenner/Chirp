import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ForYouOrFollowing } from './for-you-or-following';

describe('ForYouOrFollowing', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForYouOrFollowing],
    }).compileComponents();
  });

  it('should render two buttons', () => {
    const fixture = TestBed.createComponent(ForYouOrFollowing);
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(2);
    expect(buttons[0].nativeElement.textContent).toContain('For you');
    expect(buttons[1].nativeElement.textContent).toContain('Following');
  });

  it('should mark "For you" active by default', () => {
    const fixture = TestBed.createComponent(ForYouOrFollowing);
    fixture.detectChanges();

    const [forYouBtn, followingBtn] = fixture.debugElement.queryAll(By.css('button'));

    expect(forYouBtn.nativeElement.classList.contains('active')).toBe(true);
    expect(followingBtn.nativeElement.classList.contains('active')).toBe(false);
  });

  it('should mark "Following" active when input is set', () => {
    const fixture = TestBed.createComponent(ForYouOrFollowing);
    fixture.componentInstance.active = 'following';
    fixture.detectChanges();

    const [forYouBtn, followingBtn] = fixture.debugElement.queryAll(By.css('button'));

    expect(forYouBtn.nativeElement.classList.contains('active')).toBe(false);
    expect(followingBtn.nativeElement.classList.contains('active')).toBe(true);
  });

  it('should emit "foryou" when clicking "For you"', () => {
    const fixture = TestBed.createComponent(ForYouOrFollowing);

    fixture.componentInstance.active = 'following';
    const emitted: Array<'foryou' | 'following'> = [];
    fixture.componentInstance.modeChange.subscribe((v) => emitted.push(v));

    fixture.detectChanges();

    const [forYouBtn] = fixture.debugElement.queryAll(By.css('button'));
    forYouBtn.nativeElement.click();

    expect(emitted).toEqual(['foryou']);
  });

  it('should emit "following" when clicking "Following"', () => {
    const fixture = TestBed.createComponent(ForYouOrFollowing);

    const emitted: Array<'foryou' | 'following'> = [];
    fixture.componentInstance.modeChange.subscribe((v) => emitted.push(v));

    fixture.detectChanges();

    const [, followingBtn] = fixture.debugElement.queryAll(By.css('button'));
    followingBtn.nativeElement.click();

    expect(emitted).toEqual(['following']);
  });

  it('should not emit when clicking the active mode', () => {
    const fixture = TestBed.createComponent(ForYouOrFollowing);

    const emitted: Array<'foryou' | 'following'> = [];
    fixture.componentInstance.modeChange.subscribe((v) => emitted.push(v));

    fixture.detectChanges();

    const [forYouBtn] = fixture.debugElement.queryAll(By.css('button'));
    forYouBtn.nativeElement.click();

    expect(emitted).toEqual([]);
  });
});

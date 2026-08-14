import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ProfileImage } from './profile-image';

describe('ProfileImage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileImage],
    }).compileComponents();
  });

  it('should render image with provided src', () => {
    const fixture = TestBed.createComponent(ProfileImage);
    fixture.componentInstance.src = 'http://example.com/avatar.jpg';
    fixture.detectChanges();

    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeTruthy();
    expect(img.nativeElement.src).toContain('avatar.jpg');
  });

  it('should apply default size class (md)', () => {
    const fixture = TestBed.createComponent(ProfileImage);
    fixture.componentInstance.src = 'avatar.png';
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.profile-image'));
    expect(wrapper.nativeElement.classList.contains('md')).toBe(true);
  });

  it('should apply provided size class', () => {
    const fixture = TestBed.createComponent(ProfileImage);
    fixture.componentInstance.src = 'avatar.png';
    fixture.componentInstance.size = 'lg';
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.profile-image'));
    expect(wrapper.nativeElement.classList.contains('lg')).toBe(true);
  });

  it('should update size class when input changes', () => {
    const fixture = TestBed.createComponent(ProfileImage);

    fixture.componentRef.setInput('src', 'avatar.png');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    let wrapper = fixture.debugElement.query(By.css('.profile-image'));
    expect(wrapper.nativeElement.classList.contains('sm')).toBe(true);

    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    wrapper = fixture.debugElement.query(By.css('.profile-image'));
    expect(wrapper.nativeElement.classList.contains('lg')).toBe(true);
  });
});

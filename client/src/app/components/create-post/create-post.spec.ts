import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { CreatePost } from './create-post';
import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';

class AuthMock {
  getUserId = vi.fn(() => null as string | null);
}

class UsersMock {
  getUser = vi.fn(() =>
    of({
      _id: 'u1',
      fullName: 'Test User',
      profilePhoto: 'https://example.com/p.jpg',
    } as any),
  );
}

describe('CreatePost', () => {
  let fixture: ComponentFixture<CreatePost>;
  let component: CreatePost;

  let auth: AuthMock;
  let usersApi: UsersMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePost],
      providers: [
        { provide: Auth, useClass: AuthMock },
        { provide: Users, useClass: UsersMock },
      ],
    }).compileComponents();

    auth = TestBed.inject(Auth) as unknown as AuthMock;
    usersApi = TestBed.inject(Users) as unknown as UsersMock;

    fixture = TestBed.createComponent(CreatePost);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show error message when error input is set', () => {
    component.error = 'Boom';
    fixture.detectChanges();

    const p: HTMLElement | null = fixture.nativeElement.querySelector('.createPost__error-message');
    expect(p).toBeTruthy();
    expect(p?.textContent).toContain('Boom');
  });

  it('should disable textarea and submit button when loading is true', async () => {
    const fixture = TestBed.createComponent(CreatePost);
    const component = fixture.componentInstance;

    component.loading = true;
    component.body = 'hello';

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector(
      'textarea[name="body"]',
    ) as HTMLTextAreaElement;

    const submitBtn = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    expect(textarea.disabled).toBe(true);
    expect(submitBtn.disabled).toBe(true);
  });

  it('ngOnInit: should call usersApi.getUser when auth.getUserId returns id', () => {
    auth.getUserId.mockReturnValue('u1');
    fixture.detectChanges();

    expect(usersApi.getUser).toHaveBeenCalledTimes(1);
    expect(usersApi.getUser).toHaveBeenCalledWith('u1');
  });

  it('ngOnInit: should not call usersApi.getUser when auth.getUserId returns null', () => {
    auth.getUserId.mockReturnValue(null);
    fixture.detectChanges();

    expect(usersApi.getUser).not.toHaveBeenCalled();
  });

  it('should render profile image when loaded user has profilePhoto', () => {
    auth.getUserId.mockReturnValue('u1');
    usersApi.getUser.mockReturnValue(
      of({
        _id: 'u1',
        fullName: 'Test User',
        profilePhoto: 'https://example.com/p.jpg',
      } as any),
    );

    fixture.detectChanges();

    const img: HTMLImageElement | null =
      fixture.nativeElement.querySelector('app-profile-image img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('https://example.com/p.jpg');
  });

  it('onFileChange: should set image when a file is selected', () => {
    fixture.detectChanges();

    const file = new File(['hello'], 'pic.png', { type: 'image/png' });
    const input = fixture.nativeElement.querySelector('#image') as HTMLInputElement;

    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));

    expect(component.image).toBe(file);
  });

  it('onFileChange: should set image to null when no file selected', () => {
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#image') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [] });
    input.dispatchEvent(new Event('change'));

    expect(component.image).toBeNull();
  });

  it('onSubmit: should not emit when loading is true', () => {
    fixture.detectChanges();

    component.loading = true;
    component.body = 'Hello';
    const emitSpy = vi.spyOn(component.createPost, 'emit');

    component.onSubmit();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('onSubmit: should not emit when body is empty/whitespace', () => {
    fixture.detectChanges();

    component.loading = false;
    component.body = '   ';
    const emitSpy = vi.spyOn(component.createPost, 'emit');

    component.onSubmit();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('onSubmit: should emit FormData with body and reset fields (no image)', () => {
    fixture.detectChanges();

    component.loading = false;
    component.body = 'Hello world';
    component.image = null;

    const emitSpy = vi.spyOn(component.createPost, 'emit');

    component.onSubmit();

    expect(emitSpy).toHaveBeenCalledTimes(1);

    const fd = emitSpy.mock.calls[0][0] as FormData;
    expect(fd).toBeInstanceOf(FormData);
    expect(fd.get('body')).toBe('Hello world');
    expect(fd.get('image')).toBeNull();

    expect(component.body).toBe('');
    expect(component.image).toBeNull();
  });

  it('onSubmit: should emit FormData with body + image and reset fields', () => {
    fixture.detectChanges();

    const file = new File(['img'], 'pic.jpg', { type: 'image/jpeg' });

    component.loading = false;
    component.body = 'Hello';
    component.image = file;

    const emitSpy = vi.spyOn(component.createPost, 'emit');

    component.onSubmit();

    expect(emitSpy).toHaveBeenCalledTimes(1);

    const fd = emitSpy.mock.calls[0][0] as FormData;
    expect(fd.get('body')).toBe('Hello');
    expect(fd.get('image')).toBe(file);

    expect(component.body).toBe('');
    expect(component.image).toBeNull();
  });

  it('ngOnInit: should swallow getUser error (no crash)', () => {
    auth.getUserId.mockReturnValue('u1');
    usersApi.getUser.mockReturnValue(throwError(() => ({ error: { message: 'Boom' } })));

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(usersApi.getUser).toHaveBeenCalledWith('u1');
  });
});

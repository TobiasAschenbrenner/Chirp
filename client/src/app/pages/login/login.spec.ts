import { TestBed } from '@angular/core/testing';
import { Login } from './login';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Auth } from '../../services/auth/auth';
import { Users } from '../../services/users/users';

class AuthStub {
  login(credentials: { email: string; password: string }) {
    return of(void 0);
  }
}

class UsersStub {
  loadBookmarks() {
    return of(void 0);
  }
  setBookmarked(postId: string, bookmarked: boolean): void {}
}

describe('Login', () => {
  let auth: AuthStub;
  let users: UsersStub;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: Auth, useClass: AuthStub },
        { provide: Users, useClass: UsersStub },
      ],
    }).compileComponents();

    auth = TestBed.inject(Auth) as unknown as AuthStub;
    users = TestBed.inject(Users) as unknown as UsersStub;
    router = TestBed.inject(Router);

    vi.spyOn(auth, 'login');
    vi.spyOn(users, 'loadBookmarks');
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  function createComponent() {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    return fixture;
  }

  it('should toggle password visibility', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    expect(component.showPassword).toBe(false);

    component.togglePassword();
    expect(component.showPassword).toBe(true);

    component.togglePassword();
    expect(component.showPassword).toBe(false);
  });

  it('should show error when email or password is missing', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.loginData.email = '';
    component.loginData.password = '';

    component.loginUser();

    expect(component.error).toBe('Email and password are required.');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('should login and navigate to /home on success', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.loginData.email = 'test@example.com';
    component.loginData.password = 'secret';

    component.loginUser();

    expect(auth.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret',
    });

    expect(users.loadBookmarks).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.loading).toBe(false);
  });

  it('should still navigate to /home if loading bookmarks fails', () => {
    vi.spyOn(users, 'loadBookmarks').mockReturnValueOnce(throwError(() => new Error('fail')));

    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.loginData.email = 'test@example.com';
    component.loginData.password = 'secret';

    component.loginUser();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
    expect(component.loading).toBe(false);
  });

  it('should show error message when login fails', () => {
    vi.spyOn(auth, 'login').mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'Invalid credentials' },
      })),
    );

    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.loginData.email = 'test@example.com';
    component.loginData.password = 'wrong';

    component.loginUser();

    expect(component.error).toBe('Invalid credentials');
    expect(component.loading).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

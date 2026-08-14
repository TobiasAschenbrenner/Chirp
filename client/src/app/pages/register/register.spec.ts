import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Auth } from '../../services/auth/auth';
import { Register } from './register';

const VALID_PASSWORD = 'climb safely 42';

class AuthStub {
  register(payload: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    return of(void 0);
  }
}

describe('Register', () => {
  let auth: AuthStub;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: Auth, useClass: AuthStub }],
    }).compileComponents();

    auth = TestBed.inject(Auth) as unknown as AuthStub;
    router = TestBed.inject(Router);

    vi.spyOn(auth, 'register');
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  function createComponent() {
    const fixture = TestBed.createComponent(Register);
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

  it('should show error if any field is missing', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: '',
      email: 'test@example.com',
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    };

    component.registerUser();

    expect(component.error).toBe('Please fill out all fields.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should show error if passwords do not match', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: 'Tobi',
      email: 'test@example.com',
      password: VALID_PASSWORD,
      confirmPassword: 'climb safely 43',
    };

    component.registerUser();

    expect(component.error).toBe('Passwords do not match.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should reject registration passwords shorter than 15 characters', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const password = 'a'.repeat(14);

    component.userData = {
      fullName: 'Tobi',
      email: 'test@example.com',
      password,
      confirmPassword: password,
    };

    component.registerUser();

    expect(component.error).toBe('Password must be at least 15 characters.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should reject passwords exceeding 72 UTF-8 bytes', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const password = '🔐'.repeat(19);

    expect(new TextEncoder().encode(password).length).toBeGreaterThan(72);

    component.userData = {
      fullName: 'Tobi',
      email: 'test@example.com',
      password,
      confirmPassword: password,
    };

    component.registerUser();

    expect(component.error).toBe('Password must not exceed 72 UTF-8 bytes.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should reject full names longer than 80 characters', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: 'a'.repeat(81),
      email: 'test@example.com',
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    };

    component.registerUser();

    expect(component.error).toBe('Full name must be 80 characters or fewer.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should reject invalid email addresses', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: 'Tobi',
      email: 'not-an-email',
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    };

    component.registerUser();

    expect(component.error).toBe('Please enter a valid email address.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should reject email addresses longer than 254 characters', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: 'Tobi',
      email: `${'a'.repeat(243)}@example.com`,
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    };

    component.registerUser();

    expect(component.error).toBe('Email must be 254 characters or fewer.');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('should register and navigate to /login on success', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: '  Tobi  ',
      email: '  test@example.com  ',
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    };

    component.registerUser();

    expect(auth.register).toHaveBeenCalledWith({
      fullName: 'Tobi',
      email: 'test@example.com',
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    });

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(component.loading).toBe(false);
  });

  it('should show error message when registration fails', () => {
    vi.spyOn(auth, 'register').mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'Email already exists' },
      })),
    );

    const fixture = createComponent();
    const component = fixture.componentInstance;

    component.userData = {
      fullName: 'Tobi',
      email: 'test@example.com',
      password: VALID_PASSWORD,
      confirmPassword: VALID_PASSWORD,
    };

    component.registerUser();

    expect(component.error).toBe('Email already exists');
    expect(component.loading).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

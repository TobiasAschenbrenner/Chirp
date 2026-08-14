import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { App } from './app';
import { Auth } from './services/auth/auth';

describe('App', () => {
  let authMock: {
    isLoggedIn: ReturnType<typeof vi.fn>;
    getUserId: ReturnType<typeof vi.fn>;
    getToken?: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authMock = {
      isLoggedIn: vi.fn(),
      getUserId: vi.fn(),
      getToken: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [App, RouterTestingModule],
      providers: [{ provide: Auth, useValue: authMock }],
    }).compileComponents();
  });

  it('should render navbar when logged in', () => {
    authMock.isLoggedIn.mockReturnValue(true);
    authMock.getUserId.mockReturnValue('u1');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-navbar')).toBeTruthy();
  });

  it('should not render navbar when not logged in', () => {
    authMock.isLoggedIn.mockReturnValue(false);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-navbar')).toBeFalsy();
  });

  it('should always render router-outlet container', () => {
    authMock.isLoggedIn.mockReturnValue(false);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});

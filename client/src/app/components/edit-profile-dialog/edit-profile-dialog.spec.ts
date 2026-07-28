import { TestBed } from '@angular/core/testing';
import { EditProfileDialog } from './edit-profile-dialog';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { Users } from '../../services/users/users';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

class UsersStub {
  updateProfile(data: { fullName: string; bio: string }) {
    return of({
      _id: 'u1',
      fullName: data.fullName,
      bio: data.bio,
    } as any);
  }
  setBookmarked(postId: string, bookmarked: boolean): void {}
}

class MatDialogRefStub {
  close = vi.fn();
}

const DIALOG_DATA = {
  user: {
    _id: 'u1',
    fullName: 'Tobi',
    bio: 'Climber & dev',
  },
};

describe('EditProfileDialog', () => {
  let users: UsersStub;
  let dialogRef: MatDialogRefStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileDialog],
      providers: [
        { provide: Users, useClass: UsersStub },
        { provide: MatDialogRef, useClass: MatDialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: DIALOG_DATA },
      ],
    }).compileComponents();

    users = TestBed.inject(Users) as unknown as UsersStub;
    dialogRef = TestBed.inject(MatDialogRef) as unknown as MatDialogRefStub;

    vi.spyOn(users, 'updateProfile');
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize form with user data', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    expect(component.form.value).toEqual({
      fullName: 'Tobi',
      bio: 'Climber & dev',
    });
  });

  it('should close dialog when close() is called', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    component.close();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should submit form and close dialog with updated user', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    component.form.setValue({
      fullName: 'Updated Name',
      bio: 'Updated bio',
    });

    component.submit();

    expect(users.updateProfile).toHaveBeenCalledWith({
      fullName: 'Updated Name',
      bio: 'Updated bio',
    });

    expect(dialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Updated Name',
        bio: 'Updated bio',
      }),
    );

    expect(component.saving).toBe(true);
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    component.form.controls.fullName.setValue('');
    component.submit();

    expect(users.updateProfile).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('should show error message when update fails', () => {
    vi.spyOn(users, 'updateProfile').mockReturnValueOnce(
      throwError(() => ({
        error: { message: 'Update failed' },
      })),
    );

    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    component.submit();

    expect(component.error).toBe('Update failed');
    expect(component.saving).toBe(false);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('should accept full names containing up to 80 characters', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    component.form.controls.fullName.setValue('a'.repeat(80));

    expect(component.form.controls.fullName.valid).toBe(true);
  });

  it('should reject full names longer than 80 characters', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    component.form.controls.fullName.setValue('a'.repeat(81));

    expect(component.form.controls.fullName.valid).toBe(false);
  });

  it('should reject whitespace-only full names', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    component.form.controls.fullName.setValue('   ');

    expect(component.form.controls.fullName.valid).toBe(false);
  });

  it('should reject biographies longer than 160 characters', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    component.form.controls.bio.setValue('a'.repeat(161));

    expect(component.form.controls.bio.valid).toBe(false);
  });

  it('should trim profile data before submitting', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    const component = fixture.componentInstance;

    component.form.setValue({
      fullName: '  Updated Name  ',
      bio: '  Updated biography  ',
    });

    component.submit();

    expect(users.updateProfile).toHaveBeenCalledWith({
      fullName: 'Updated Name',
      bio: 'Updated biography',
    });
  });

  it('should expose the backend limits through HTML attributes', () => {
    const fixture = TestBed.createComponent(EditProfileDialog);
    fixture.detectChanges();

    const fullNameInput = fixture.nativeElement.querySelector(
      'input[formControlName="fullName"]',
    ) as HTMLInputElement;

    const bioTextarea = fixture.nativeElement.querySelector(
      'textarea[formControlName="bio"]',
    ) as HTMLTextAreaElement;

    expect(fullNameInput.maxLength).toBe(80);
    expect(bioTextarea.maxLength).toBe(160);
  });
});

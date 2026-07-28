import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { User } from '../../models/user.model';
import { Users } from '../../services/users/users';
import { VALIDATION_LIMITS } from '../../utils/input-validation';

type EditProfileData = {
  user: User;
};

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile-dialog.html',
  styleUrls: ['./edit-profile-dialog.scss'],
})
export class EditProfileDialog {
  private fb = inject(FormBuilder);
  private usersApi = inject(Users);
  private dialogRef = inject(MatDialogRef<EditProfileDialog>);
  private data = inject<EditProfileData>(MAT_DIALOG_DATA);

  readonly validationLimits = VALIDATION_LIMITS;

  saving = false;
  error = '';

  form = this.fb.nonNullable.group({
    fullName: [
      this.data.user.fullName || '',
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(VALIDATION_LIMITS.fullName),
      ],
    ],
    bio: [this.data.user.bio || '', [Validators.maxLength(VALIDATION_LIMITS.biography)]],
  });

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const { fullName, bio } = this.form.getRawValue();

    const profileData = {
      fullName: fullName.trim(),
      bio: bio.trim(),
    };

    this.saving = true;
    this.error = '';

    this.usersApi.updateProfile(profileData).subscribe({
      next: (updated) => this.dialogRef.close(updated),
      error: (err) => {
        console.log(err);
        this.error = err?.error?.message || 'Failed to update profile.';
        this.saving = false;
      },
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { UserState } from '../store/reducers/user.reducer';
import { selectUser } from '../store/selectors/user.selectors';
import { User } from '../shared/model/user.model';
import { UserService } from '../shared/service/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss']
})
export class ProfileSettingsComponent implements OnInit {
  profileForm: FormGroup;
  currentUser$: Observable<User | undefined>;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private store: Store<UserState>,
    private userService: UserService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      handle: ['', [Validators.maxLength(64), Validators.pattern(/^[a-zA-Z0-9-]*$/)]],
      bio: ['', [Validators.maxLength(280)]]
    });
  }

  ngOnInit(): void {
    this.currentUser$ = this.store.select(selectUser);
    
    this.currentUser$.subscribe(user => {
      if (user) {
        this.profileForm.patchValue({
          handle: user.handle || '',
          bio: user.bio || ''
        });
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formValue = this.profileForm.value;
      
      this.userService.updateProfile({
        handle: formValue.handle?.trim() || null,
        bio: formValue.bio?.trim() || null
      }).subscribe({
        next: (updatedUser) => {
          this.isLoading = false;
          this.successMessage = 'Profile updated successfully!';
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/crates']);
  }

  get handleErrors() {
    const control = this.profileForm.get('handle');
    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) {
        return 'Handle must be 64 characters or less';
      }
      if (control.errors['pattern']) {
        return 'Handle can only contain letters, numbers, and hyphens';
      }
    }
    return null;
  }

  get bioErrors() {
    const control = this.profileForm.get('bio');
    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) {
        return 'Bio must be 280 characters or less';
      }
    }
    return null;
  }

  get bioCharacterCount(): number {
    return this.profileForm.get('bio')?.value?.length || 0;
  }
}
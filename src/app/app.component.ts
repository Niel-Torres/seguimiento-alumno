import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { Profile } from './models/profile.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'java-progress-tracker';
  currentUser$: Observable<User | null>;
  currentProfile$: Observable<Profile | null>;

  constructor(public authService: AuthService) {
    this.currentUser$ = this.authService.currentUser;
    this.currentProfile$ = this.authService.currentProfile;
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}

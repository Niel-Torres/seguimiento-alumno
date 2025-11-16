import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';
import { Profile } from '../models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  private currentProfileSubject: BehaviorSubject<Profile | null>;
  public currentProfile: Observable<Profile | null>;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();

    this.currentProfileSubject = new BehaviorSubject<Profile | null>(null);
    this.currentProfile = this.currentProfileSubject.asObservable();

    // Verificar sesión al iniciar
    this.checkSession();

    // Escuchar cambios de autenticación
    this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
      if (session?.user) {
        await this.loadProfile(session.user.id);
      } else {
        this.currentProfileSubject.next(null);
      }
    });
  }

  private async checkSession() {
    const { data: { session } } = await this.supabaseService.client.auth.getSession();
    this.currentUserSubject.next(session?.user ?? null);
    if (session?.user) {
      await this.loadProfile(session.user.id);
    }
  }

  private async loadProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        this.currentProfileSubject.next(null);
        return;
      }

      this.currentProfileSubject.next(data as Profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      this.currentProfileSubject.next(null);
    }
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get currentProfileValue(): Profile | null {
    return this.currentProfileSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  async signUp(email: string, password: string, username: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client.auth.signUp({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'No se pudo crear el usuario' };
      }

      // Crear perfil de usuario
      const { error: profileError } = await this.supabaseService.client
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { success: false, error: 'Error al crear el perfil de usuario' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.currentUserSubject.next(data.user);
      this.router.navigate(['/progress']);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signOut(): Promise<void> {
    await this.supabaseService.client.auth.signOut();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

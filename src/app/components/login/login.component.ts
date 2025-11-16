import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  username = '';
  isSignUp = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  async signIn(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const result = await this.authService.signIn(this.email, this.password);

    this.loading = false;

    if (!result.success) {
      this.errorMessage = this.translateError(result.error || 'Error al iniciar sesión');
    }
  }

  async signUp(): Promise<void> {
    if (!this.email || !this.password || !this.username) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.username.length < 2) {
      this.errorMessage = 'El nombre debe tener al menos 2 caracteres';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const result = await this.authService.signUp(this.email, this.password, this.username);

    this.loading = false;

    if (result.success) {
      this.successMessage = 'Cuenta creada! Revisa tu email para confirmar tu cuenta.';
      this.email = '';
      this.password = '';
      this.username = '';
      setTimeout(() => {
        this.isSignUp = false;
        this.successMessage = '';
      }, 3000);
    } else {
      this.errorMessage = this.translateError(result.error || 'Error al crear cuenta');
    }
  }

  private translateError(error: string): string {
    if (error.includes('Invalid login credentials')) {
      return 'Email o contraseña incorrectos';
    }
    if (error.includes('User already registered')) {
      return 'Este email ya está registrado';
    }
    if (error.includes('Email not confirmed')) {
      return 'Por favor confirma tu email antes de iniciar sesión';
    }
    if (error.includes('Invalid email')) {
      return 'Email inválido';
    }
    return error;
  }
}

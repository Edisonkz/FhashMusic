import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSignal = signal<string | null>(localStorage.getItem('token'));

  token = computed(() => this.tokenSignal());
  isAuthenticated = computed(() => !!this.tokenSignal());

  login(token: string) {
    localStorage.setItem('token', token);
    this.tokenSignal.set(token);
  }

  logout() {
    localStorage.removeItem('token');
    this.tokenSignal.set(null);
  }
}

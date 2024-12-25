// auth.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authStatusListener = new Subject<boolean>(); // Emite eventos de mudança de autenticação
  authStatus$ = this.authStatusListener.asObservable();

  constructor() {}

  login(username: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (username === 'admin' && password === 'admin') {
        localStorage.setItem('authToken', 'token'); // Exemplo de armazenamento do token
        localStorage.setItem('userRole', 'admin');  // Salva o papel do usuário para fins de verificação
        this.authStatusListener.next(true); // Emite evento de login
        this.doubleReload(); // Chama a função para recarregar a página duas vezes
        resolve({ success: true });
      } else {
        reject({ error: 'Invalid credentials' });
      }
    });
  }

  logout() {
    localStorage.clear(); // Limpa todas as chaves do localStorage
    this.authStatusListener.next(false); // Emite evento de logout
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  // Função para recarregar a página duas vezes
  private doubleReload() {
    console.log('Recarregando a página pela primeira vez...');
    setTimeout(() => {
      location.reload(); // Primeiro reload
      setTimeout(() => {
        console.log('Recarregando a página pela segunda vez...');
        location.reload(); // Segundo reload
      }, 500); // Intervalo de 500ms entre os dois reloads
    }, 500); // Intervalo antes do primeiro reload
  }
}

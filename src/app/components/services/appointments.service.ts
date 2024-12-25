import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AgendamentoService {

  private apiUrl = 'http://localhost:8000/api/agendamentos'; // URL da API Laravel

  constructor(private http: HttpClient) {}

  // Método para enviar os dados para o backend Laravel
  enviarAgendamento(agendamento: any): Observable<any> {
    return this.http.post(this.apiUrl, agendamento);
  }
}

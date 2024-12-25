import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Appointment } from '../models/appointment.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.css']
})
export class AppointmentsListComponent implements OnInit {
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  errorMessage: string = '';
  sortBy: string = 'name-asc';
  searchTerm: string = '';
  editAppointmentData: Appointment = this.initializeEditAppointment();
  isEditing: boolean = false;
  isLoading: boolean = false;
  appointmentToDelete: Appointment | null = null;
  isDeleteModalOpen: boolean = false;
  appointmentToHide: Appointment | null = null;
  isHideModalOpen: boolean = false;

  roomNames: { [key: number]: string } = {
    1: 'Quarto A',
    2: 'Quarto B',
    3: 'Quarto C'
  };

  totalBeds: number = 12;
  availableBeds: number = 0;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    // Verifica se já atualizou anteriormente
    const hasReloaded = localStorage.getItem('hasReloaded');
  
    if (!hasReloaded) {
      // Define a chave para evitar recargas futuras
      localStorage.setItem('hasReloaded', 'true');
  
      // Recarrega a página
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      // Carrega os dados normalmente
      this.loadAppointments();
    }
  }
  
  loadAppointments(): void {
    this.isLoading = true;
    const token = localStorage.getItem('authToken');

    if (token) {
      this.http.get<Appointment[]>('http://127.0.0.1:8000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe(
        response => {
          this.appointments = (response || []).filter(appointment => appointment?.name && appointment?.last_name);

          this.appointments.forEach(appointment => {
            appointment.additionalInfo = appointment.additionalInfo || {
              ethnicity: '',
              addictions: '',
              is_accompanied: false,
              benefits: '',
              is_lactating: false,
              has_disability: false,
              reason_for_accommodation: '',
              has_religion: false,
              religion: '',
              has_chronic_disease: false,
              chronic_disease: '',
              education_level: '',
              nationality: 'Brasileiro',
              stay_duration: null,
              room_id: null,
              bed_id: null
             
              
            };
          });

          this.applyFilter();
          this.calculateAvailableBeds();
        },
        error => this.handleError('Não foi possível carregar os agendamentos.', error)
      ).add(() => this.isLoading = false);
    } else {
      this.errorMessage = 'Autenticação necessária. Faça login novamente.';
      this.isLoading = false;
      this.router.navigate(['/login']);
    }
  }
  loadAvailableBeds(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.http.get<{ availableBeds: number }>('http://127.0.0.1:8000/api/appointments/available-beds', {
        headers: { Authorization: `Bearer ${token}` },
      }).subscribe({
        next: (response) => {
          this.availableBeds = response.availableBeds;
        },
        error: (error) => {
          console.error('Erro ao buscar vagas disponíveis na lista:', error);
          this.availableBeds = 0;
        },
      });
    }
  }
  
  calculateAvailableBeds(): void {
    const occupiedBeds = this.appointments
      .filter(appointment => appointment.additionalInfo && appointment.additionalInfo.bed_id != null)
      .map(appointment => appointment.additionalInfo.bed_id);
    
    this.availableBeds = this.totalBeds - occupiedBeds.length;
  }

  handleError(message: string, error: any): void {
    console.error(message, error);
    this.errorMessage = message;
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortBy = target.value;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredAppointments = this.appointments.filter(appointment => 
      (appointment.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
       appointment.last_name.toLowerCase().includes(this.searchTerm.toLowerCase())) &&
      (!appointment.isHidden || this.searchTerm) // Exibe ocultos apenas se houver termo de busca
    );
  
    this.sortFilteredAppointments();
  }
  
  sortFilteredAppointments(): void {
    const sortOrder = this.sortBy.split('-');
    const key = sortOrder[0] as keyof Appointment;
    const order = sortOrder[1];

    this.filteredAppointments.sort((a, b) => {
      const aValue = key === 'date' ? new Date(a.date).getTime() : String(a[key]).toLowerCase();
      const bValue = key === 'date' ? new Date(b.date).getTime() : String(b[key]).toLowerCase();

      return order === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }

  onSearch(): void {
    this.applyFilter();
  }

  formatPhoneNumber(phone?: string): string {
    if (!phone || phone.length < 10) return '';
    const ddd = phone.slice(0, 2);
    const prefixo = phone.slice(2, 3);
    const numero = phone.slice(3);
    return `(${ddd}) ${prefixo} ${numero.replace(/(\d{4})(\d)/, '$1-$2')}`;
  }

  formatCpf(cpf?: string): string {
    if (!cpf || cpf.length !== 11) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  toggleShowMore(appointment: Appointment): void {
    appointment.showMore = !appointment.showMore;
  }

  formatString(value: string): string {
    if (!value) return '';
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  confirmDelete(): void {
    if (this.appointmentToDelete) {
      this.deleteAppointment(this.appointmentToDelete.id);
    }
  }

  deleteAppointment(id: number): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.http.delete(`http://127.0.0.1:8000/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe(
        () => {
          this.appointments = this.appointments.filter(appointment => appointment.id !== id);
          this.applyFilter();
          this.calculateAvailableBeds();
          this.closeDeleteModal();
        },
        error => this.handleError('Erro ao deletar agendamento.', error)
      );
    }
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.appointmentToDelete = null;
  }

  editAppointment(appointment: Appointment): void {
    this.router.navigate(['/edit', appointment.id]);
  }

  openHideModal(appointment: Appointment): void {
    this.appointmentToHide = appointment;
    this.isHideModalOpen = true;
  }

  confirmHide(): void {
    if (this.appointmentToHide) {
      this.http.put(`http://127.0.0.1:8000/api/appointments/${this.appointmentToHide.id}/hide`, null, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      }).subscribe(
        () => {
          this.appointmentToHide!.isHidden = true;
          this.appointmentToHide!.additionalInfo.room_id = null;
          this.appointmentToHide!.additionalInfo.bed_id = null;
          this.calculateAvailableBeds();
          this.applyFilter();
          this.closeHideModal();
        },
        error => this.handleError('Erro ao ocultar o agendamento.', error)
      );
    }
  }

  closeHideModal(): void {
    this.isHideModalOpen = false;
    this.appointmentToHide = null;
  }

  showAppointment(appointment: Appointment): void {
    appointment.isHidden = false;
    this.router.navigate(['/edit', appointment.id]);
  }

  private initializeEditAppointment(): Appointment {
    return { 
      id: 0,
      name: '', 
      last_name: '', 
      cpf: '', 
      date: '', 
      arrival_date: '', 
      time: '',
      state: '', 
      city: '', 
      mother_name: '', 
      phone: '',
      observation: '',
      photo: null,
      gender: '',
      additionalInfo: { 
        ethnicity: '',
        addictions: '',
        is_accompanied: false,
        benefits: '',
        is_lactating: false,
        has_disability: false,
        reason_for_accommodation: '',
        has_religion: false,
        religion: '',
        has_chronic_disease: false,
        chronic_disease: '',
        education_level: '',
        nationality: 'Brasileiro',
        room_id: null, 
        bed_id: null,
        stay_duration: null 
      }
    };
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.editAppointmentData.photo = file;
    }
  }

  saveAppointment() {
    const formData = new FormData();
    
    // Formatar a data de nascimento
    const formattedBirthDate = new Date(this.editAppointmentData.date).toISOString().split('T')[0];
    this.editAppointmentData.date = formattedBirthDate;
  
    formData.append('name', this.editAppointmentData.name);
    formData.append('last_name', this.editAppointmentData.last_name);
    formData.append('cpf', this.editAppointmentData.cpf);
    formData.append('arrival_date', this.editAppointmentData.arrival_date);
    formData.append('mother_name', this.editAppointmentData.mother_name);
    formData.append('date', this.editAppointmentData.date);
    formData.append('time', this.editAppointmentData.time);
    formData.append('state', this.editAppointmentData.state);
    formData.append('city', this.editAppointmentData.city);
    formData.append('phone', this.editAppointmentData.phone);
    formData.append('observation', this.editAppointmentData.observation);
    formData.append('gender', this.editAppointmentData.gender);
  
    if (this.editAppointmentData.photo) {
      formData.append('photo', this.editAppointmentData.photo);
    }
  
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  
    this.http.post('http://127.0.0.1:8000/api/appointments', formData, { headers })
      .subscribe(
        response => {
          this.loadAppointments();
        },
        error => {
          console.error('Erro ao salvar agendamento:', error);
        }
      );
  }
  
}

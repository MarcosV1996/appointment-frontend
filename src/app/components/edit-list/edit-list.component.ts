import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../services/services2/appointments.service';
import { Appointment } from '../models/appointment.model';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { IbgeService } from '../ibge.service';
import { NationalityService } from '../services/services2/nationality.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { RoomService } from '../services/services2/room.service';
import { BedService } from '../services/services2/bed.service';

@Component({
  selector: 'app-edit-list',
  standalone: true,
  templateUrl: './edit-list.component.html',
  styleUrls: ['./edit-list.component.css'],
  imports: [
    FormsModule,
    CommonModule,
    NavBarComponent,
    NgxMaskDirective
  ],
  providers: [
    provideNgxMask()
  ],
  animations: [
    trigger('modalAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.5)'
      })),
      transition(':enter', [
        animate('0.5s ease-out')
      ]),
      transition(':leave', [
        animate('0.3s ease-in', style({
          opacity: 0,
          transform: 'scale(0.5)'
        }))
      ])
    ])
  ]
})
export class EditListComponent implements OnInit {
  @ViewChild('appointmentForm') appointmentForm!: NgForm;

  appointment: Appointment = this.initializeNewAppointment();
  estados: any[] = [];
  cidades: any[] = [];
  rooms: { id: number, name: string }[] = [];
  beds: { id: number, bed_number: string, is_available: boolean, occupantName?: string }[] = [];
  filteredBeds: { id: number, bed_number: string, is_available: boolean, occupantName?: string }[] = [];
  occupiedBeds: { bedId: number, occupantName: string }[] = [];
  nacionalidades: string[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;
  showModal: boolean = false;
  modalMessage: string = '';
  currentStep: number = 1;
  errorMessage: string = '';

  chronicDiseasesList: string[] = [
    'Diabetes',
    'Hipertensão',
    'Asma',
    'Doença Renal Crônica',
    'Doença Cardíaca',
    'Câncer',
    'Outra'
  ];

  constructor(
    private http: HttpClient,
    private appointmentService: AppointmentService,
    private ibgeService: IbgeService,
    private nationalityService: NationalityService,
    private roomService: RoomService,
    private bedService: BedService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    if (appointmentId) {
      this.loadAppointment(appointmentId);
    }
    this.loadEstados();
    this.loadRooms();
    this.loadNationalities();
    this.loadOccupiedBeds();
  }

  loadOccupiedBeds(): void {
    this.appointmentService.getAppointments().subscribe(
      (appointments: Appointment[]) => {
        this.occupiedBeds = appointments
          .filter((app: Appointment) => app.additionalInfo && app.additionalInfo.bed_id != null)
          .map((app: Appointment) => ({
            bedId: app.additionalInfo.bed_id as number,
            occupantName: `${app.name} ${app.last_name}`
          }));

        if (this.appointment.additionalInfo.room_id) {
          this.loadBeds(this.appointment.additionalInfo.room_id);
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Erro ao carregar agendamentos:', error);
      }
    );
  }

  loadBeds(roomId: number): void {
    this.bedService.getBedsByRoomId(roomId).subscribe(
      (data: any[]) => {
        this.filteredBeds = data.map(bed => {
          const occupiedBed = this.occupiedBeds.find(occupied => occupied.bedId === bed.id);
          return {
            ...bed,
            is_available: !occupiedBed,
            occupantName: occupiedBed ? occupiedBed.occupantName : ''
          };
        });
      },
      (error: HttpErrorResponse) => {
        console.error("Erro ao carregar camas:", error.message);
      }
    );
  }

  loadNationalities(): void {
    this.nationalityService.getNationalities().subscribe(
      (response: any[]) => {
        console.log('API Response:', response); // Log para verificar a resposta da API no console
        this.nacionalidades = response
          .map(country => country.name.common === 'Brazil' ? 'Brasil' : country.name.common)
          .sort();
        console.log('Nacionalidades carregadas:', this.nacionalidades); // Log para verificar o array final
      },
      (error) => {
        console.error("Erro ao carregar nacionalidades:", error);
        // Adiciona um fallback caso a API falhe
        this.nacionalidades = ['Brasil', 'Argentina', 'Chile', 'Uruguai', 'Paraguai'];
      }
    );
  }
  

  loadAppointment(id: number): void {
    this.isLoading = true;
    const token = localStorage.getItem('authToken');

    if (token) {
      this.http.get<Appointment>(`http://127.0.0.1:8000/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe(
        (response: Appointment) => {
          this.appointment = response;
          if (!this.appointment.additionalInfo) {
            this.appointment.additionalInfo = this.initializeAdditionalInfo();
          }
        },
        (error: any) => {
          console.error("Erro ao carregar o agendamento", error);
        }
      ).add(() => this.isLoading = false);
    } else {
      this.errorMessage = 'Autenticação necessária. Faça login novamente.';
      this.router.navigate(['/login']);
    }
  }

  private initializeNewAppointment(): Appointment {
    return {
      id: 0,
      name: '',
      last_name: '',
      cpf: '',
      date: new Date().toISOString().split('T')[0],
      mother_name: '',
      arrival_date: new Date().toISOString(),
      time: '',
      state: '',
      city: '',
      phone: '',
      observation: '',
      photo: null,
      gender: '',
      additionalInfo: this.initializeAdditionalInfo()
    };
  }

  private initializeAdditionalInfo() {
    return {
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
      stay_duration: 0 
    };
  }

  loadEstados(): void {
    this.ibgeService.getEstados().subscribe(
      (data: any[]) => {
        this.estados = data;
      },
      (error: HttpErrorResponse) => {
        console.error("Erro ao carregar estados:", error.message);
      }
    );
  }

  onEstadoChange(nomeEstado: string): void {
    const estadoSelecionado = this.estados.find(estado => estado.nome === nomeEstado);
    if (estadoSelecionado) {
      this.loadCidades(estadoSelecionado.nome);
    } else {
      this.cidades = [];
    }
  }

  loadCidades(estadoNome: string): void {
    const estadoSelecionado = this.estados.find(estado => estado.nome === estadoNome);
    if (estadoSelecionado) {
      this.ibgeService.getCidadesPorEstado(estadoSelecionado.id).subscribe(
        (data: any[]) => {
          this.cidades = data;
        },
        (error: HttpErrorResponse) => {
          console.error("Erro ao carregar cidades:", error.message);
        }
      );
    }
  }

  loadRooms(): void {
    this.roomService.getRooms().subscribe(
      (data: any[]) => {
        this.rooms = data;
      },
      (error: HttpErrorResponse) => {
        console.error('Erro ao carregar quartos:', error.message);
      }
    );
  }

  onRoomChange(event: Event): void {
    const roomId = Number((event.target as HTMLSelectElement).value);
    if (!roomId || isNaN(roomId)) {
      console.error('ID do quarto é inválido ou não foi selecionado.');
      return;
    }
    this.appointment.additionalInfo.room_id = roomId;
    this.loadBeds(roomId);
  }

  nextStep(): void {
    if (!this.validateFields()) {
      console.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  validateFields(): boolean {
    if (this.appointmentForm) {
      Object.values(this.appointmentForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }
    return this.appointmentForm.valid ?? false;
  }

  onSubmit(): void {
    this.isSaving = true;
    this.showModal = false;
    this.modalMessage = '';
  
    // Inclua o campo isHidden: false para garantir que o agendamento seja visível
    const combinedData: Appointment = {
      ...this.appointment,
      isHidden: false,
      additionalInfo: {
        ...this.appointment.additionalInfo
      }
    };
  
    this.appointmentService.updateAppointment(this.appointment.id, combinedData).subscribe(
      (updatedAppointment: Appointment) => {
        this.isSaving = false;
        this.showModal = true;
        this.modalMessage = 'Agendamento atualizado com sucesso!';
  
        // Redireciona de volta para a lista de agendamentos
        this.router.navigate(['/appointments-list']).then(() => {
          window.location.reload();
        });
      },
      (error: HttpErrorResponse) => {
        this.isSaving = false;
        this.modalMessage = error.status === 422 && error.error && error.error.message
          ? error.error.message
          : 'Erro ao atualizar o agendamento. Tente novamente mais tarde.';
        this.showModal = true;
        console.error("Erro ao atualizar o agendamento:", error.message);
      }
    );
  }
  

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.appointment.photo = file;
    }
  }

  formatString(value: string): string {
    if (!value) return '';
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

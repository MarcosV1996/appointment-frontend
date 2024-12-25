import { Component } from '@angular/core';
import { PartnershipsComponent } from '../partnerships/partnerships.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true, 
  imports: [CommonModule,PartnershipsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}

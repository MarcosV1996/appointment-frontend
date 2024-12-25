export interface AdditionalInfo {
    ethnicity: string;
    addictions: string;
    is_accompanied: boolean;
    benefits: string;
    is_lactating: boolean;
    has_disability: boolean;
    reason_for_accommodation: string;
    has_religion: boolean;
    religion: string;
    has_chronic_disease: boolean;
    chronic_disease: string;
    education_level: string;
    nationality: string;
    room_id: number | null; 
    bed_id: number | null;  
  }
  
  export interface Appointment {
    id: number;
    name: string;
    last_name: string;
    cpf: string;
    date: string;
    arrival_date: string;
    time: string;
    birth_date?: string;
    state: string;
    city: string;
    mother_name: string;
    phone: string;
    observation: string;
    photo: string | File | null;    gender: string;
    foreign_country?: boolean;
    noPhone?: boolean;
  
   
    additionalInfo: {
      ethnicity: string;
      addictions: string;
      is_accompanied: boolean;
      benefits: string;
      is_lactating: boolean;
      has_disability: boolean;
      reason_for_accommodation: string;
      has_religion: boolean;
      religion: string;
      has_chronic_disease: boolean;
      chronic_disease: string;
      education_level: string;
      nationality: string;
      room_id: number | null;
      bed_id: number | null;
      stay_duration: number | null; 
    };
  
    showMore?: boolean;  
    isHidden?: boolean;
  }
  
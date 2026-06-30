export interface Church {
  id: string;
  name: string;
  isHeadquarters?: boolean;
  city?: string;
  state?: string;
  ministryId?: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  pastorName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  status?: 'ativa' | 'inativa';
  plan?: 'Basic' | 'Pro' | 'Premium';
  memberLimit?: number;
  userLimit?: number;
  subscriptionStatus?: 'Ativa' | 'Atrasada' | 'Inadimplente' | 'Trial';
  departments?: string[];
  coverPhotoUrl?: string;
  services?: ChurchService[];
  activeModules?: string[];
  cardConfig?: any;
  config?: any;
}

export interface Member {
  id: string;
  church_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  function?: string;
  ministry?: string;
  status?: 'ativo' | 'inativo' | 'visitante' | 'em_conversao' | 'pendente';
  integrationDate?: string;
  photoUrl?: string;
  cardValidity?: string;
}

export interface Visitor {
  id: string;
  church_id: string;
  name: string;
  phone?: string;
  date: string;
  region?: string;
  how_knew_church?: string;
  wants_visit?: boolean;
  address?: string;
  status?: string;
  integrationDate?: string;
}

export interface EventGuest {
  id: string;
  event_id: string;
  church_id: string;
  name: string;
  phone?: string;
  status?: string;
}

export interface Transaction {
  id: string;
  church_id: string;
  type: 'receita' | 'despesa';
  amount: number;
  date: string;
  category: string;
  description?: string;
  status?: 'pendente' | 'pago' | 'atrasado';
  payment_method?: string;
  due_date?: string;
  paid_date?: string;
  member_id?: string;
  supplier_id?: string;
}

export interface ChurchService {
  id: string;
  church_id?: string;
  name: string;
  dayOfWeek: string;
  time: string;
  type?: string;
}

export interface Asset {
  id: string;
  church_id: string;
  name: string;
  value?: number;
  acquire_date?: string;
  location?: string;
  status?: string;
  expense_id?: string;
}

export interface ChurchEvent {
  id: string;
  churchId: string;
  title: string;
  description: string;
  type: 'culto_especial' | 'conferencia' | 'retiro' | 'reuniao' | 'curso' | 'culto' | 'ensaio' | 'social' | 'outro';
  departmentId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  isGlobal: boolean;
  estimatedCost?: number;
  actualCost?: number;
  bannerUrl?: string;
  videoUrl?: string;
  paymentLink?: string;
  ticketPrice?: number;
  maxCapacity?: number;
}

export interface Kid {
  id: string;
  church_id: string;
  name: string;
  age?: number;
  room?: string;
  guardian?: string;
  guardian_phone?: string;
  photoUrl?: string;
  special_needs?: boolean;
  allergies?: string;
  status?: 'ativo' | 'inativo';
}

export interface KidCheckIn {
  id: string;
  kid_id: string;
  church_id: string;
  check_in: string;
  check_out?: string;
  guardian_name: string;
  guardian_phone?: string;
  room?: string;
  observations?: string;
  code?: string;
}

export interface MinistryGroup {
  id: string;
  name: string;
}

export const MOCK_MINISTRIES: MinistryGroup[] = [];

export interface ChurchService {
  id: string;
  name: string;
  dayOfWeek: 'Domingo' | 'Segunda-feira' | 'Terça-feira' | 'Quarta-feira' | 'Quinta-feira' | 'Sexta-feira' | 'Sábado';
  time: string;
}

export interface Church {
  id: string;
  ministryId: string; // Referência à denominação/rede
  name: string;
  isHeadquarters: boolean;
  city: string;
  neighborhood: string; // Bairro
  state: string;
  address: string;
  phone: string;
  pastorName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  status: 'ativa' | 'inativa';
  // Campos SaaS
  plan: 'Basic' | 'Pro' | 'Premium';
  memberLimit: number | null; // null = Ilimitado
  subscriptionStatus: 'Trial' | 'Ativa' | 'Inadimplente' | 'Cancelada';
  departments: string[]; // Antigo ministries (Louvor, Kids, etc)
  coverPhotoUrl: string;
  services?: ChurchService[]; // Cultos Regulares (Ex: Domingo às 18:00)
}

export const MOCK_CHURCHES: Church[] = [];

export interface Goal {
  id: string;
  churchId: string;
  year: number;
  target: number;
}

export const MOCK_GOALS: Goal[] = [];

export type MemberStatus = 'pendente' | 'ativo' | 'inativo';

export interface Member {
  id: string;
  churchId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  function: string;
  ministry: string;
  photoUrl: string;
  integrationDate: string;
  status: MemberStatus;
}

export const MOCK_MEMBERS: Member[] = [];

// ============================================================
// MÓDULO FINANCEIRO
// ============================================================

export interface Supplier {
  id: string;
  name: string;
  document: string; // CNPJ ou CPF
  phone: string;
}

export const MOCK_SUPPLIERS: Supplier[] = [];

export type TransactionType = 'receita' | 'despesa';
export type TransactionStatus = 'pendente' | 'confirmado' | 'vencido' | 'cancelado';

export interface Transaction {
  id: string;
  churchId: string;
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  memberId?: string; // opcional, só receitas
  supplierId?: string; // opcional, só despesas
  status: TransactionStatus;
  date: string; // data do lançamento
  dueDate?: string; // vencimento
  paidDate?: string; // data efetiva do pagamento
}

export const MOCK_TRANSACTIONS: Transaction[] = [];

// ============================================================
// MÓDULO AGENDA/CULTOS
// ============================================================

export interface ChurchEvent {
  id: string;
  churchId: string; // ID da igreja ou "GLOBAL"
  title: string;
  description?: string;
  type: 'culto' | 'reuniao' | 'conferencia' | 'ensaio' | 'social' | 'outro';
  departmentId?: string; // Louvor, Kids, Mídia, etc.
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime?: string; // HH:MM
  location: string;
  isGlobal: boolean;
  estimatedCost?: number;
  actualCost?: number;
  // Novos campos avançados do Módulo de Eventos
  bannerUrl?: string;
  videoUrl?: string;
  paymentLink?: string;
  ticketPrice?: number;
  maxCapacity?: number;
}

export interface EventGuest {
  id: string;
  eventId: string;
  memberName: string;
  memberPhone: string;
  status: 'pendente' | 'confirmado_pago' | 'confirmado_gratis' | 'recusado';
  ticketPricePaid: number;
}

export const MOCK_EVENT_GUEST: EventGuest[] = [];

export const MOCK_EVENTS: ChurchEvent[] = [];

// ============================================================
// MÓDULO PATRIMÔNIO (ATIVOS)
// ============================================================

export interface Asset {
  id: string;
  churchId: string;
  name: string;
  category: string;
  condition: 'Novo' | 'Bom' | 'Em Manutenção' | 'Descartado';
  location: string;
  purchaseValue: number;
  purchaseDate: string;
  expenseId?: string; // Vinculado a uma despesa no financeiro
}

export const MOCK_ASSETS: Asset[] = [];

// ============================================================
// MÓDULO MINISTÉRIO INFANTIL (KIDS)
// ============================================================

export interface Kid {
  id: string;
  name: string;
  birthDate: string; // Para cálculo de faixa etária
  parentName: string;
  parentPhone: string;
  allergies?: string;
  churchId: string;
}

export interface KidCheckIn {
  id: string;
  kidId: string;
  kidName: string;
  room: 'Berçário' | 'Maternal' | 'Juniores' | 'Teens';
  checkInTime: string;
  checkOutTime?: string;
  securityCode: string;
  parentName: string;
  parentPhone: string;
  status: 'presente' | 'liberado';
}

export const MOCK_KIDS: Kid[] = [];

export const MOCK_KIDS_CHECKIN: KidCheckIn[] = [];

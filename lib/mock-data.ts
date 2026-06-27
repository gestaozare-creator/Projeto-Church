export interface MinistryGroup {
  id: string;
  name: string;
}

export const MOCK_MINISTRIES: MinistryGroup[] = [
  { id: 'min1', name: 'Ministério Madureira' },
  { id: 'min2', name: 'Ministério Belém' },
];

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

export const MOCK_CHURCHES: Church[] = [
  { 
    id: '1', ministryId: 'min1', name: 'Sede - Centro', isHeadquarters: true, city: 'São Paulo', neighborhood: 'Centro', state: 'SP', address: 'Rua Augusta, 1200 - Centro', phone: '(11) 3333-1111', pastorName: 'Pr. Roberto Silva', logoUrl: '', primaryColor: '#3498db', secondaryColor: '#2c3e50', status: 'ativa', plan: 'Premium', memberLimit: null, subscriptionStatus: 'Ativa', departments: ['Louvor', 'Mídia', 'Obreiros', 'Infantil', 'Evangelismo', 'Mulheres'], coverPhotoUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&q=80',
    services: [
      { id: 'svc1', name: 'Culto da Família', dayOfWeek: 'Domingo', time: '18:00' },
      { id: 'svc2', name: 'Escola Bíblica (EBD)', dayOfWeek: 'Domingo', time: '09:00' },
      { id: 'svc3', name: 'Culto de Ensino', dayOfWeek: 'Quarta-feira', time: '19:30' },
      { id: 'svc4', name: 'Culto dos Jovens', dayOfWeek: 'Sábado', time: '20:00' }
    ]
  },
  { id: '2', ministryId: 'min1', name: 'Filial - Zona Sul', isHeadquarters: false, city: 'São Paulo', neighborhood: 'Interlagos', state: 'SP', address: 'Av. Interlagos, 500 - Zona Sul', phone: '(11) 3333-2222', pastorName: 'Pr. Marcos Santos', logoUrl: '', primaryColor: '#2ecc71', secondaryColor: '#27ae60', status: 'ativa', plan: 'Pro', memberLimit: 500, subscriptionStatus: 'Ativa', departments: ['Louvor', 'Obreiros', 'Infantil'], coverPhotoUrl: 'https://images.unsplash.com/photo-1548625361-ec8537142417?w=800&q=80', services: [{ id: 'svc5', name: 'Culto de Celebração', dayOfWeek: 'Domingo', time: '18:30' }, { id: 'svc6', name: 'Culto de Libertação', dayOfWeek: 'Sexta-feira', time: '19:30' }] },
  { id: '3', ministryId: 'min2', name: 'Filial - Campinas', isHeadquarters: false, city: 'Campinas', neighborhood: 'Cambuí', state: 'SP', address: 'Rua Barão de Jaguara, 800', phone: '(19) 3333-3333', pastorName: 'Pr. Lucas Oliveira', logoUrl: '', primaryColor: '#9b59b6', secondaryColor: '#8e44ad', status: 'ativa', plan: 'Basic', memberLimit: 150, subscriptionStatus: 'Inadimplente', departments: ['Louvor', 'Obreiros'], coverPhotoUrl: '', services: [{ id: 'svc7', name: 'Culto da Família', dayOfWeek: 'Domingo', time: '19:00' }] },
  { id: '4', ministryId: 'min1', name: 'Filial - Guarulhos', isHeadquarters: false, city: 'Guarulhos', neighborhood: 'Centro', state: 'SP', address: 'Av. Tiradentes, 150', phone: '(11) 3333-4444', pastorName: 'Pr. Felipe Costa', logoUrl: '', primaryColor: '#e67e22', secondaryColor: '#d35400', status: 'ativa', plan: 'Basic', memberLimit: 150, subscriptionStatus: 'Trial', departments: ['Louvor'], coverPhotoUrl: '' },
  { id: '5', ministryId: 'min1', name: 'Filial - Osasco', isHeadquarters: false, city: 'Osasco', neighborhood: 'Centro', state: 'SP', address: 'Rua Antonio Agu, 300', phone: '(11) 3333-5555', pastorName: 'Pr. Daniel Lima', logoUrl: '', primaryColor: '#1abc9c', secondaryColor: '#16a085', status: 'ativa', plan: 'Pro', memberLimit: 500, subscriptionStatus: 'Ativa', departments: ['Louvor', 'Infantil'], coverPhotoUrl: '' },
  { id: '6', ministryId: 'min2', name: 'Filial - Santo André', isHeadquarters: false, city: 'Santo André', neighborhood: 'Centro', state: 'SP', address: 'Rua Coronel Oliveira Lima, 400', phone: '(11) 3333-6666', pastorName: 'Pr. Gabriel Alves', logoUrl: '', primaryColor: '#e74c3c', secondaryColor: '#c0392b', status: 'ativa', plan: 'Pro', memberLimit: 500, subscriptionStatus: 'Ativa', departments: ['Louvor', 'Obreiros', 'Mídia'], coverPhotoUrl: '' },
  { id: '7', ministryId: 'min2', name: 'Filial - São Bernardo', isHeadquarters: false, city: 'São Bernardo do Campo', neighborhood: 'Centro', state: 'SP', address: 'Av. Marechal Deodoro, 700', phone: '(11) 3333-7777', pastorName: 'Pr. Tiago Mendes', logoUrl: '', primaryColor: '#f39c12', secondaryColor: '#f1c40f', status: 'ativa', plan: 'Premium', memberLimit: null, subscriptionStatus: 'Ativa', departments: ['Louvor', 'Mídia', 'Obreiros', 'Infantil'], coverPhotoUrl: '' },
  { id: '8', ministryId: 'min1', name: 'Filial - Sorocaba', isHeadquarters: false, city: 'Sorocaba', neighborhood: 'Centro', state: 'SP', address: 'Rua XV de Novembro, 200', phone: '(15) 3333-8888', pastorName: 'Pr. André Ribeiro', logoUrl: '', primaryColor: '#34495e', secondaryColor: '#2c3e50', status: 'inativa', plan: 'Basic', memberLimit: 150, subscriptionStatus: 'Cancelada', departments: ['Louvor'], coverPhotoUrl: '' }
];

export interface Goal {
  id: string;
  churchId: string;
  year: number;
  target: number;
}

export const MOCK_GOALS: Goal[] = [
  { id: 'g1', churchId: '1', year: 2026, target: 120 },
  { id: 'g2', churchId: '2', year: 2026, target: 80 },
  { id: 'g3', churchId: '3', year: 2026, target: 60 },
  { id: 'g4', churchId: '4', year: 2026, target: 100 },
  { id: 'g5', churchId: '5', year: 2026, target: 40 },
  { id: 'g6', churchId: '6', year: 2026, target: 70 },
  { id: 'g7', churchId: '7', year: 2026, target: 50 },
  { id: 'g8', churchId: '8', year: 2026, target: 45 },
  { id: 'g9', churchId: 'GLOBAL', year: 2026, target: 500 }
];

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

export const MOCK_MEMBERS: Member[] = [
  // ATIVOS — SP
  { id: 'm1', churchId: '1', name: 'André Silva', phone: '(11) 99999-9999', email: 'andre@email.com', address: 'Centro, São Paulo', state: 'SP', function: 'Líder de Louvor', ministry: 'Louvor', photoUrl: 'https://i.pravatar.cc/150?u=andre', integrationDate: '2025-03-10', status: 'ativo' },
  { id: 'm2', churchId: '1', name: 'Juliana Costa', phone: '(11) 98888-8888', email: 'juliana@email.com', address: 'Bela Vista, São Paulo', state: 'SP', function: 'Baterista', ministry: 'Louvor', photoUrl: 'https://i.pravatar.cc/150?u=juliana', integrationDate: '2025-08-15', status: 'ativo' },
  { id: 'm3', churchId: '2', name: 'Carlos Santos', phone: '(11) 97777-7777', email: 'carlos@email.com', address: 'Vila Mariana, São Paulo', state: 'SP', function: 'Obreiro (Porta 1)', ministry: 'Obreiros', photoUrl: 'https://i.pravatar.cc/150?u=carlos', integrationDate: '2023-02-20', status: 'ativo' },
  { id: 'm4', churchId: '1', name: 'Patricia Lins', phone: '(11) 94444-4444', email: 'patricia@email.com', address: 'Jardins, São Paulo', state: 'SP', function: 'Tecladista', ministry: 'Louvor', photoUrl: 'https://i.pravatar.cc/150?u=patricia', integrationDate: '2026-01-12', status: 'ativo' },
  // ATIVOS — outros estados
  { id: 'm10', churchId: '1', name: 'Marcos Oliveira', phone: '(21) 91234-5678', email: 'marcos@email.com', address: 'Copacabana, Rio de Janeiro', state: 'RJ', function: 'Sonoplasta', ministry: 'Mídia', photoUrl: 'https://i.pravatar.cc/150?u=marcos', integrationDate: '2025-05-20', status: 'ativo' },
  { id: 'm11', churchId: '1', name: 'Aline Souza', phone: '(21) 98765-4321', email: 'aline@email.com', address: 'Tijuca, Rio de Janeiro', state: 'RJ', function: 'Vocalista', ministry: 'Louvor', photoUrl: 'https://i.pravatar.cc/150?u=aline', integrationDate: '2025-07-10', status: 'ativo' },
  { id: 'm12', churchId: '1', name: 'Diego Ferreira', phone: '(31) 99876-5432', email: 'diego@email.com', address: 'Savassi, Belo Horizonte', state: 'MG', function: 'Guitarrista', ministry: 'Louvor', photoUrl: 'https://i.pravatar.cc/150?u=diego', integrationDate: '2025-09-01', status: 'ativo' },
  { id: 'm13', churchId: '1', name: 'Camila Rocha', phone: '(31) 91111-2222', email: 'camila@email.com', address: 'Pampulha, Belo Horizonte', state: 'MG', function: 'Professora Kids', ministry: 'Infantil', photoUrl: 'https://i.pravatar.cc/150?u=camila', integrationDate: '2025-04-15', status: 'ativo' },
  { id: 'm14', churchId: '3', name: 'Thiago Mendes', phone: '(41) 93333-4444', email: 'thiago@email.com', address: 'Batel, Curitiba', state: 'PR', function: 'Líder de Célula', ministry: 'Pastoral', photoUrl: 'https://i.pravatar.cc/150?u=thiago', integrationDate: '2026-05-10', status: 'ativo' },
  { id: 'm15', churchId: '4', name: 'Priscila Nunes', phone: '(71) 95555-6666', email: 'priscila@email.com', address: 'Barra, Salvador', state: 'BA', function: 'Intercessora', ministry: 'Intercessão', photoUrl: 'https://i.pravatar.cc/150?u=priscila', integrationDate: '2026-05-12', status: 'ativo' },
  { id: 'm16', churchId: '5', name: 'Gabriel Lima', phone: '(85) 97777-8888', email: 'gabriel@email.com', address: 'Meireles, Fortaleza', state: 'CE', function: 'Designer', ministry: 'Mídia', photoUrl: 'https://i.pravatar.cc/150?u=gabriel', integrationDate: '2026-05-15', status: 'ativo' },
  { id: 'm17', churchId: '6', name: 'Roberto Carlos', phone: '(11) 98888-7777', email: 'roberto.c@email.com', address: 'Centro, Santo André', state: 'SP', function: 'Baterista', ministry: 'Louvor', photoUrl: 'https://i.pravatar.cc/150?u=robertoc', integrationDate: '2026-05-18', status: 'ativo' },
  { id: 'm18', churchId: '7', name: 'Carla Dias', phone: '(11) 93333-1111', email: 'carla@email.com', address: 'Centro, São Bernardo', state: 'SP', function: 'Vocalista', ministry: 'Louvor', photoUrl: 'https://i.pravatar.cc/150?u=carla', integrationDate: '2026-05-19', status: 'ativo' },
  { id: 'm19', churchId: '8', name: 'Felipe Soares', phone: '(15) 92222-3333', email: 'felipe@email.com', address: 'Campolim, Sorocaba', state: 'SP', function: 'Sonoplasta', ministry: 'Mídia', photoUrl: 'https://i.pravatar.cc/150?u=felipe', integrationDate: '2026-05-05', status: 'ativo' },
  { id: 'm20', churchId: '4', name: 'Amanda Moraes', phone: '(11) 91111-5555', email: 'amanda@email.com', address: 'Bosque Maia, Guarulhos', state: 'SP', function: 'Auxiliar Kids', ministry: 'Infantil', photoUrl: 'https://i.pravatar.cc/150?u=amanda', integrationDate: '2026-05-02', status: 'ativo' },

  // PENDENTES (vieram do formulário)
  { id: 'm5', churchId: '1', name: 'Rafael Moura', phone: '(11) 91111-1111', email: 'rafael@email.com', address: 'Santana, São Paulo', state: 'SP', function: 'Ainda não definida', ministry: '', photoUrl: 'https://i.pravatar.cc/150?u=rafael', integrationDate: '', status: 'pendente' },
  { id: 'm6', churchId: '2', name: 'Bruna Dias', phone: '(11) 92222-2222', email: 'bruna@email.com', address: 'Ipiranga, São Paulo', state: 'SP', function: 'Ainda não definida', ministry: '', photoUrl: 'https://i.pravatar.cc/150?u=bruna2', integrationDate: '', status: 'pendente' },
  { id: 'm7', churchId: '3', name: 'Lucas Freitas', phone: '(19) 93333-3333', email: 'lucas@email.com', address: 'Cambuí, Campinas', state: 'SP', function: 'Ainda não definida', ministry: '', photoUrl: 'https://i.pravatar.cc/150?u=lucas2', integrationDate: '', status: 'pendente' },

  // INATIVOS
  { id: 'm8', churchId: '1', name: 'Fernanda Lima', phone: '(11) 96666-6666', email: 'fernanda@email.com', address: 'Liberdade, São Paulo', state: 'SP', function: 'Professora', ministry: 'Infantil', photoUrl: 'https://i.pravatar.cc/150?u=fernanda', integrationDate: '2021-11-05', status: 'inativo' },
  { id: 'm9', churchId: '2', name: 'Roberto Almeida', phone: '(11) 95555-5555', email: 'roberto@email.com', address: 'Pinheiros, São Paulo', state: 'SP', function: 'Fotógrafo', ministry: 'Mídia', photoUrl: 'https://i.pravatar.cc/150?u=roberto', integrationDate: '2022-08-30', status: 'inativo' },

  // --- NOVOS DADOS PARA APRESENTAÇÃO ---
  { id: 'm21', churchId: '1', name: 'Samuel Alves', phone: '(11) 97777-1111', email: 'samuel@email.com', address: 'Tatuapé, São Paulo', state: 'SP', function: 'Voluntário', ministry: 'Ação Social', photoUrl: 'https://i.pravatar.cc/150?u=samuel', integrationDate: '2026-06-01', status: 'ativo' },
  { id: 'm22', churchId: '2', name: 'Larissa Moura', phone: '(11) 97777-2222', email: 'larissa@email.com', address: 'Moema, São Paulo', state: 'SP', function: 'Vocalista', ministry: 'Louvor', photoUrl: 'https://i.pravatar.cc/150?u=larissa', integrationDate: '2026-06-05', status: 'ativo' },
  { id: 'm23', churchId: '3', name: 'Tiago Santos', phone: '(19) 97777-3333', email: 'tiago@email.com', address: 'Taquaral, Campinas', state: 'SP', function: 'Porteiro', ministry: 'Obreiros', photoUrl: 'https://i.pravatar.cc/150?u=tiago', integrationDate: '2026-06-10', status: 'ativo' },
  { id: 'm24', churchId: '4', name: 'Beatriz Costa', phone: '(11) 97777-4444', email: 'beatriz@email.com', address: 'Macedo, Guarulhos', state: 'SP', function: 'Câmera', ministry: 'Mídia', photoUrl: 'https://i.pravatar.cc/150?u=beatriz', integrationDate: '2026-06-12', status: 'ativo' },
  { id: 'm25', churchId: '5', name: 'João Pedro', phone: '(11) 97777-5555', email: 'jp@email.com', address: 'Bela Vista, Osasco', state: 'SP', function: 'Líder de Jovens', ministry: 'Jovens', photoUrl: 'https://i.pravatar.cc/150?u=jp', integrationDate: '2026-06-15', status: 'ativo' },
  { id: 'm26', churchId: '6', name: 'Mariana Rocha', phone: '(11) 97777-6666', email: 'mariana@email.com', address: 'Campestre, Santo André', state: 'SP', function: 'Diaconisa', ministry: 'Obreiros', photoUrl: 'https://i.pravatar.cc/150?u=mariana', integrationDate: '2026-06-18', status: 'ativo' },
  { id: 'm27', churchId: '7', name: 'Vitor Hugo', phone: '(11) 97777-7777', email: 'vitor@email.com', address: 'Rudge Ramos, São Bernardo', state: 'SP', function: 'Tecladista', ministry: 'Louvor', photoUrl: 'https://i.pravatar.cc/150?u=vitor', integrationDate: '2026-06-20', status: 'ativo' },
];

// ============================================================
// MÓDULO FINANCEIRO
// ============================================================

export interface Supplier {
  id: string;
  name: string;
  document: string; // CNPJ ou CPF
  phone: string;
}

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Imobiliária Central', document: '12.345.678/0001-90', phone: '(11) 3333-4444' },
  { id: 's2', name: 'CPFL Energia', document: '02.558.157/0001-62', phone: '0800-010-0102' },
  { id: 's3', name: 'Sabesp', document: '43.776.517/0001-80', phone: '0800-011-9911' },
  { id: 's4', name: 'TechFrio Climatização', document: '44.555.666/0001-77', phone: '(11) 5555-6666' },
  { id: 's5', name: 'Papelaria Modelo', document: '33.222.111/0001-55', phone: '(11) 2222-3333' },
];

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

export const MOCK_TRANSACTIONS: Transaction[] = [
  // RECEITAS - Confirmadas
  { id: 't1', churchId: '1', type: 'receita', category: 'Dízimo', description: 'Dízimo referente a maio', amount: 500, paymentMethod: 'PIX', memberId: 'm1', status: 'confirmado', date: '2026-05-18', paidDate: '2026-05-18' },
  { id: 't2', churchId: '1', type: 'receita', category: 'Dízimo', description: 'Dízimo referente a maio', amount: 300, paymentMethod: 'PIX', memberId: 'm2', status: 'confirmado', date: '2026-05-15', paidDate: '2026-05-15' },
  { id: 't3', churchId: '1', type: 'receita', category: 'Oferta', description: 'Oferta culto domingo', amount: 1250, paymentMethod: 'Dinheiro', status: 'confirmado', date: '2026-05-18', paidDate: '2026-05-18' },
  { id: 't4', churchId: '2', type: 'receita', category: 'Dízimo', description: 'Dízimo referente a maio', amount: 450, paymentMethod: 'Transferência', memberId: 'm3', status: 'confirmado', date: '2026-05-10', paidDate: '2026-05-10' },
  { id: 't5', churchId: '1', type: 'receita', category: 'Oferta Oficial', description: 'Campanha missionária', amount: 2000, paymentMethod: 'PIX', status: 'confirmado', date: '2026-05-12', paidDate: '2026-05-12' },
  { id: 't6', churchId: '1', type: 'receita', category: 'Oferta', description: 'Oferta culto quarta', amount: 680, paymentMethod: 'Dinheiro', status: 'confirmado', date: '2026-05-14', paidDate: '2026-05-14' },
  { id: 't7', churchId: '2', type: 'receita', category: 'Oferta', description: 'Oferta culto domingo', amount: 890, paymentMethod: 'Dinheiro', status: 'confirmado', date: '2026-05-18', paidDate: '2026-05-18' },
  { id: 't8', churchId: '3', type: 'receita', category: 'Dízimo', description: 'Dízimo maio', amount: 350, paymentMethod: 'PIX', memberId: 'm14', status: 'confirmado', date: '2026-05-10', paidDate: '2026-05-10' },
  // RECEITAS - Pendentes (a receber)
  { id: 't9', churchId: '1', type: 'receita', category: 'Dízimo', description: 'Dízimo previsto', amount: 500, paymentMethod: 'PIX', memberId: 'm4', status: 'pendente', date: '2026-05-20', dueDate: '2026-05-25' },
  { id: 't10', churchId: '1', type: 'receita', category: 'Campanha', description: 'Campanha reforma templo', amount: 1000, paymentMethod: 'Boleto', status: 'pendente', date: '2026-05-19', dueDate: '2026-05-30' },
  { id: 't11', churchId: '2', type: 'receita', category: 'Aluguel de Espaço', description: 'Aluguel salão para evento', amount: 800, paymentMethod: 'Boleto', status: 'pendente', date: '2026-05-15', dueDate: '2026-05-22' },
  // RECEITAS - Vencidas (não recebidas)
  { id: 't12', churchId: '1', type: 'receita', category: 'Campanha', description: 'Promessa campanha missões', amount: 200, paymentMethod: 'Boleto', memberId: 'm10', status: 'vencido', date: '2026-05-01', dueDate: '2026-05-10' },

  // DESPESAS - Pagas
  { id: 't20', churchId: '1', type: 'despesa', category: 'Aluguel', description: 'Aluguel templo maio', amount: 3200, paymentMethod: 'Boleto', supplierId: 's1', status: 'confirmado', date: '2026-05-05', dueDate: '2026-05-10', paidDate: '2026-05-08' },
  { id: 't21', churchId: '1', type: 'despesa', category: 'Energia', description: 'Conta de luz maio', amount: 480, paymentMethod: 'Débito Automático', supplierId: 's2', status: 'confirmado', date: '2026-05-15', dueDate: '2026-05-20', paidDate: '2026-05-15' },
  { id: 't22', churchId: '1', type: 'despesa', category: 'Água', description: 'Conta de água maio', amount: 120, paymentMethod: 'Débito Automático', supplierId: 's3', status: 'confirmado', date: '2026-05-15', dueDate: '2026-05-20', paidDate: '2026-05-15' },
  { id: 't23', churchId: '2', type: 'despesa', category: 'Aluguel', description: 'Aluguel filial maio', amount: 1800, paymentMethod: 'Boleto', supplierId: 's1', status: 'confirmado', date: '2026-05-05', dueDate: '2026-05-10', paidDate: '2026-05-09' },
  { id: 't24', churchId: '1', type: 'despesa', category: 'Material de Escritório', description: 'Toner e papel A4', amount: 250, paymentMethod: 'Cartão Débito', supplierId: 's5', status: 'confirmado', date: '2026-05-12', paidDate: '2026-05-12' },
  // DESPESAS - Pendentes (a pagar)
  { id: 't25', churchId: '1', type: 'despesa', category: 'Internet/Telefone', description: 'Internet maio', amount: 199, paymentMethod: 'Boleto', status: 'pendente', date: '2026-05-19', dueDate: '2026-05-25' },
  { id: 't26', churchId: '1', type: 'despesa', category: 'Salários/Ajudas de Custo', description: 'Ajuda de custo pastor', amount: 3500, paymentMethod: 'Transferência', status: 'pendente', date: '2026-05-19', dueDate: '2026-05-30' },
  { id: 't27', churchId: '1', type: 'despesa', category: 'Manutenção', description: 'Manutenção ar condicionado', amount: 1500, paymentMethod: 'Boleto', supplierId: 's4', status: 'pendente', date: '2026-05-16', dueDate: '2026-05-21' },
  { id: 't28', churchId: '2', type: 'despesa', category: 'Energia', description: 'Conta de luz filial', amount: 320, paymentMethod: 'Boleto', supplierId: 's2', status: 'pendente', date: '2026-05-18', dueDate: '2026-05-23' },
  // DESPESAS - Vencidas (não pagas)
  { id: 't29', churchId: '1', type: 'despesa', category: 'Manutenção', description: 'Reparo hidráulico', amount: 850, paymentMethod: 'Boleto', supplierId: 's4', status: 'vencido', date: '2026-05-01', dueDate: '2026-05-05' },

  // Dados de meses anteriores para gráfico
  { id: 't30', churchId: '1', type: 'receita', category: 'Dízimo', description: 'Dízimos abril', amount: 4200, paymentMethod: 'PIX', status: 'confirmado', date: '2026-04-15', paidDate: '2026-04-15' },
  { id: 't31', churchId: '1', type: 'receita', category: 'Oferta', description: 'Ofertas abril', amount: 1800, paymentMethod: 'Dinheiro', status: 'confirmado', date: '2026-04-18', paidDate: '2026-04-18' },
  { id: 't32', churchId: '1', type: 'despesa', category: 'Aluguel', description: 'Aluguel abril', amount: 3200, paymentMethod: 'Boleto', supplierId: 's1', status: 'confirmado', date: '2026-04-05', paidDate: '2026-04-08' },
  { id: 't33', churchId: '1', type: 'despesa', category: 'Energia', description: 'Energia abril', amount: 520, paymentMethod: 'Débito Automático', supplierId: 's2', status: 'confirmado', date: '2026-04-15', paidDate: '2026-04-15' },
  { id: 't34', churchId: '1', type: 'receita', category: 'Dízimo', description: 'Dízimos março', amount: 3800, paymentMethod: 'PIX', status: 'confirmado', date: '2026-03-15', paidDate: '2026-03-15' },
  { id: 't35', churchId: '1', type: 'receita', category: 'Oferta', description: 'Ofertas março', amount: 1500, paymentMethod: 'Dinheiro', status: 'confirmado', date: '2026-03-18', paidDate: '2026-03-18' },
  { id: 't36', churchId: '1', type: 'despesa', category: 'Aluguel', description: 'Aluguel março', amount: 3200, paymentMethod: 'Boleto', supplierId: 's1', status: 'confirmado', date: '2026-03-05', paidDate: '2026-03-08' },
  { id: 't37', churchId: '1', type: 'despesa', category: 'Energia', description: 'Energia março', amount: 450, paymentMethod: 'Débito Automático', supplierId: 's2', status: 'confirmado', date: '2026-03-15', paidDate: '2026-03-15' },
  { id: 't38', churchId: '1', type: 'receita', category: 'Dízimo', description: 'Dízimos fevereiro', amount: 3500, paymentMethod: 'PIX', status: 'confirmado', date: '2026-02-15', paidDate: '2026-02-15' },
  { id: 't39', churchId: '1', type: 'receita', category: 'Oferta', description: 'Ofertas fevereiro', amount: 1200, paymentMethod: 'Dinheiro', status: 'confirmado', date: '2026-02-18', paidDate: '2026-02-18' },
  { id: 't40', churchId: '1', type: 'despesa', category: 'Aluguel', description: 'Aluguel fevereiro', amount: 3200, paymentMethod: 'Boleto', supplierId: 's1', status: 'confirmado', date: '2026-02-05', paidDate: '2026-02-08' },
  { id: 't41', churchId: '1', type: 'receita', category: 'Dízimo', description: 'Dízimos janeiro', amount: 3000, paymentMethod: 'PIX', status: 'confirmado', date: '2026-01-15', paidDate: '2026-01-15' },
  { id: 't42', churchId: '1', type: 'receita', category: 'Oferta', description: 'Ofertas janeiro', amount: 900, paymentMethod: 'Dinheiro', status: 'confirmado', date: '2026-01-18', paidDate: '2026-01-18' },
  { id: 't43', churchId: '1', type: 'despesa', category: 'Aluguel', description: 'Aluguel janeiro', amount: 3200, paymentMethod: 'Boleto', supplierId: 's1', status: 'confirmado', date: '2026-01-05', paidDate: '2026-01-08' },

  // --- NOVAS TRANSAÇÕES PARA APRESENTAÇÃO (Mês Atual/Recentes) ---
  { id: 't44', churchId: '1', type: 'receita', category: 'Oferta Especial', description: 'Bazar da Igreja', amount: 4500, paymentMethod: 'PIX', status: 'confirmado', date: '2026-06-05', paidDate: '2026-06-05' },
  { id: 't45', churchId: '2', type: 'receita', category: 'Dízimo', description: 'Dízimo junho', amount: 1200, paymentMethod: 'Transferência', memberId: 'm3', status: 'confirmado', date: '2026-06-10', paidDate: '2026-06-10' },
  { id: 't46', churchId: '3', type: 'receita', category: 'Cantina', description: 'Vendas cantina domingo', amount: 850, paymentMethod: 'Dinheiro', status: 'confirmado', date: '2026-06-12', paidDate: '2026-06-12' },
  { id: 't47', churchId: '4', type: 'despesa', category: 'Equipamentos', description: 'Microfones novos', amount: 1800, paymentMethod: 'Cartão Crédito', supplierId: 's4', status: 'confirmado', date: '2026-06-15', paidDate: '2026-06-15' },
  { id: 't48', churchId: '5', type: 'despesa', category: 'Eventos', description: 'Retiro de Jovens', amount: 3500, paymentMethod: 'Boleto', status: 'confirmado', date: '2026-06-20', paidDate: '2026-06-20' },
  { id: 't49', churchId: '1', type: 'despesa', category: 'Salários/Ajudas de Custo', description: 'Limpeza mensal', amount: 1500, paymentMethod: 'PIX', status: 'pendente', date: '2026-06-28', dueDate: '2026-06-30' },
  { id: 't50', churchId: '1', type: 'receita', category: 'Dízimo', description: 'Dízimos finais', amount: 5600, paymentMethod: 'PIX', status: 'confirmado', date: '2026-06-22', paidDate: '2026-06-22' },
];

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

export const MOCK_EVENT_GUEST: EventGuest[] = [
  { id: 'g1', eventId: 'e6', memberName: 'André Silva', memberPhone: '(11) 99999-9999', status: 'confirmado_pago', ticketPricePaid: 50 },
  { id: 'g2', eventId: 'e6', memberName: 'Juliana Costa', memberPhone: '(11) 98888-8888', status: 'confirmado_pago', ticketPricePaid: 50 },
  { id: 'g3', eventId: 'e6', memberName: 'Carlos Santos', memberPhone: '(11) 97777-7777', status: 'pendente', ticketPricePaid: 0 },
  { id: 'g4', eventId: 'e6', memberName: 'Patricia Lins', memberPhone: '(11) 94444-4444', status: 'confirmado_gratis', ticketPricePaid: 0 },
  { id: 'g5', eventId: 'e6', memberName: 'Aline Souza', memberPhone: '(21) 98765-4321', status: 'recusado', ticketPricePaid: 0 }
];

export const MOCK_EVENTS: ChurchEvent[] = [
  { id: 'e1', churchId: '1', title: 'Culto de Celebração', description: 'Culto de celebração de domingo à noite com toda a igreja.', type: 'culto', date: '2026-06-21', startTime: '19:00', endTime: '21:00', location: 'Templo Principal', isGlobal: false },
  { id: 'e2', churchId: '1', title: 'Culto de Ensino', description: 'Estudo bíblico e oração no meio da semana.', type: 'culto', date: '2026-06-24', startTime: '20:00', endTime: '21:30', location: 'Templo Principal', isGlobal: false },
  { id: 'e3', churchId: '1', title: 'Ensaio Geral da Banda', description: 'Ensaio da equipe de louvor e mídias associadas.', type: 'ensaio', departmentId: 'Louvor', date: '2026-06-27', startTime: '16:00', endTime: '18:00', location: 'Altar Principal', isGlobal: false },
  { id: 'e4', churchId: '1', title: 'Culto de Santa Ceia', description: 'Celebração da Ceia do Senhor na manhã de domingo.', type: 'culto', date: '2026-07-05', startTime: '09:00', endTime: '11:00', location: 'Templo Principal', isGlobal: false },
  { id: 'e5', churchId: '2', title: 'Culto da Família', description: 'Culto com foco nas famílias na filial da Zona Sul.', type: 'culto', date: '2026-06-21', startTime: '18:30', endTime: '20:30', location: 'Nave Central Filial', isGlobal: false },
  { id: 'e6', churchId: 'GLOBAL', title: 'Conferência Anual ChurchFlow', description: 'Nossa grande conferência de liderança e avivamento nacional.', type: 'conferencia', date: '2026-06-30', startTime: '09:00', endTime: '22:00', location: 'Sede - Auditório Principal', isGlobal: true, estimatedCost: 15000, actualCost: 14200, bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', paymentLink: 'https://stripe.com/demo-checkout', ticketPrice: 50, maxCapacity: 500 },
  { id: 'e7', churchId: '1', title: 'Reunião de Pastores', description: 'Alinhamento estratégico do ministério mensal.', type: 'reuniao', date: '2026-06-23', startTime: '14:00', endTime: '16:00', location: 'Sala de Conferências', isGlobal: false },
  { id: 'e8', churchId: '1', title: 'Ação Social - Entrega de Cestas', description: 'Ação mensal de distribuição de mantimentos pela equipe de evangelismo.', type: 'social', departmentId: 'Evangelismo', date: '2026-06-28', startTime: '08:00', endTime: '13:00', location: 'Estacionamento Sede', isGlobal: false, estimatedCost: 1200, actualCost: 1150 }
];

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

export const MOCK_ASSETS: Asset[] = [
  { id: 'a1', churchId: '1', name: 'Mesa de Som Digital Yamaha TF5', category: 'Equipamentos', condition: 'Bom', location: 'Templo Principal - Altar', purchaseValue: 18500, purchaseDate: '2025-02-10' },
  { id: 'a2', churchId: '1', name: 'Projetor Laser Epson 7000 lumens', category: 'Equipamentos', condition: 'Novo', location: 'Templo Principal - Galeria', purchaseValue: 12000, purchaseDate: '2025-11-20' },
  { id: 'a3', churchId: '1', name: 'Bateria Mapex Armory', category: 'Instrumentos', condition: 'Bom', location: 'Templo Principal - Altar', purchaseValue: 8500, purchaseDate: '2024-05-15' },
  { id: 'a4', churchId: '1', name: 'Ar Condicionado Cassete 60.000 BTUs', category: 'Estrutura', condition: 'Em Manutenção', location: 'Salão Social', purchaseValue: 6200, purchaseDate: '2023-10-05' },
  { id: 'a5', churchId: '2', name: 'Mesa de Som Analógica 16 Canais', category: 'Equipamentos', condition: 'Bom', location: 'Filial Zona Sul - Nave', purchaseValue: 2500, purchaseDate: '2025-01-12' },
  { id: 'a6', churchId: '2', name: 'Teclado Roland XPS-30', category: 'Instrumentos', condition: 'Novo', location: 'Filial Zona Sul - Altar', purchaseValue: 4800, purchaseDate: '2026-01-20' },
];

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

export const MOCK_KIDS: Kid[] = [
  { id: 'k1', name: 'Pedro Silva', birthDate: '2024-03-10', parentName: 'André Silva', parentPhone: '(11) 99999-9999', allergies: 'Sem alergias', churchId: '1' },
  { id: 'k2', name: 'Ana Costa', birthDate: '2021-07-20', parentName: 'Juliana Costa', parentPhone: '(11) 98888-8888', allergies: 'Intolerância a Lactose', churchId: '1' },
  { id: 'k3', name: 'Lucas Santos', birthDate: '2018-05-15', parentName: 'Carlos Santos', parentPhone: '(11) 97777-7777', allergies: 'Alergia a corante vermelho', churchId: '1' },
  { id: 'k4', name: 'Mariana Lins', birthDate: '2015-11-01', parentName: 'Patricia Lins', parentPhone: '(11) 94444-4444', churchId: '1' }
];

export const MOCK_KIDS_CHECKIN: KidCheckIn[] = [
  { id: 'c1', kidId: 'k1', kidName: 'Pedro Silva', room: 'Berçário', checkInTime: '18:45', securityCode: 'K-9382', parentName: 'André Silva', parentPhone: '(11) 99999-9999', status: 'presente' },
  { id: 'c2', kidId: 'k2', kidName: 'Ana Costa', room: 'Maternal', checkInTime: '18:50', securityCode: 'K-1049', parentName: 'Juliana Costa', parentPhone: '(11) 98888-8888', status: 'presente' }
];

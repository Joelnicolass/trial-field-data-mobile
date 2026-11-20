// El contrato entre la app y su servidor: qué forma tiene un mensaje, un dato,
// un miembro, un evento.
//
// Son tipos propios de la app. El dominio, los mappers y las pantallas
// dependen de este archivo, no del servidor de prueba: cambiar de servidor es
// escribir otro adaptador en `src/api/` que entregue estas mismas formas.

export type MemberId = string;

export type Member = {
  id: MemberId;
  name: string;
  short_name: string;
  role: 'owner' | 'manager' | 'worker' | 'vet' | 'agent';
  is_agent: boolean;
  watermark: number;
};

export type Opens = {
  view: 'data' | 'animal';
  section?: 'animals' | 'stock' | 'rainfall' | 'palpation';
  animal_id?: string;
  filter?: { category_id?: number; reproductive_status?: 'pregnant' | 'empty'; herd?: string; status?: 'active' } | null;
};

export type Field = {
  key: string;
  label: string;
  value: string | number | null;
  type: 'text' | 'number' | 'date';
  unit?: string;
};

export type Dato = {
  id: string;
  structure_name: 'vaccination' | 'rainfall';
  title: string;
  status: 'saved' | 'incomplete' | 'deleted';
  version: number;
  created_by: MemberId;
  fields: Field[];
  missing_fields: string[];
  suggestions: Record<string, string[]>;
  opens: Opens | null;
};

export type DatoChange = {
  dato_id: string;
  action: 'completed' | 'edited' | 'deleted';
  by: MemberId;
  version: number;
  status: Dato['status'];
  changes: { key: string; before: string | number | null; after: string | number | null }[];
};

export type Card = {
  title: string;
  value: number;
  unit: string;
  secondary: { value: number; unit: string; text: string } | null;
  date: string;
  opens: Opens | null;
};

export type Table = {
  title: string;
  columns: { key: string; label: string; type: 'text' | 'number' | 'date'; unit?: string }[];
  rows: Record<string, string | number | null>[];
};

export type MessageType = 'text' | 'audio' | 'photo' | 'system' | 'dato' | 'card' | 'table' | 'dato_change';

export type Message = {
  seq: number;
  message_id: string;
  sender_id: MemberId;
  type: MessageType;
  created_at: string;
  text: string | null;
  reply_to: number | null;
  mentions: MemberId[];
  local_id?: string;
  duration_ms?: number;
  transcript?: string | null;
  photo?: { width: number; height: number; color: string; description: string };
  dato?: Dato;
  card?: Card;
  table?: Table;
  dato_change?: DatoChange;
};

export type AgentMode = 'detect' | 'mention_only';

export type AgentStatus = 'idle' | 'thinking' | 'slow';

export type ServerEvent =
  | { type: 'message'; cursor: number; message: Message }
  | { type: 'typing'; member_id: MemberId }
  | { type: 'agent_status'; status: AgentStatus };

export type Unsent = {
  local_id: string;
  sender_id: MemberId;
  type: 'text';
  text: string;
  mentions: MemberId[];
  created_at: string;
};

export type ChatSnapshot = {
  id: string;
  name: string;
  agent_mode: AgentMode;
  me: MemberId;
  members: Member[];
  messages: Message[];
  unsent: Unsent[];
  cursor: number;
};

export type ErrorCode = 'no_connection' | 'stale_version' | 'no_changes' | 'invalid_value' | 'not_found';

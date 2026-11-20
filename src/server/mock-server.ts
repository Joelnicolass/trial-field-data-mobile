/**
 * mock-server.ts: simulated backend for the campo group chat.
 *
 * Put it next to mock-data.json and use it as-is. mock-data.json has the campo data
 * (stock, palpation, rainfall, animals); the group chat lives here.
 *
 *   const chat = await loadChat();
 *   const disconnect = connect((event) => { ... }, { after_cursor: chat.cursor });
 *   const message = await send({ local_id: 'l_1', text: '@agente cuántas cabezas hay?', reply_to: null });
 *   await completeDato({ local_id: 'l_2', dato_id: 'd_03', values: { vaccine: 'Aftosa bivalente' }, base_version: 1 });
 *   markRead(message.seq);
 *
 * - loadChat() is the initial fetch: members, history, what was left unsent and the current cursor.
 * - The group starts moving on the first connect(): about 30 seconds of activity.
 * - Every message reaches connect(), yours included. Yours carry the local_id you sent them with.
 * - `cursor` orders deliveries; `seq` orders the conversation. They are not the same.
 * - send() and completeDato() return a promise. They reject with a ServerError.
 *   Retrying with the same local_id never duplicates: if it already went through, you get the same message.
 * - `typing` has no end event: it lasts until that member sends something, or 6 s.
 * - setOnline(false) simulates no signal: nothing arrives and every call fails.
 *   setOnline(true) delivers what you missed.
 * - State lives in memory. To restart the demo, reload the whole app (Fast Refresh keeps it).
 */
import data from './mock-data.json';

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

export class ServerError extends Error {
  code: ErrorCode;
  dato?: Dato;
  field?: string;

  constructor(code: ErrorCode, extra: { dato?: Dato; field?: string } = {}) {
    super(code);
    this.name = 'ServerError';
    this.code = code;
    if (extra.dato) this.dato = clone(extra.dato);
    if (extra.field) this.field = extra.field;
  }
}

type Reply = {
  type: 'text' | 'card' | 'table' | 'dato';
  text: string | null;
  card?: Card;
  table?: Table;
  dato?: Dato;
  from_data?: 'stock' | 'palpation' | 'weights';
};

type Rule = {
  id: string;
  author: MemberId;
  requires_mention: boolean;
  only_if_detect: boolean;
  contains: string[];
  delay_ms: number;
  extract?: string;
  fail_first?: number;
  reply: Reply[];
};

type Values = Record<string, string | number>;
type Listener = (event: ServerEvent) => void;
type Draft = Partial<Message> & { sender_id: MemberId; type: MessageType };

const CHAT: Omit<ChatSnapshot, 'cursor'> = {
  id: 'g_01',
  name: 'La Aurora · Hacienda',
  agent_mode: 'detect',
  me: 'u_01',
  members: [
    {
      id: 'u_01',
      name: 'Héctor Etcheverry',
      short_name: 'Héctor',
      role: 'owner',
      is_agent: false,
      watermark: 107,
    },
    {
      id: 'u_02',
      name: 'Mariano Sosa',
      short_name: 'Mariano',
      role: 'manager',
      is_agent: false,
      watermark: 114,
    },
    {
      id: 'u_03',
      name: 'Ramón Benítez',
      short_name: 'Ramón',
      role: 'worker',
      is_agent: false,
      watermark: 111,
    },
    {
      id: 'u_04',
      name: 'Lucía Ferreyra',
      short_name: 'Lucía',
      role: 'vet',
      is_agent: false,
      watermark: 110,
    },
    { id: 'agent', name: 'Agente', short_name: 'agente', role: 'agent', is_agent: true, watermark: 114 },
  ],
  messages: [
    {
      seq: 95,
      message_id: 'm_95',
      sender_id: 'u_02',
      type: 'system',
      created_at: '2026-11-16T09:58:41-03:00',
      text: 'Mariano agregó a Lucía',
      reply_to: null,
      mentions: [],
    },
    {
      seq: 96,
      message_id: 'm_96',
      sender_id: 'u_04',
      type: 'text',
      created_at: '2026-11-16T10:02:13-03:00',
      text: 'Buen día. El martes 24 hago tacto de vaquillonas, ¿les queda bien?',
      reply_to: null,
      mentions: [],
    },
    {
      seq: 97,
      message_id: 'm_97',
      sender_id: 'u_02',
      type: 'text',
      created_at: '2026-11-16T10:15:50-03:00',
      text: 'Dale doctora, las junto el lunes a la tarde.',
      reply_to: 96,
      mentions: [],
    },
    {
      seq: 98,
      message_id: 'm_98',
      sender_id: 'u_02',
      type: 'photo',
      created_at: '2026-11-16T17:31:07-03:00',
      text: 'Así quedó la Pastura Norte',
      reply_to: null,
      mentions: [],
      photo: {
        width: 4000,
        height: 1200,
        color: '#7C8F5B',
        description: 'Panorámica de una pastura verde con agua en los bajos',
      },
    },
    {
      seq: 99,
      message_id: 'm_99',
      sender_id: 'u_03',
      type: 'audio',
      created_at: '2026-11-17T18:40:31-03:00',
      text: null,
      reply_to: null,
      mentions: [],
      duration_ms: 14000,
      transcript: 'hoy vacune doce terneros de la cabeza contra aftosa con el frasco nuevo',
    },
    {
      seq: 100,
      message_id: 'm_100',
      sender_id: 'agent',
      type: 'dato',
      created_at: '2026-11-17T18:40:38-03:00',
      text: 'Anoté la vacunación.',
      reply_to: 99,
      mentions: [],
      dato: {
        id: 'd_01',
        structure_name: 'vaccination',
        title: 'Vacunación',
        status: 'saved',
        version: 1,
        created_by: 'u_03',
        fields: [
          { key: 'animals', label: 'Animales', value: '12 terneros', type: 'text' },
          { key: 'herd', label: 'Rodeo', value: 'Cabeza de parición', type: 'text' },
          { key: 'vaccine', label: 'Vacuna', value: 'Aftosa bivalente', type: 'text' },
          { key: 'date', label: 'Fecha', value: '2026-11-17', type: 'date' },
        ],
        missing_fields: [],
        suggestions: {},
        opens: {
          view: 'data',
          section: 'animals',
          filter: { category_id: 3, herd: 'Cabeza de parición', status: 'active' },
        },
      },
    },
    {
      seq: 101,
      message_id: 'm_101',
      sender_id: 'u_03',
      type: 'photo',
      created_at: '2026-11-17T19:12:55-03:00',
      text: 'se rompio el bebedero del bajo',
      reply_to: null,
      mentions: [],
      photo: {
        width: 3024,
        height: 4032,
        color: '#5E6B57',
        description: 'Bebedero de chapa con el flotante roto y el agua desbordada',
      },
    },
    {
      seq: 102,
      message_id: 'm_102',
      sender_id: 'u_02',
      type: 'text',
      created_at: '2026-11-17T19:20:02-03:00',
      text: 'Mañana a primera hora lo arreglo, llevo flotante nuevo.',
      reply_to: 101,
      mentions: [],
    },
    {
      seq: 103,
      message_id: 'm_103',
      sender_id: 'u_03',
      type: 'text',
      created_at: '2026-11-18T06:58:12-03:00',
      text: 'llovieron 23 anoche en el casco',
      reply_to: null,
      mentions: [],
    },
    {
      seq: 104,
      message_id: 'm_104',
      sender_id: 'agent',
      type: 'dato',
      created_at: '2026-11-18T06:58:17-03:00',
      text: 'Anoté la lluvia.',
      reply_to: 103,
      mentions: [],
      dato: {
        id: 'd_02',
        structure_name: 'rainfall',
        title: 'Lluvia',
        status: 'saved',
        version: 1,
        created_by: 'u_03',
        fields: [
          { key: 'rainfall_mm', label: 'Milímetros', value: 23, type: 'number', unit: 'mm' },
          { key: 'gauge', label: 'Pluviómetro', value: 'Casco', type: 'text' },
          { key: 'date', label: 'Fecha', value: '2026-11-17', type: 'date' },
        ],
        missing_fields: [],
        suggestions: {},
        opens: { view: 'data', section: 'rainfall', filter: null },
      },
    },
    {
      seq: 105,
      message_id: 'm_105',
      sender_id: 'u_01',
      type: 'text',
      created_at: '2026-11-18T07:01:20-03:00',
      text: '@agente cuantas vacas preñadas tengo?',
      reply_to: null,
      mentions: ['agent'],
    },
    {
      seq: 106,
      message_id: 'm_106',
      sender_id: 'agent',
      type: 'text',
      created_at: '2026-11-18T07:01:25-03:00',
      text: 'Según el tacto del 14 de abril, tenés 151 vacas preñadas de 180 tactadas.',
      reply_to: 105,
      mentions: [],
    },
    {
      seq: 107,
      message_id: 'm_107',
      sender_id: 'agent',
      type: 'card',
      created_at: '2026-11-18T07:01:25-03:00',
      text: null,
      reply_to: null,
      mentions: [],
      card: {
        title: 'Preñez',
        value: 151,
        unit: 'vacas preñadas',
        secondary: { value: 83.9, unit: '%', text: 'de 180 tactadas' },
        date: '2026-04-14',
        opens: {
          view: 'data',
          section: 'animals',
          filter: { category_id: 1, reproductive_status: 'pregnant', status: 'active' },
        },
      },
    },
    {
      seq: 108,
      message_id: 'm_108',
      sender_id: 'u_03',
      type: 'text',
      created_at: '2026-11-18T07:04:02-03:00',
      text: 'vacune 8 vaquillonas de reposicion',
      reply_to: null,
      mentions: [],
    },
    {
      seq: 109,
      message_id: 'm_109',
      sender_id: 'agent',
      type: 'dato',
      created_at: '2026-11-18T07:04:08-03:00',
      text: 'Me falta qué vacuna usaste.',
      reply_to: 108,
      mentions: [],
      dato: {
        id: 'd_03',
        structure_name: 'vaccination',
        title: 'Vacunación',
        status: 'incomplete',
        version: 1,
        created_by: 'u_03',
        fields: [
          { key: 'animals', label: 'Animales', value: '8 vaquillonas', type: 'text' },
          { key: 'herd', label: 'Rodeo', value: 'Vaquillonas reposición', type: 'text' },
          { key: 'vaccine', label: 'Vacuna', value: null, type: 'text' },
          { key: 'date', label: 'Fecha', value: '2026-11-18', type: 'date' },
        ],
        missing_fields: ['vaccine'],
        suggestions: { vaccine: ['Aftosa bivalente', 'Reproductiva (IBR-DVB-Lepto)', 'Clostridial 8 vías', 'Querato'] },
        opens: { view: 'data', section: 'animals', filter: { category_id: 2, status: 'active' } },
      },
    },
    {
      seq: 110,
      message_id: 'm_110',
      sender_id: 'u_04',
      type: 'audio',
      created_at: '2026-11-18T07:05:11-03:00',
      text: null,
      reply_to: null,
      mentions: [],
      duration_ms: 38000,
      transcript: 'Ramón, si es la reproductiva acordate que la segunda dosis va a los veintiún días, anotalo así no se nos pasa. Y Mariano, para el martes necesito la manga limpia y dos personas. Arranco a las siete, así que si pueden tener las vaquillonas encerradas desde la noche anterior mejor, que en ayunas se tactan más fácil.',
    },
    {
      seq: 111,
      message_id: 'm_111',
      sender_id: 'u_03',
      type: 'audio',
      created_at: '2026-11-18T07:05:40-03:00',
      text: null,
      reply_to: null,
      mentions: [],
      duration_ms: 3000,
      transcript: null,
    },
    {
      seq: 112,
      message_id: 'm_112',
      sender_id: 'u_02',
      type: 'text',
      created_at: '2026-11-18T07:06:18-03:00',
      text: '@agente pasame los pesos promedio por categoria',
      reply_to: null,
      mentions: ['agent'],
    },
    {
      seq: 113,
      message_id: 'm_113',
      sender_id: 'agent',
      type: 'table',
      created_at: '2026-11-18T07:06:27-03:00',
      text: null,
      reply_to: 112,
      mentions: [],
      table: {
        title: 'Peso promedio por categoría',
        columns: [
          { key: 'category_name', label: 'Categoría', type: 'text' },
          { key: 'head_count', label: 'Cabezas', type: 'number' },
          { key: 'avg_weight_kg', label: 'Peso prom.', type: 'number', unit: 'kg' },
          { key: 'last_weighing_date', label: 'Último pesaje', type: 'date' },
        ],
        rows: [
          { category_name: 'Vaca', head_count: 186, avg_weight_kg: 446.1, last_weighing_date: '2026-04-14' },
          {
            category_name: 'Vaquillona',
            head_count: 74,
            avg_weight_kg: 321.1,
            last_weighing_date: '2026-11-04',
          },
          { category_name: 'Ternero', head_count: 61, avg_weight_kg: 83.4, last_weighing_date: '2026-11-10' },
          { category_name: 'Ternera', head_count: 57, avg_weight_kg: 84.8, last_weighing_date: '2026-11-10' },
          { category_name: 'Novillo', head_count: 29, avg_weight_kg: null, last_weighing_date: null },
          { category_name: 'Toro', head_count: 4, avg_weight_kg: 749.3, last_weighing_date: '2026-08-21' },
        ],
      },
    },
    {
      seq: 114,
      message_id: 'm_114',
      sender_id: 'u_02',
      type: 'text',
      created_at: '2026-11-18T07:08:44-03:00',
      text: '@Héctor el lunes hay que pasar la cola de parición a La Loma, el potrero 7 ya no da más.',
      reply_to: null,
      mentions: ['u_01'],
    },
  ],
  unsent: [
    {
      local_id: '0c9f6d2e-3b1a-4c55-9e7a-1f2d3c4b5a69',
      sender_id: 'u_01',
      type: 'text',
      text: '@agente cuantos terneros hay en el potrero 7?',
      mentions: ['agent'],
      created_at: '2026-11-18T07:02:06-03:00',
    },
  ],
};

const RULES: Rule[] = [
  {
    id: 'r_vaccine',
    author: 'agent',
    requires_mention: false,
    only_if_detect: true,
    contains: ['vacune', 'vacunamos'],
    delay_ms: 2000,
    extract: 'head_count',
    reply: [
      {
        type: 'dato',
        text: null,
        dato: {
          id: '',
          structure_name: 'vaccination',
          title: 'Vacunación',
          status: 'incomplete',
          version: 1,
          created_by: 'u_01',
          fields: [
            { key: 'head_count', label: 'Cabezas', value: null, type: 'number' },
            { key: 'vaccine', label: 'Vacuna', value: null, type: 'text' },
            { key: 'date', label: 'Fecha', value: '2026-11-18', type: 'date' },
          ],
          missing_fields: ['vaccine'],
          suggestions: { vaccine: ['Aftosa bivalente', 'Reproductiva (IBR-DVB-Lepto)', 'Clostridial 8 vías', 'Querato'] },
          opens: null,
        },
      },
    ],
  },
  {
    id: 'r_rain',
    author: 'agent',
    requires_mention: false,
    only_if_detect: true,
    contains: ['llovio', 'llovieron', 'lluvia de'],
    delay_ms: 1500,
    extract: 'rainfall_mm',
    reply: [
      {
        type: 'dato',
        text: null,
        dato: {
          id: '',
          structure_name: 'rainfall',
          title: 'Lluvia',
          status: 'saved',
          version: 1,
          created_by: 'u_01',
          fields: [
            { key: 'rainfall_mm', label: 'Milímetros', value: null, type: 'number', unit: 'mm' },
            { key: 'gauge', label: 'Pluviómetro', value: 'Casco', type: 'text' },
            { key: 'date', label: 'Fecha', value: '2026-11-18', type: 'date' },
          ],
          missing_fields: [],
          suggestions: {},
          opens: { view: 'data', section: 'rainfall', filter: null },
        },
      },
    ],
  },
  {
    id: 'r_lote_7',
    author: 'agent',
    requires_mention: true,
    only_if_detect: false,
    contains: ['potrero 7'],
    delay_ms: 3500,
    reply: [
      {
        type: 'text',
        text: 'En el potrero 7 hay 48 terneros al pie: 25 machos y 23 hembras. Uno nació anteayer y todavía no tiene caravana.',
      },
    ],
  },
  {
    id: 'r_weights',
    author: 'agent',
    requires_mention: true,
    only_if_detect: false,
    contains: ['peso', 'pesaje', 'kilos'],
    delay_ms: 9000,
    reply: [
      {
        type: 'table',
        text: null,
        table: {
          title: 'Peso promedio por categoría',
          columns: [
            { key: 'category_name', label: 'Categoría', type: 'text' },
            { key: 'head_count', label: 'Cabezas', type: 'number' },
            { key: 'avg_weight_kg', label: 'Peso prom.', type: 'number', unit: 'kg' },
            { key: 'last_weighing_date', label: 'Último pesaje', type: 'date' },
          ],
          rows: [
            { category_name: 'Vaca', head_count: 186, avg_weight_kg: 446.1, last_weighing_date: '2026-04-14' },
            {
              category_name: 'Vaquillona',
              head_count: 74,
              avg_weight_kg: 321.1,
              last_weighing_date: '2026-11-04',
            },
            { category_name: 'Ternero', head_count: 61, avg_weight_kg: 83.4, last_weighing_date: '2026-11-10' },
            { category_name: 'Ternera', head_count: 57, avg_weight_kg: 84.8, last_weighing_date: '2026-11-10' },
            { category_name: 'Novillo', head_count: 29, avg_weight_kg: null, last_weighing_date: null },
            { category_name: 'Toro', head_count: 4, avg_weight_kg: 749.3, last_weighing_date: '2026-08-21' },
          ],
        },
        from_data: 'weights',
      },
    ],
  },
  {
    id: 'r_stock',
    author: 'agent',
    requires_mention: true,
    only_if_detect: false,
    contains: ['stock', 'cabezas', 'cuantos animales'],
    delay_ms: 1500,
    reply: [
      { type: 'text', text: null, from_data: 'stock' },
      {
        type: 'card',
        text: null,
        card: {
          title: 'Stock',
          value: 411,
          unit: 'cabezas',
          secondary: null,
          date: '2026-11-18',
          opens: { view: 'data', section: 'stock', filter: null },
        },
        from_data: 'stock',
      },
    ],
  },
  {
    id: 'r_palpation',
    author: 'agent',
    requires_mention: true,
    only_if_detect: false,
    contains: ['preñ', 'tacto'],
    delay_ms: 1200,
    reply: [
      {
        type: 'card',
        text: null,
        card: {
          title: 'Preñez',
          value: 151,
          unit: 'vacas preñadas',
          secondary: { value: 83.9, unit: '%', text: 'de 180 tactadas' },
          date: '2026-04-14',
          opens: {
            view: 'data',
            section: 'animals',
            filter: { category_id: 1, reproductive_status: 'pregnant', status: 'active' },
          },
        },
        from_data: 'palpation',
      },
    ],
  },
  {
    id: 'r_identifier',
    author: 'agent',
    requires_mention: true,
    only_if_detect: false,
    contains: ['0042', 'caravana 42'],
    delay_ms: 1800,
    fail_first: 1,
    reply: [
      {
        type: 'text',
        text: 'La 0042 es una vaca Aberdeen Angus negro de la cabeza de parición. Dio preñada en el tacto de abril y pesó 471,5 kg.',
      },
      {
        type: 'card',
        text: null,
        card: {
          title: 'Caravana 0042',
          value: 471.5,
          unit: 'kg',
          secondary: null,
          date: '2026-04-14',
          opens: { view: 'animal', animal_id: 'a_0134' },
        },
      },
    ],
  },
  {
    id: 'r_mariano',
    author: 'u_02',
    requires_mention: true,
    only_if_detect: false,
    contains: [],
    delay_ms: 4000,
    reply: [{ type: 'text', text: 'Dale, ahora lo veo.' }],
  },
  {
    id: 'r_agent',
    author: 'agent',
    requires_mention: true,
    only_if_detect: false,
    contains: [],
    delay_ms: 1000,
    reply: [
      {
        type: 'text',
        text: 'Todavía no sé responder eso. Probá preguntarme por stock, preñez, pesos o una caravana.',
      },
    ],
  },
];

const ME = CHAT.me;
const members = clone(CHAT.members);
const AGENT = 'agent';
const NOW_MS = Date.parse(data.now);
const SAVED_TEXT: Record<Dato['structure_name'], string> = { vaccination: 'Anoté la vacunación.', rainfall: 'Anoté la lluvia.' };
const TITLE: Record<Dato['structure_name'], string> = { vaccination: 'la vacunación', rainfall: 'la lluvia' };
const MISSING_TEXT: Record<string, string> = { head_count: 'cuántos animales', vaccine: 'qué vacuna usaste', rainfall_mm: 'cuántos milímetros' };

const listeners = new Map<Listener, number>();
const feed: Message[] = [];
const history = new Map<string, Message>();
const byLabel = new Map<string, Message>();
const reserved = new Map<string, number>();
const datos = new Map<string, Dato>();
const unsent = new Set(CHAT.unsent.map((u) => u.local_id));
const results = new Map<string, Message>();
const inFlight = new Map<string, Promise<Message>>();
const failures = new Map<string, number>();
const agentJobs = new Map<number, boolean>();

let lastSeq = 0;
let datoCount = 0;
let jobCount = 0;
let agentStatus: AgentStatus = 'idle';
let startedAt: number | null = null;
let online = true;
let agentMode: AgentMode = CHAT.agent_mode;

for (const m of CHAT.messages) {
  lastSeq = Math.max(lastSeq, m.seq);
  history.set(m.message_id, m);
  byLabel.set(m.message_id, m);
  if (m.dato) {
    datos.set(m.dato.id, clone(m.dato));
    datoCount = Math.max(datoCount, Number(m.dato.id.replace('d_', '')));
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function later(ms: number, fn: () => void) {
  setTimeout(fn, ms);
}

function elapsed() {
  return startedAt === null ? 0 : Date.now() - startedAt;
}

function isoAt(ms: number) {
  return new Date(NOW_MS + ms - 3 * 3600 * 1000).toISOString().slice(0, 19) + '-03:00';
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function shortName(id: MemberId) {
  return members.find((m) => m.id === id)?.short_name ?? id;
}

function parseMentions(text: string) {
  const norm = normalize(text);
  return members.filter((m) => new RegExp('@' + normalize(m.short_name) + '(?![a-z0-9])').test(norm)).map((m) => m.id);
}

function numberAfter(text: string, keywords: string[]) {
  const norm = normalize(text);
  const at = keywords.map((k) => norm.indexOf(normalize(k))).filter((i) => i >= 0);
  const from = at.length > 0 ? Math.min(...at) : 0;
  const match = norm.slice(from).match(/\d+(?:[.,]\d+)?/) ?? norm.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(',', '.')) : null;
}

function broadcast(event: ServerEvent) {
  if (!online) return;
  for (const listener of [...listeners.keys()]) if (listeners.has(listener)) listener(clone(event));
}

function flush(listener: Listener) {
  while (online && listeners.has(listener)) {
    const cursor = listeners.get(listener)!;
    if (cursor >= feed.length) return;
    listeners.set(listener, cursor + 1);
    listener({ type: 'message', cursor: cursor + 1, message: clone(feed[cursor]) });
  }
}

function deliver(message: Message) {
  feed.push(clone(message));
  for (const listener of [...listeners.keys()]) flush(listener);
}

function setAgentJob(id: number, slow: boolean | null) {
  if (slow === null) agentJobs.delete(id);
  else agentJobs.set(id, slow);
  const next: AgentStatus = agentJobs.size === 0 ? 'idle' : [...agentJobs.values()].some(Boolean) ? 'slow' : 'thinking';
  if (next === agentStatus) return;
  agentStatus = next;
  broadcast({ type: 'agent_status', status: next });
}

function reserve(label: string) {
  reserved.set(label, ++lastSeq);
}

function seqOf(label: string) {
  return byLabel.get(label)?.seq ?? null;
}

function publish(draft: Draft, label?: string) {
  const seq = (label ? reserved.get(label) : undefined) ?? ++lastSeq;
  const message: Message = { seq, message_id: `m_${seq}`, created_at: isoAt(elapsed()), text: null, reply_to: null, mentions: [], ...draft };
  history.set(message.message_id, clone(message));
  if (label) byLabel.set(label, message);
  deliver(message);
  return message;
}

function redeliver(label: string) {
  const message = byLabel.get(label);
  if (message) deliver(message);
}

function validate(dato: Dato, values: Values) {
  const out: Values = {};
  for (const [key, raw] of Object.entries(values)) {
    const field = dato.fields.find((f) => f.key === key);
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (!field || value === '') throw new ServerError('invalid_value', { field: key });
    if (field.type === 'number') {
      const n = typeof value === 'number' ? value : Number(value.replace(',', '.'));
      if (!Number.isFinite(n) || n < 0) throw new ServerError('invalid_value', { field: key });
      out[key] = n;
    } else if (typeof value !== 'string') {
      throw new ServerError('invalid_value', { field: key });
    } else if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))) {
      throw new ServerError('invalid_value', { field: key });
    } else {
      out[key] = value;
    }
  }
  return out;
}

function applyChange(dato: Dato, by: MemberId, values: Values): DatoChange | null {
  const changes: DatoChange['changes'] = [];
  for (const [key, after] of Object.entries(values)) {
    const field = dato.fields.find((f) => f.key === key)!;
    if (field.value === after) continue;
    changes.push({ key, before: field.value, after });
    field.value = after;
  }
  if (changes.length === 0) return null;
  const wasIncomplete = dato.status === 'incomplete';
  dato.missing_fields = dato.fields.filter((f) => f.value === null).map((f) => f.key);
  dato.status = dato.missing_fields.length > 0 ? 'incomplete' : 'saved';
  dato.version += 1;
  const action = wasIncomplete && dato.status === 'saved' ? 'completed' : 'edited';
  return { dato_id: dato.id, action, by, version: dato.version, status: dato.status, changes };
}

function changeText(dato: Dato, change: DatoChange) {
  const unit = (key: string) => {
    const u = dato.fields.find((f) => f.key === key)?.unit;
    return u ? ` ${u}` : '';
  };
  const detail = change.changes
    .map((c) => (change.action === 'completed' || c.before === null ? `${c.after}${unit(c.key)}` : `${c.before} → ${c.after}${unit(c.key)}`))
    .join(', ');
  const verb = change.action === 'completed' ? 'completó' : 'corrigió';
  return `${shortName(change.by)} ${verb} ${TITLE[dato.structure_name]}: ${detail}`;
}

function changeDato(input: { dato_id: string; values: Values; base_version: number }, by: MemberId, local_id?: string) {
  const dato = datos.get(input.dato_id);
  if (!dato) throw new ServerError('not_found');
  const values = validate(dato, input.values);
  if (dato.version !== input.base_version) throw new ServerError('stale_version', { dato });
  const change = applyChange(dato, by, values);
  if (!change) throw new ServerError('no_changes', { dato });
  return publish({ sender_id: AGENT, type: 'dato_change', text: changeText(dato, change), dato_change: change, local_id });
}

function memberChange(by: MemberId, input: { dato_id: string; values: Values; base_version: number }) {
  try {
    changeDato(input, by);
  } catch {
    // Someone changed it first: this member sees it and lets it go.
  }
}

function matchRule(text: string, mentions: MemberId[], author: MemberId) {
  const norm = normalize(text);
  return RULES.find(
    (rule) =>
      rule.author !== author &&
      (rule.contains.length === 0 || rule.contains.some((word) => norm.includes(normalize(word)))) &&
      (!rule.requires_mention || mentions.includes(rule.author)) &&
      (!rule.only_if_detect || agentMode === 'detect' || mentions.includes(rule.author)),
  );
}

function fromData(item: Reply): Partial<Message> {
  const stock = data.stock;
  const p = data.palpation;
  if (item.from_data === 'stock' && item.card) return { card: { ...item.card, value: stock.total_head_count, date: stock.date } };
  if (item.from_data === 'stock') return { text: `Hoy hay ${stock.total_head_count} cabezas en el campo.` };
  if (item.from_data === 'palpation' && item.card) {
    return { card: { ...item.card, value: p.pregnant, date: p.date, secondary: { value: p.pregnancy_rate, unit: '%', text: `de ${p.palpated} tactadas` } } };
  }
  if (item.from_data === 'weights' && item.table) {
    const rows = stock.by_category.map((c) => ({
      category_name: c.category_name,
      head_count: c.head_count,
      avg_weight_kg: c.avg_weight_kg,
      last_weighing_date: c.last_weighing_date,
    }));
    return { table: { ...item.table, rows } };
  }
  return { text: item.text, card: item.card, table: item.table };
}

function buildReply(rule: Rule, item: Reply, source: Message, first: boolean): Draft {
  const base = { sender_id: rule.author, type: item.type, reply_to: first ? source.seq : null };
  if (item.type !== 'dato' || !item.dato) return { ...base, ...fromData(item) };
  const dato = clone(item.dato);
  dato.id = `d_${String(++datoCount).padStart(2, '0')}`;
  dato.created_by = source.sender_id;
  if (rule.extract) {
    const field = dato.fields.find((f) => f.key === rule.extract);
    if (field) field.value = numberAfter(source.text ?? '', rule.contains);
  }
  dato.missing_fields = dato.fields.filter((f) => f.value === null).map((f) => f.key);
  dato.status = dato.missing_fields.length > 0 ? 'incomplete' : 'saved';
  datos.set(dato.id, clone(dato));
  const text =
    dato.status === 'saved' ? SAVED_TEXT[dato.structure_name] : `Me falta ${dato.missing_fields.map((k) => MISSING_TEXT[k] ?? k).join(' y ')}.`;
  return { ...base, text, dato };
}

function answer(rule: Rule, source: Message) {
  const job = ++jobCount;
  const isAgent = rule.author === AGENT;
  later(300, () => (isAgent ? setAgentJob(job, false) : broadcast({ type: 'typing', member_id: rule.author })));
  if (isAgent && rule.delay_ms > 4500) later(4500, () => setAgentJob(job, true));
  later(rule.delay_ms, () => {
    rule.reply.forEach((item, i) => publish(buildReply(rule, item, source, i === 0)));
    if (isAgent) setAgentJob(job, null);
  });
}

function incoming(author: MemberId, text: string, label?: string) {
  const mentions = parseMentions(text);
  const message = publish({ sender_id: author, type: 'text', text, mentions }, label);
  const rule = matchRule(text, mentions, author);
  if (rule) answer(rule, message);
}

const SCRIPT: { at: number; run: () => void }[] = [
  { at: 2500, run: () => broadcast({ type: 'typing', member_id: 'u_03' }) },
  {
    at: 5000,
    run: () => publish({ sender_id: 'u_03', type: 'text', text: 'listo el bebedero, cambie el flotante', reply_to: seqOf('m_101') }, 'ramon_bebedero'),
  },
  { at: 8000, run: () => memberChange('u_02', { dato_id: 'd_02', values: { rainfall_mm: 25 }, base_version: 1 }) },
  { at: 10500, run: () => broadcast({ type: 'typing', member_id: 'u_04' }) },
  { at: 10800, run: () => broadcast({ type: 'typing', member_id: 'u_02' }) },
  {
    at: 14000,
    run: () => {
      reserve('mariano_gracias');
      publish({ sender_id: 'u_04', type: 'text', text: 'Fue la reproductiva, ya la completo.', reply_to: seqOf('m_109') }, 'lucia_reproductiva');
    },
  },
  {
    at: 14600,
    run: () =>
      publish({ sender_id: 'u_02', type: 'text', text: 'Gracias Ramón 👍', reply_to: seqOf('ramon_bebedero'), created_at: isoAt(13000) }, 'mariano_gracias'),
  },
  { at: 17000, run: () => memberChange('u_04', { dato_id: 'd_03', values: { vaccine: 'Reproductiva (IBR-DVB-Lepto)' }, base_version: 1 }) },
  { at: 19000, run: () => redeliver('lucia_reproductiva') },
  { at: 22000, run: () => incoming('u_02', '@agente cuantas cabezas tenemos hoy?') },
  { at: 27000, run: () => broadcast({ type: 'typing', member_id: 'u_03' }) },
];

function start() {
  if (startedAt !== null) return;
  startedAt = Date.now();
  for (const step of SCRIPT) later(step.at, step.run);
}

function request(local_id: string, run: () => Message, failNow = false): Promise<Message> {
  const running = inFlight.get(local_id);
  if (running) return running;
  const promise = new Promise<Message>((resolve, reject) => {
    if (!online || failNow) {
      later(1200, () => {
        inFlight.delete(local_id);
        reject(new ServerError('no_connection'));
      });
      return;
    }
    later(350, () => {
      inFlight.delete(local_id);
      try {
        const message = results.get(local_id) ?? run();
        results.set(local_id, message);
        if (online) resolve(clone(message));
        else reject(new ServerError('no_connection'));
      } catch (error) {
        reject(error);
      }
    });
  });
  inFlight.set(local_id, promise);
  return promise;
}

/** Initial fetch. Takes a moment, like a real request, and fails while offline. */
export function loadChat(): Promise<ChatSnapshot> {
  return new Promise((resolve, reject) => {
    later(600, () => {
      if (!online) return reject(new ServerError('no_connection'));
      const messages = [...history.values()].sort((a, b) => a.seq - b.seq);
      resolve(
        clone({
          ...CHAT,
          agent_mode: agentMode,
          members,
          messages,
          unsent: CHAT.unsent.filter((u) => unsent.has(u.local_id)),
          cursor: feed.length,
        }),
      );
    });
  });
}

/** Opens the live feed. Pass `after_cursor` to receive what was delivered after it. Returns a function that closes it. */
export function connect(onEvent: Listener, options: { after_cursor?: number } = {}) {
  const from = Math.max(0, Math.min(options.after_cursor ?? feed.length, feed.length));
  listeners.set(onEvent, from);
  setTimeout(() => {
    if (!online || !listeners.has(onEvent)) return;
    onEvent({ type: 'agent_status', status: agentStatus });
    flush(onEvent);
  }, 0);
  start();
  return () => {
    listeners.delete(onEvent);
  };
}

/** Sends a text message. `local_id` is yours: generate it once per message and reuse it to retry. */
export function send(input: { local_id: string; text: string; reply_to?: number | null }): Promise<Message> {
  const mentions = parseMentions(input.text);
  const rule = matchRule(input.text, mentions, ME);
  let failNow = false;
  if (rule?.fail_first && online && !results.has(input.local_id) && !inFlight.has(input.local_id)) {
    const failed = failures.get(rule.id) ?? 0;
    failNow = failed < rule.fail_first;
    if (failNow) failures.set(rule.id, failed + 1);
  }
  return request(
    input.local_id,
    () => {
      unsent.delete(input.local_id);
      const message = publish({ sender_id: ME, type: 'text', text: input.text, reply_to: input.reply_to ?? null, mentions, local_id: input.local_id });
      if (rule) answer(rule, message);
      return message;
    },
    failNow,
  );
}

/** Completes or corrects a dato from its card. Resolves with the resulting dato_change message. */
export function completeDato(input: { local_id: string; dato_id: string; values: Values; base_version: number }): Promise<Message> {
  return request(input.local_id, () => changeDato(input, ME, input.local_id));
}

/** Marks everything up to `seq` as read by you. The next loadChat() returns your watermark updated. */
export function markRead(seq: number) {
  const me = members.find((m) => m.id === ME);
  if (me) me.watermark = Math.max(me.watermark, seq);
}

/** Simulates losing and getting back signal. */
export function setOnline(value: boolean) {
  online = value;
  if (!online) return;
  for (const listener of [...listeners.keys()]) {
    if (!listeners.has(listener)) continue;
    listener({ type: 'agent_status', status: agentStatus });
    flush(listener);
  }
}

export function setAgentMode(mode: AgentMode) {
  agentMode = mode;
}

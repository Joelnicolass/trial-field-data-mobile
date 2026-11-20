// Lo que la pantalla del grupo espera recibir. Son textos ya escritos y
// decisiones ya tomadas: ningún componente tiene que saber de `seq`, de
// fechas ISO, de unidades ni de `null`. Lo arma `mappers.ts`.

import type { Opens } from '@/server/mock-server';
import type { TagStatus } from '@/ui/Tag';

/** Adónde lleva una tarjeta en Campo. La pantalla solo lo pasa a quien navega. */
export type OpenTarget = Opens;

/** En qué está un mensaje mío. Los de los demás no tienen estado. */
export type DeliveryStatus = 'sending' | 'sent' | 'failed';

export type QuoteModel = {
  author: string;
  /** Una línea del mensaje citado. */
  snippet: string;
};

/** Lo que hace falta para responderle a un mensaje: cuál es y cómo se lo cita. */
export type ReplyTarget = { seq: number; quote: QuoteModel };

/** Alguien a quien se puede mencionar. */
export type MentionOption = {
  key: string;
  /** Lo que va después de la "@": "Mariano", "agente". */
  name: string;
  /** Quién es, en una línea: "Mariano Sosa · encargado". */
  detail: string;
  isAgent: boolean;
};

/** El contenido del globo de una persona. */
export type PersonBody =
  | { kind: 'text'; text: string }
  | { kind: 'audio'; duration: string; transcript: string | null }
  | { kind: 'photo'; color: string; aspectRatio: number; description: string; caption: string | null };

export type FieldModel = { label: string; value: string };

export type MissingFieldModel = {
  key: string;
  label: string;
  suggestions: string[];
  /** Para abrir el teclado de números. */
  numeric: boolean;
  placeholder: string;
  /** Qué pasó con el valor que se mandó, si el servidor lo rechazó. */
  error: string | null;
};

export type DatoModel = {
  datoId: string;
  /** La versión que se está viendo: se manda al completar, para detectar si otro lo cambió antes. */
  version: number;
  title: string;
  status: { label: string; tag: TagStatus };
  incomplete: boolean;
  /** Lo que dijo el agente al anotarlo. `null` si el dato cambió después. */
  intro: string | null;
  /** El número principal, si el dato tiene uno con unidad: "25 mm". */
  headline: string | null;
  fields: FieldModel[];
  missing: MissingFieldModel[];
  /** Se está guardando lo que se completó. */
  saving: boolean;
  /** Por qué no se guardó, ya escrito. `null` si no hubo error. */
  error: string | null;
  /** Adónde lleva en Campo, si lleva a algún lado. */
  opens: OpenTarget | null;
};

export type MetricModel = {
  /** "Preñez · 14/04". */
  title: string;
  value: string;
  unit: string;
  /** "83,9 % de 180 tactadas". */
  secondary: string | null;
  opens: OpenTarget | null;
};

export type TableModel = {
  title: string;
  columns: { label: string; align: 'left' | 'right' }[];
  /** Las celdas ya formateadas, fila por fila. */
  rows: string[][];
};

/** Lo que manda el agente: siempre va en una tarjeta. */
export type AgentContent =
  | { kind: 'text'; text: string }
  | { kind: 'dato'; dato: DatoModel }
  | { kind: 'metric'; metric: MetricModel }
  | { kind: 'table'; table: TableModel };

/** Un renglón de la lista del grupo. */
export type GroupRow =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'unread'; key: string; label: string }
  | { kind: 'line'; key: string; text: string; isChange: boolean }
  | {
      kind: 'person';
      key: string;
      /** "Ramón · peón". `null` en los míos, que van sin nombre. */
      author: string | null;
      isMine: boolean;
      mentionsMe: boolean;
      time: string;
      quote: QuoteModel | null;
      body: PersonBody;
      delivery: DeliveryStatus | null;
      /** Para reintentar. Solo en lo mío que todavía no salió. */
      localId: string | null;
      /** Para responderle. `null` en lo mío que todavía no salió. */
      reply: ReplyTarget | null;
    }
  | {
      kind: 'agent';
      key: string;
      time: string;
      /** Falso cuando el renglón de arriba también es del agente. */
      showLabel: boolean;
      content: AgentContent;
      reply: ReplyTarget;
    };

export type ActivityModel = { text: string; slow: boolean };

export type GroupScreenModel = {
  title: string;
  /** La segunda línea de la barra superior. */
  statusLine: string;
  rows: GroupRow[];
  /** En qué renglón abrir: lo primero sin leer o, si no hay, el último. */
  initialIndex: number;
  /** Lo que pasa ahora, al pie de la lista. */
  activity: ActivityModel[];
  /** Un aviso para mostrar abajo, ya escrito. `null` si no hay. */
  notice: string | null;
  /** A quién se puede mencionar: todos menos yo. */
  mentionOptions: MentionOption[];
};

// Lo que la pantalla "Info del grupo" espera recibir: textos ya escritos y
// decisiones ya tomadas. Ningún componente tiene que saber de `watermark`,
// de `seq` ni de fechas ISO. Lo arma `mappers.ts`.

import type { AgentMode } from '@/server/mock-server';

/** Un modo del agente. La pantalla solo lo pasa a quien lo cambia. */
export type AgentModeKey = AgentMode;

export type MemberModel = {
  key: string;
  /** El nombre completo: "Mariano Sosa". */
  name: string;
  /** Quién es, en una línea: su rol o, en el agente, lo que hace. */
  detail: string;
  /** Soy yo: lleva la marca "Vos". */
  isMe: boolean;
  /** El agente no es una persona: va con su ícono y su color. */
  isAgent: boolean;
};

export type AgentModeOption = {
  key: AgentModeKey;
  /** Corta, para que entren las dos en un teléfono angosto: "Anota solo". */
  label: string;
  active: boolean;
};

export type AgentModeModel = {
  /** Los modos que hay, con el actual marcado. */
  options: AgentModeOption[];
  /** Qué hace el agente en el modo actual, en una línea. */
  explanation: string;
};

/** Un mensaje mío y quién lo vio. */
export type SeenMessageModel = {
  key: string;
  /** Una línea de lo que decía. */
  snippet: string;
  /** La hora si es de hoy; si no, el día: "07:01", "Ayer", "16/11". */
  when: string;
  /** Si lo vio alguien. */
  seen: boolean;
  /** "Lo vieron Mariano y Lucía", "Lo vio Mariano", "Todavía no lo vio nadie". */
  seenBy: string;
};

export type GroupInfoModel = {
  /** El nombre del grupo: va en la barra superior. */
  groupName: string;
  /** "5 integrantes". */
  membersTitle: string;
  /** Las personas primero y el agente al final. */
  members: MemberModel[];
  agentMode: AgentModeModel;
  /** Mis últimos mensajes, del más nuevo al más viejo. */
  myMessages: SeenMessageModel[];
  /** Lo que se dice en lugar de la lista si no mandé ninguno. `null` si mandé. */
  noMessagesText: string | null;
};

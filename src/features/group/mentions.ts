// Mencionar a alguien: qué se lleva escrito después de la "@", a quién
// coincide y cómo queda el texto al elegir. Funciones puras.

import type { MentionOption } from './model';

// Una "@" al principio o después de un espacio, y lo que se haya escrito del
// nombre hasta el final del texto.
const OPEN_MENTION = /(^|\s)@([\p{L}\d]*)$/u;

/** Lo que se lleva escrito del nombre. `null` si no se está mencionando a nadie. */
export function mentionQuery(draft: string): string | null {
  return draft.match(OPEN_MENTION)?.[2] ?? null;
}

/**
 * A quiénes sugerir: aquellos cuyo nombre empieza con lo escrito. No mira
 * acentos ni mayúsculas, así "@lu" encuentra a Lucía y "@ramon" a Ramón.
 */
export function matchMentions(options: MentionOption[], draft: string): MentionOption[] {
  const query = mentionQuery(draft);
  if (query === null) return [];

  const wanted = plain(query);
  return options.filter((option) => plain(option.name).startsWith(wanted));
}

/** El texto con la mención completa en lugar de lo que se venía escribiendo. */
export function applyMention(draft: string, name: string): string {
  return draft.replace(OPEN_MENTION, (_match, before: string) => `${before}@${name} `);
}

/** Suma una "@" al final para empezar a mencionar. Si ya hay una abierta, no cambia nada. */
export function startMention(draft: string): string {
  if (mentionQuery(draft) !== null) return draft;
  return draft === '' || /\s$/.test(draft) ? `${draft}@` : `${draft} @`;
}

/** Sin acentos y en minúsculas, para comparar. */
function plain(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

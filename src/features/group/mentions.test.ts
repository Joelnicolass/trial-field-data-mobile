import { applyMention, matchMentions, mentionQuery, startMention } from './mentions';
import type { MentionOption } from './model';

const options: MentionOption[] = [
  { key: 'agent', name: 'agente', detail: 'anota datos y responde consultas', isAgent: true },
  { key: 'u_02', name: 'Mariano', detail: 'Mariano Sosa · encargado', isAgent: false },
  { key: 'u_03', name: 'Ramón', detail: 'Ramón Benítez · peón', isAgent: false },
  { key: 'u_04', name: 'Lucía', detail: 'Lucía Ferreyra · veterinaria', isAgent: false },
];

const names = (found: MentionOption[]) => found.map((option) => option.name);

describe('mentionQuery', () => {
  it('devuelve lo escrito después de la última "@"', () => {
    expect(mentionQuery('@')).toBe('');
    expect(mentionQuery('che @mar')).toBe('mar');
  });

  it('no hay mención si el texto no termina en una', () => {
    expect(mentionQuery('hola')).toBeNull();
    expect(mentionQuery('@Mariano ')).toBeNull();
  });

  it('una "@" pegada a una palabra no es una mención', () => {
    expect(mentionQuery('correo@mar')).toBeNull();
  });
});

describe('matchMentions', () => {
  it('con la "@" sola sugiere a todos', () => {
    expect(names(matchMentions(options, 'che @'))).toEqual(['agente', 'Mariano', 'Ramón', 'Lucía']);
  });

  it('achica la lista a medida que se escribe el nombre', () => {
    expect(names(matchMentions(options, '@ma'))).toEqual(['Mariano']);
  });

  it('no mira acentos ni mayúsculas', () => {
    expect(names(matchMentions(options, '@RAMON'))).toEqual(['Ramón']);
    expect(names(matchMentions(options, '@lucí'))).toEqual(['Lucía']);
  });

  it('no sugiere nada si nadie coincide o no hay mención', () => {
    expect(matchMentions(options, '@zz')).toEqual([]);
    expect(matchMentions(options, 'hola')).toEqual([]);
  });
});

describe('applyMention', () => {
  it('completa el nombre y deja un espacio para seguir escribiendo', () => {
    expect(applyMention('che @ma', 'Mariano')).toBe('che @Mariano ');
    expect(applyMention('@', 'agente')).toBe('@agente ');
  });

  it('después de completar ya no hay mención abierta', () => {
    expect(mentionQuery(applyMention('@lu', 'Lucía'))).toBeNull();
  });
});

describe('startMention', () => {
  it('suma la "@" separada de lo que ya estaba escrito', () => {
    expect(startMention('')).toBe('@');
    expect(startMention('hola')).toBe('hola @');
    expect(startMention('hola ')).toBe('hola @');
  });

  it('no suma otra si ya hay una abierta', () => {
    expect(startMention('hola @ma')).toBe('hola @ma');
  });
});

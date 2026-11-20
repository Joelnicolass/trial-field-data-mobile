import { pickPhrase, VOICE_PHRASES, WAVE_STEP_MS, waveLevels } from './voice';

describe('pickPhrase', () => {
  it('elige una frase de la lista según el número al azar', () => {
    expect(pickPhrase(0)).toBe(VOICE_PHRASES[0]);
    expect(pickPhrase(0.999)).toBe(VOICE_PHRASES[VOICE_PHRASES.length - 1]);
  });

  it('todas las frases son algo que el agente entiende', () => {
    // Las palabras que el servidor reconoce, sin acentos.
    const understood = ['vacunamos', 'llovieron', 'cabezas', 'tacto', 'peso', 'potrero 7'];
    for (const phrase of VOICE_PHRASES) {
      expect(understood.some((word) => phrase.includes(word))).toBe(true);
    }
  });
});

describe('waveLevels', () => {
  it('devuelve siempre la misma cantidad de barras', () => {
    expect(waveLevels(0)).toHaveLength(waveLevels(5000).length);
  });

  it('la onda se corre un lugar en cada paso', () => {
    const before = waveLevels(0);
    const after = waveLevels(WAVE_STEP_MS);

    expect(after).not.toEqual(before);
    expect(after.slice(0, -1)).toEqual(before.slice(1));
  });
});

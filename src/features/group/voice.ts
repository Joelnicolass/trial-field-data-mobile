// El micrófono es de mentira: no graba. Al "enviar el audio" se manda una de
// estas frases como texto, que es lo único que acepta el servidor. Están
// escritas para que el agente las entienda: unas cuentan un dato y otras son
// consultas.
export const VOICE_PHRASES = [
  'Hoy vacunamos 35 terneros en la manga',
  'Anoche llovieron 14 milímetros en el casco',
  '@agente cuántas cabezas hay en el campo',
  '@agente cuántas vacas quedaron preñadas en el último tacto',
  '@agente cuál es el peso promedio por categoría',
  '@agente cuántos terneros hay en el potrero 7',
];

/** Un audio nunca dura menos que esto, aunque se lo corte enseguida. */
export const MIN_VOICE_MS = 1000;

/** Elige una frase. `random` va de 0 a 1 sin llegar a 1, como `Math.random()`. */
export function pickPhrase(random: number): string {
  return VOICE_PHRASES[Math.floor(random * VOICE_PHRASES.length)] ?? VOICE_PHRASES[0];
}

// El dibujo de la onda mientras se graba: siempre las mismas alturas, que se
// van corriendo con el tiempo para que parezca que se mueve.
const WAVE = [6, 12, 20, 10, 24, 14, 8, 18, 22, 12, 16, 6, 20, 10, 24, 14];
// Más de las que entran en un teléfono: la onda llena el ancho y lo que sobra se corta.
const WAVE_BARS = 48;
/** Cada cuánto se corre la onda un lugar. */
export const WAVE_STEP_MS = 120;

/** Las alturas de las barras de la onda a esta altura de la grabación. */
export function waveLevels(elapsedMs: number): number[] {
  const shift = Math.floor(elapsedMs / WAVE_STEP_MS);
  return Array.from({ length: WAVE_BARS }, (_, index) => WAVE[(index + shift) % WAVE.length]);
}

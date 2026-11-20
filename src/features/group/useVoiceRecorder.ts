import { useEffect, useState } from 'react';

import { formatDuration } from '@/domain/format';

import { MIN_VOICE_MS, WAVE_STEP_MS, waveLevels } from './voice';

/**
 * Un grabador de mentira: no usa el micrófono, solo lleva el reloj de la
 * grabación y arma lo que se dibuja mientras dura.
 */
export function useVoiceRecorder() {
  /** Cuándo empezó la grabación en curso. `null` si no se está grabando. */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  // El reloj corre solo mientras se graba.
  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), WAVE_STEP_MS);
    return () => clearInterval(timer);
  }, [startedAt]);

  return {
    recording: startedAt !== null,
    /** El reloj, ya escrito: "0:03". */
    elapsed: formatDuration(elapsedMs),
    /** Las alturas de la onda en este momento. */
    levels: waveLevels(elapsedMs),
    /** El punto rojo: prendido medio segundo, apagado el otro medio. */
    dotOn: Math.floor(elapsedMs / 500) % 2 === 0,

    start: () => {
      setElapsedMs(0);
      setStartedAt(Date.now());
    },
    /** Descarta la grabación. */
    cancel: () => setStartedAt(null),
    /** Termina la grabación y devuelve cuánto duró, en milisegundos. */
    finish: (): number => {
      const duration = startedAt === null ? 0 : Date.now() - startedAt;
      setStartedAt(null);
      return Math.max(duration, MIN_VOICE_MS);
    },
  };
}

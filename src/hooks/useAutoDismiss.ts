import { useEffect } from 'react';

/**
 * Cierra algo solo, pasado un tiempo. Sirve para un aviso que dura 7 segundos
 * o para un "escribiendo…" que se apaga a los 6.
 *
 * Mientras `active` es falso no hace nada. Si `active` vuelve a ser verdadero,
 * la cuenta empieza de nuevo.
 */
export function useAutoDismiss(active: boolean, onDismiss: () => void, delayMs: number) {
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(onDismiss, delayMs);
    return () => clearTimeout(timer);
    // `onDismiss` queda afuera a propósito: si quien llama pasa una función
    // nueva en cada render, la cuenta no tiene que reiniciarse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, delayMs]);
}

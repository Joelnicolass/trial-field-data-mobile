import type { ReactNode } from 'react';

import { useChatStore } from '@/store/chatStore';
import { ScreenHeader } from '@/ui/ScreenHeader';

import { statusLine } from './statusLine';

type Props = {
  /** Los botones de la derecha. */
  right: ReactNode;
};

// La barra de arriba del grupo: el nombre y, debajo, quién escribe o cuántos
// son. Se suscribe por su cuenta, así lo que cambia acá no redibuja la lista.
export function GroupHeader({ right }: Props) {
  const title = useChatStore((state) => state.chat?.name ?? 'Grupo');
  // Devuelve un texto: la barra se redibuja solo cuando ese texto cambia.
  const subtitle = useChatStore((state) => (state.chat ? statusLine(state.chat) : undefined));

  return <ScreenHeader title={title} subtitle={subtitle} right={right} />;
}

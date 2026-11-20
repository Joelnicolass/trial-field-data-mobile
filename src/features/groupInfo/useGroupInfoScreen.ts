import { useMemo } from 'react';

import { useNow } from '@/hooks/useNow';
import { useChatStore } from '@/store/chatStore';

import { toGroupInfo } from './mappers';

/**
 * Lo que la pantalla "Info del grupo" necesita, ya listo para dibujar.
 *
 *   servidor → datos (store) → mappers → pantalla
 *
 * No carga nada: lee el grupo que ya cargó la pestaña Grupo. Si todavía no
 * está, `model` es `null`.
 */
export function useGroupInfoScreen() {
  const chat = useChatStore((state) => state.chat);
  const setAgentMode = useChatStore((state) => state.setAgentMode);
  const now = useNow();

  // Se calcula al dibujar: no se guarda en otro estado.
  const model = useMemo(() => (chat ? toGroupInfo(chat, now) : null), [chat, now]);

  return { model, setAgentMode };
}

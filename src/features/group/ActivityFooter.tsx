import { useMemo } from 'react';
import { View } from 'react-native';

import { useChatStore } from '@/store/chatStore';
import { space } from '@/ui/theme';

import { ActivityLine } from './ActivityLine';
import { toActivity } from './mappers';
import { typingActivity } from './statusLine';

// Lo que pasa ahora, al pie de la lista: quién escribe y si el agente piensa
// o tarda. Se suscribe por su cuenta: cuando alguien escribe se redibuja esto
// y no la lista.
export function ActivityFooter() {
  // Los dos selectores devuelven un texto: el store avisa solo si el texto cambia.
  const typing = useChatStore((state) => (state.chat ? typingActivity(state.chat) : null));
  const agentStatus = useChatStore((state) => state.chat?.agentStatus ?? 'idle');
  const activity = useMemo(() => toActivity(typing, agentStatus), [typing, agentStatus]);

  return (
    <View style={{ paddingHorizontal: space[16], paddingBottom: space[12], gap: space[8] }}>
      {activity.map((line) => (
        <ActivityLine key={line.text} text={line.text} slow={line.slow} />
      ))}
    </View>
  );
}

import type { Dato, Member, Message, Opens } from '@/server/mock-server';

import { AgentMessage } from './AgentMessage';
import { CenterLine } from './CenterLine';
import { PersonMessage, type DeliveryStatus } from './PersonMessage';
import type { Quote } from './ReplyQuote';

type Props = {
  message: Message;
  sender: Member;
  isMine: boolean;
  mentionsMe: boolean;
  quote?: Quote;
  /** El dato de este mensaje como está ahora. */
  dato?: Dato;
  /** Falso cuando el mensaje anterior también es del agente. */
  showAgentLabel: boolean;
  deliveryStatus?: DeliveryStatus;
  onRetry?: () => void;
  onOpen?: (opens: Opens) => void;
  onComplete?: (datoId: string, values: Record<string, string>) => void;
};

// Un mensaje del chat. Acá se decide con qué pieza se dibuja:
// una línea, una tarjeta del agente o el globo de una persona.
export function MessageRow({ message, sender, isMine, mentionsMe, quote, dato, showAgentLabel, deliveryStatus, onRetry, onOpen, onComplete }: Props) {
  if (message.type === 'system') {
    return <CenterLine text={message.text ?? ''} />;
  }

  // Quién cambió un dato: queda como una línea donde pasó.
  if (message.type === 'dato_change') {
    return <CenterLine icon="edit-3" text={message.text ?? ''} />;
  }

  if (sender.is_agent) {
    return <AgentMessage message={message} dato={dato} showLabel={showAgentLabel} onOpen={onOpen} onComplete={onComplete} />;
  }

  return (
    <PersonMessage
      message={message}
      sender={sender}
      isMine={isMine}
      mentionsMe={mentionsMe}
      quote={quote}
      deliveryStatus={deliveryStatus}
      onRetry={onRetry}
    />
  );
}

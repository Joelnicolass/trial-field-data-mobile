import { AppText, fontFamily } from '@/ui/AppText';
import { color } from '@/ui/theme';

type Props = {
  text: string;
};

// Una mención es "@" seguido de un nombre: "@Héctor", "@agente".
const MENTION = /(@[\p{L}\d]+)/u;

// El texto de un mensaje, con las menciones resaltadas.
export function MentionText({ text }: Props) {
  // `split` con un grupo deja las menciones en las posiciones impares.
  const parts = text.split(MENTION);

  return (
    <AppText tone="tinta">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <AppText key={index} style={{ color: color.primario, fontFamily: fontFamily('600') }}>
            {part}
          </AppText>
        ) : (
          part
        ),
      )}
    </AppText>
  );
}

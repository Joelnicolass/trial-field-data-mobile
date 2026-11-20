import { ScrollView, View, type ViewStyle } from 'react-native';

import { AppText } from '@/ui/AppText';
import { Card } from '@/ui/Card';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Tag } from '@/ui/Tag';
import { color, space } from '@/ui/theme';

import type { AgentModeKey, GroupInfoModel, MemberModel, SeenMessageModel } from './model';

type Props = {
  model: GroupInfoModel;
  /** Se eligió un modo para el agente. */
  onChangeAgentMode: (mode: AgentModeKey) => void;
};

// Un renglón de una lista dentro de una tarjeta: una línea fina lo separa del de arriba.
const ROW: ViewStyle = { paddingVertical: space[8], borderTopWidth: 1, borderTopColor: color.divisor };

// La info del grupo, un bloque por tarjeta: quiénes están, en qué modo está
// el agente y quién vio lo que mandé. Solo dibuja: los textos vienen escritos.
export function GroupInfoView({ model, onChangeAgentMode }: Props) {
  return (
    <ScrollView style={{ backgroundColor: color.fondo }} contentContainerStyle={{ padding: space[16], gap: space[16] }}>
      <Card title={model.membersTitle}>
        <View>
          {model.members.map((member) => (
            <MemberRow key={member.key} member={member} />
          ))}
        </View>
      </Card>

      <Card>
        {/* El agente no es una persona: su tarjeta lleva su ícono y su color. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
          <Icon name="cpu" size={18} tint={color.teal} />
          <AppText variant="h4" tone="tinta">
            Modo del agente
          </AppText>
        </View>
        {/* Si las dos opciones no entran en un renglón, la segunda baja. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[8] }}>
          {model.agentMode.options.map((option) => (
            <Chip key={option.key} label={option.label} selected={option.active} onPress={() => onChangeAgentMode(option.key)} />
          ))}
        </View>
        <AppText>{model.agentMode.explanation}</AppText>
      </Card>

      <Card title="Quién vio tus mensajes">
        {model.noMessagesText ? (
          <AppText tone="secundario">{model.noMessagesText}</AppText>
        ) : (
          <View>
            {model.myMessages.map((message) => (
              <SeenRow key={message.key} message={message} />
            ))}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

function MemberRow({ member }: { member: MemberModel }) {
  return (
    <View style={[ROW, { flexDirection: 'row', alignItems: 'center', gap: space[12] }]}>
      <Icon name={member.isAgent ? 'cpu' : 'user'} size={18} tint={member.isAgent ? color.teal : color.secundario} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[8] }}>
          {/* `flexShrink` deja que un nombre largo se corte sin sacar la marca de la pantalla. */}
          <AppText weight="600" tone={member.isAgent ? 'teal' : 'tinta'} numberOfLines={1} style={{ flexShrink: 1 }}>
            {member.name}
          </AppText>
          {member.isMe ? <Tag label="Vos" status="info" compact /> : null}
        </View>
        <AppText variant="caption" tone="secundario">
          {member.detail}
        </AppText>
      </View>
    </View>
  );
}

function SeenRow({ message }: { message: SeenMessageModel }) {
  return (
    <View style={[ROW, { gap: space[4] }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[12] }}>
        <AppText tone="tinta" numberOfLines={1} style={{ flex: 1 }}>
          {message.snippet}
        </AppText>
        <AppText variant="caption" tone="secundario" tabular>
          {message.when}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space[4] }}>
        <Icon name={message.seen ? 'eye' : 'eye-off'} size={14} tint={color.secundario} />
        <AppText variant="caption" tone="secundario" style={{ flex: 1 }}>
          {message.seenBy}
        </AppText>
      </View>
    </View>
  );
}

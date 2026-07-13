import { Button as SwiftButton, Host, Text as SwiftText } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled as disabledModifier, font, tint } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'prominent' | 'glass' | 'destructive';
  tintColor?: string;
  disabled?: boolean;
};

/** Native SwiftUI button for iOS. */
export function UiButton({ label, onPress, variant = 'glass', tintColor, disabled = false }: Props) {
  const theme = useTheme();
  const resolvedTint = tintColor ?? (variant === 'destructive' ? theme.blood : theme.frost);

  return (
    <Host matchContents>
      <SwiftButton
        onPress={onPress}
        role={variant === 'destructive' ? 'destructive' : 'default'}
        modifiers={[
          buttonStyle(variant === 'prominent' ? 'glassProminent' : 'glass'),
          controlSize('large'),
          ...(variant === 'prominent' ? [tint(resolvedTint)] : []),
          disabledModifier(disabled),
        ]}>
        <SwiftText modifiers={[font({ size: 17, weight: 'semibold' })]}>{label}</SwiftText>
      </SwiftButton>
    </Host>
  );
}

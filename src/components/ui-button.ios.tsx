import { Button as SwiftButton, Host, Text as SwiftText } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled as disabledModifier, font, frame, tint } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'prominent' | 'glass' | 'destructive';
  tintColor?: string;
  disabled?: boolean;
  fullWidth?: boolean;
};

/** Native SwiftUI button for iOS. */
export function UiButton({ label, onPress, variant = 'glass', tintColor, disabled = false, fullWidth = false }: Props) {
  const theme = useTheme();
  const resolvedTint = tintColor ?? (variant === 'destructive' ? theme.blood : theme.frost);

  return (
    <Host matchContents={fullWidth ? { vertical: true } : true} style={fullWidth ? styles.fullWidthHost : undefined}>
      <SwiftButton
        onPress={onPress}
        role={variant === 'destructive' ? 'destructive' : 'default'}
        modifiers={[
          buttonStyle(variant === 'prominent' ? 'glassProminent' : 'glass'),
          controlSize('large'),
          ...(variant === 'prominent' ? [tint(resolvedTint)] : []),
          disabledModifier(disabled),
        ]}>
        <SwiftText
          modifiers={[
            ...(fullWidth ? [frame({ maxWidth: Infinity })] : []),
            font({ size: 17, weight: 'semibold' }),
          ]}>
          {label}
        </SwiftText>
      </SwiftButton>
    </Host>
  );
}

const styles = StyleSheet.create({
  fullWidthHost: {
    alignSelf: 'stretch',
    width: '100%',
  },
});

import { Button, Host } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, tint } from '@expo/ui/swift-ui/modifiers';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  onPress: () => void;
  tintColor?: string;
};

export function BackButton({ label, onPress, tintColor }: Props) {
  const theme = useTheme();

  return (
    <Host matchContents style={{ alignSelf: 'flex-start', minHeight: 38, marginLeft: -Spacing.one }}>
      <Button
        label={label}
        systemImage="chevron.left"
        onPress={onPress}
        modifiers={[buttonStyle('glass'), controlSize('regular'), tint(tintColor ?? theme.frost)]}
      />
    </Host>
  );
}

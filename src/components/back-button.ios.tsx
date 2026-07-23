import { Button, Host } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  imageScale,
  labelStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';

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
    <Host
      style={{
        alignSelf: 'flex-start',
        width: 46,
        height: 46,
        marginLeft: -Spacing.one,
      }}>
      <Button
        label={label}
        systemImage="chevron.left"
        onPress={onPress}
        modifiers={[
          buttonStyle('glass'),
          buttonBorderShape('circle'),
          controlSize('large'),
          imageScale('large'),
          labelStyle('iconOnly'),
          accessibilityLabel(label),
          tint(tintColor ?? theme.frost),
        ]}
      />
    </Host>
  );
}

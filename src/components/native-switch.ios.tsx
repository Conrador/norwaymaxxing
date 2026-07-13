import { Host, Toggle } from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
};

export function NativeSwitch({ value, onValueChange, label }: Props) {
  const theme = useTheme();

  return (
    <Host matchContents style={{ minWidth: 54, minHeight: 34 }}>
      <Toggle
        isOn={value}
        label={label}
        onIsOnChange={onValueChange}
        modifiers={[tint(theme.frost)]}
      />
    </Host>
  );
}

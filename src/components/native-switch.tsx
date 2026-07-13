import { Switch } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
};

export function NativeSwitch({ value, onValueChange }: Props) {
  const theme = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: theme.surfaceHigh, true: `${theme.frost}66` }}
      thumbColor={value ? theme.frost : theme.surface}
      ios_backgroundColor={theme.surfaceHigh}
    />
  );
}

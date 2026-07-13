import { Button, Host } from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  imageScale,
  labelStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = {
  onPress: () => void;
};

export function SheetCloseButton({ onPress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Host style={styles.host}>
      <Button
        label={t('common.close')}
        systemImage="xmark"
        onPress={onPress}
        modifiers={[
          buttonStyle('glass'),
          buttonBorderShape('circle'),
          controlSize('large'),
          imageScale('large'),
          labelStyle('iconOnly'),
          tint(theme.textPrimary),
        ]}
      />
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    width: 52,
    height: 52,
  },
});

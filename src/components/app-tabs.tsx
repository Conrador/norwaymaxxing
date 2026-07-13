import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.bg}
      indicatorColor={theme.surfaceHigh}
      labelStyle={{ selected: { color: theme.frost } }}>
      <NativeTabs.Trigger
        name="index"
        disableAutomaticContentInsets
        contentStyle={{ backgroundColor: 'transparent', paddingTop: 0 }}>
        <NativeTabs.Trigger.Label>{t('tabs.today')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sun.max.fill" md="light_mode" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="practices">
        <NativeTabs.Trigger.Label>{t('tabs.practices')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="snowflake" md="ac_unit" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="nature">
        <NativeTabs.Trigger.Label>{t('tabs.nature')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tree.fill" md="forest" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="you">
        <NativeTabs.Trigger.Label>{t('tabs.you')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="shield.fill" md="shield" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

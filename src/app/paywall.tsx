import { Redirect } from 'expo-router';

import { ScreenBackground } from '@/components/screen-background';
import { ConnectedPaywallStep } from '@/features/onboarding/paywall-step';
import { usePremium } from '@/hooks/use-premium';
import { useProfile } from '@/stores/profile';

export default function PaywallScreen() {
  const { isPremium } = usePremium();
  const roRewardUnlocked = useProfile((state) => state.roRewardUnlocked);

  if (isPremium) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ScreenBackground>
      <ConnectedPaywallStep
        roRewardUnlocked={roRewardUnlocked}
        onSubscribe={() => undefined}
      />
    </ScreenBackground>
  );
}

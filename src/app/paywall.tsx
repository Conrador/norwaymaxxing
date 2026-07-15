import { useRouter } from 'expo-router';

import { ScreenBackground } from '@/components/screen-background';
import { ConnectedPaywallStep } from '@/features/onboarding/paywall-step';
import { useProfile } from '@/stores/profile';

export default function PaywallScreen() {
  const router = useRouter();
  const roRewardUnlocked = useProfile((state) => state.roRewardUnlocked);

  return (
    <ScreenBackground>
      <ConnectedPaywallStep
        roRewardUnlocked={roRewardUnlocked}
        onSubscribe={() => router.back()}
        onDismiss={() => router.back()}
      />
    </ScreenBackground>
  );
}

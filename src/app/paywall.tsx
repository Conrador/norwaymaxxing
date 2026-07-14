import { useRouter } from 'expo-router';

import { ScreenBackground } from '@/components/screen-background';
import type { PlanId } from '@/config/app';
import { PaywallStep } from '@/features/onboarding/paywall-step';
import { usePremium } from '@/hooks/use-premium';

export default function PaywallScreen() {
  const router = useRouter();
  const { activatePremium } = usePremium();

  const subscribe = (plan: PlanId) => {
    activatePremium(plan);
    router.back();
  };

  return (
    <ScreenBackground>
      <PaywallStep onSubscribe={subscribe} onDismiss={() => router.back()} />
    </ScreenBackground>
  );
}

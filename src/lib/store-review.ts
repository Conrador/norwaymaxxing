import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

let reviewRequestInFlight = false;

export function requestStoreReviewAfterTask() {
  if (reviewRequestInFlight || Platform.OS !== 'ios') return;
  reviewRequestInFlight = true;

  setTimeout(() => {
    StoreReview.hasAction()
      .then((available) => {
        if (!available) return undefined;
        return StoreReview.requestReview();
      })
      .catch(() => {
        // The native prompt is opportunistic; failures should never block task completion.
      })
      .finally(() => {
        reviewRequestInFlight = false;
      });
  }, 650);
}

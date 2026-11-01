// Mochi illustrations, cropped and downscaled from the source art by the asset preparation step.
export const mochi = {
  coin: require('../../assets/mochi/mochi-coin.png'),
  leafLeft: require('../../assets/mochi/leaf-left.png'),
  leafRight: require('../../assets/mochi/leaf-right.png'),
  avatar: require('../../assets/mochi/mochi-avatar.png'),
  empty: require('../../assets/mochi/mochi-empty.png'),
  banner: require('../../assets/mochi/mochi-banner.png'),
  insight: require('../../assets/mochi/mochi-insight.png'),
  jar: require('../../assets/mochi/mochi-jar.png'),
  pocket: require('../../assets/mochi/mochi-pocket.png'),
  recurring: require('../../assets/mochi/mochi-recurring.png'),
  savings: require('../../assets/mochi/mochi-savings.png'),
  onboardingWallet: require('../../assets/mochi/onboarding-wallet.png'),
  onboardingShopping: require('../../assets/mochi/onboarding-shopping.png'),
  onboardingSaving: require('../../assets/mochi/onboarding-saving.png'),
  eyeOpen: require('../../assets/mochi/mochi-eye-open.png'),
  eyeClosed: require('../../assets/mochi/mochi-eye-closed.png'),
  runSheet: require('../../assets/mochi/mochi-run-sheet.png'),
} as const;

/** Width / height of each image, so layouts can reserve the right box before it loads. */
export const mochiAspect = {
  coin: 692 / 720, leafLeft: 640 / 532, leafRight: 640 / 514, avatar: 1, empty: 640 / 544, banner: 560 / 273, insight: 840 / 526,
  jar: 560 / 522, pocket: 560 / 536, recurring: 840 / 593, savings: 760 / 657, onboardingWallet: 840 / 725, onboardingShopping: 840 / 765, onboardingSaving: 840 / 755, eyeOpen: 1, eyeClosed: 1, runSheet: 2640 / 299,
} satisfies Record<keyof typeof mochi, number>;

/** The running Mochi sprite sheet: frames laid side by side, each centred on the cat's body. */
export const mochiRun = { frames: 6, frameAspect: 440 / 299, frameMs: 130 } as const;

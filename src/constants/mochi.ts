// Mochi illustrations, cropped and downscaled from the source art by the asset preparation step.
export const mochi = {
  coin: require('../../assets/mochi/mochi-coin.png'),
  coinBlink: require('../../assets/mochi/mochi-coin-blink.png'),
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
  faceHappy: require('../../assets/mochi/mochi-face-happy.png'),
  faceWorried: require('../../assets/mochi/mochi-face-worried.png'),
  faceSad: require('../../assets/mochi/mochi-face-sad.png'),
  streak1: require('../../assets/mochi/streak-1.png'),
  streak2: require('../../assets/mochi/streak-2.png'),
  streak3: require('../../assets/mochi/streak-3.png'),
  streak4: require('../../assets/mochi/streak-4.png'),
} as const;

/** Ready-made profile avatars the user can pick instead of a photo, stored as `mochi-avatar:<id>`. */
export const mochiAvatars = [
  { id: 'happy', label: 'Mochi ceria', source: require('../../assets/mochi/avatar-01.png') },
  { id: 'reader', label: 'Mochi kutu buku', source: require('../../assets/mochi/avatar-02.png') },
  { id: 'money', label: 'Mochi kantong uang', source: require('../../assets/mochi/avatar-03.png') },
  { id: 'music', label: 'Mochi musik', source: require('../../assets/mochi/avatar-04.png') },
  { id: 'phone', label: 'Mochi main HP', source: require('../../assets/mochi/avatar-05.png') },
  { id: 'sleepy', label: 'Mochi ngantuk', source: require('../../assets/mochi/avatar-06.png') },
  { id: 'programmer', label: 'Mochi programmer', source: require('../../assets/mochi/avatar-07.png') },
  { id: 'cool', label: 'Mochi keren', source: require('../../assets/mochi/avatar-08.png') },
  { id: 'gym', label: 'Mochi olahraga', source: require('../../assets/mochi/avatar-09.png') },
  { id: 'king', label: 'Mochi raja', source: require('../../assets/mochi/avatar-10.png') },
] as const;

/** Width / height of each image, so layouts can reserve the right box before it loads. */
export const mochiAspect = {
  coin: 692 / 720, coinBlink: 692 / 720, leafLeft: 640 / 532, leafRight: 640 / 514, avatar: 1, empty: 640 / 544, banner: 560 / 273, insight: 840 / 526,
  jar: 560 / 522, pocket: 560 / 536, recurring: 840 / 593, savings: 760 / 657, onboardingWallet: 840 / 725, onboardingShopping: 840 / 765, onboardingSaving: 840 / 755, eyeOpen: 1, eyeClosed: 1, runSheet: 2640 / 299, faceHappy: 1, faceWorried: 1, faceSad: 1, streak1: 1, streak2: 1, streak3: 1, streak4: 1,
} satisfies Record<keyof typeof mochi, number>;

/** The running Mochi sprite sheet: frames laid side by side, each centred on the cat's body. */
export const mochiRun = { frames: 6, frameAspect: 440 / 299, frameMs: 130 } as const;

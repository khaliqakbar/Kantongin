import { useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Text } from '@/components/text';
import { AppIcon, type IconName } from '@/components/app-icon';

type SwipeAction = { label: string; icon: IconName; color: string; onPress: () => void };

/** Swipe a row left to reveal quick actions (for example Edit and Hapus); a tap still opens the row. */
export function SwipeRow({ children, actions, background }: { children: ReactNode; actions: SwipeAction[]; background: string }) {
  const swipeable = useRef<SwipeableMethods>(null);
  return <Swipeable
    ref={swipeable}
    friction={2}
    rightThreshold={40}
    overshootRight={false}
    childrenContainerStyle={{ backgroundColor: background }}
    renderRightActions={() => <>{actions.map((action) => <Pressable key={action.label} onPress={() => { swipeable.current?.close(); action.onPress(); }} accessibilityRole="button" accessibilityLabel={action.label} style={[styles.action, { backgroundColor: action.color }]}>
      <AppIcon name={action.icon} size={20} color="#FFFFFF" />
      <Text style={styles.label}>{action.label}</Text>
    </Pressable>)}</>}>
    {children}
  </Swipeable>;
}

const styles = StyleSheet.create({
  action: { width: 72, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});

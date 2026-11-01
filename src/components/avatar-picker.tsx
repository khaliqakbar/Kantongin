import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/text';
import { AppIcon } from '@/components/app-icon';
import { PrimaryButton } from '@/components/finance-ui';
import { mochiAvatars } from '@/constants/mochi';
import { AppTheme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MochiAvatarPrefix } from '@/utils/profile-photo';

/** Bottom sheet for the profile picture: one of the Mochi avatars, or a photo from the gallery. */
export function AvatarPicker({ value, onPickAvatar, onPickGallery, onClose }: { value: string | null; onPickAvatar: (value: string) => void; onPickGallery: () => void; onClose: () => void }) {
  const c = useTheme(); const s = createStyles(c);
  return <Modal transparent animationType="slide" visible onRequestClose={onClose} statusBarTranslucent>
    <Pressable onPress={onClose} accessibilityLabel="Tutup pilihan avatar" style={s.backdrop}>
      {/* Inner Pressable swallows taps so only the backdrop closes the sheet. */}
      <Pressable onPress={() => {}} style={s.sheet}>
        <View style={s.handle} />
        <Text style={s.title}>Pilih Avatar</Text>
        <Text style={s.subtitle}>Pilih Mochi favoritmu, atau pakai fotomu sendiri.</Text>
        <View style={s.grid}>
          {mochiAvatars.map((avatar) => {
            const id = MochiAvatarPrefix + avatar.id; const selected = value === id;
            return <Pressable key={avatar.id} onPress={() => onPickAvatar(id)} accessibilityRole="button" accessibilityLabel={avatar.label} accessibilityState={{ selected }} style={({ pressed }) => [s.cell, pressed && { transform: [{ scale: 0.94 }] }]}>
              <View style={[s.ring, selected && { borderColor: c.forest }]}><Image source={avatar.source} style={s.avatar} contentFit="contain" /></View>
              {selected ? <View style={s.check}><AppIcon name="check" size={13} color={c.onForest} /></View> : null}
            </Pressable>;
          })}
        </View>
        <PrimaryButton label="Pilih dari Galeri" icon="camera" secondary onPress={onPickGallery} />
      </Pressable>
    </Pressable>
  </Modal>;
}

function createStyles(c: AppTheme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, alignItems: 'stretch' },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: 14 },
    title: { color: c.text, fontSize: 18, fontWeight: '900' },
    subtitle: { color: c.textSecondary, fontSize: 12, marginTop: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, marginBottom: 16, rowGap: 12 },
    cell: { width: '20%', alignItems: 'center' },
    ring: { borderRadius: 36, borderWidth: 3, borderColor: 'transparent', padding: 2 },
    avatar: { width: 54, height: 54 },
    check: { position: 'absolute', right: 2, bottom: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: c.forest, borderWidth: 2, borderColor: c.surface, alignItems: 'center', justifyContent: 'center' },
  });
}

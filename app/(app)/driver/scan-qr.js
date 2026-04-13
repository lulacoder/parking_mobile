import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../../src/constants/theme';
import Button from '../../../src/components/common/Button';

function extractToken(data) {
  const raw = String(data || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    const token = parsed.searchParams.get('token');
    return token || raw;
  } catch (_) {
    return raw;
  }
}

export default function DriverQrScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);

  if (!permission) {
    return <View style={styles.center}><Text style={styles.text}>Checking camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera Access Required</Text>
        <Text style={styles.text}>Allow camera permission to scan operator QR codes.</Text>
        <Button title="Allow Camera" onPress={requestPermission} />
        <Button title="Back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  const onScanned = ({ data }) => {
    if (locked) return;
    setLocked(true);
    const token = extractToken(data);
    if (!token) {
      Alert.alert('Invalid QR', 'Could not extract token from QR data.');
      setLocked(false);
      return;
    }
    router.replace(`/driver/checkin-confirm?token=${encodeURIComponent(token)}`);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onScanned}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Align QR code inside the frame</Text>
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayText: { ...typography.body, color: '#fff', marginBottom: spacing.sm, textAlign: 'center' },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    justifyContent: 'center',
  },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  text: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
});

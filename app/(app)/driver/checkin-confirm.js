import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import { firestore } from '../../../src/config/firebase';
import { colors, spacing, typography } from '../../../src/constants/theme';
import { driverFunctions } from '../../../src/utils/functions';
import { normalizePlate } from '../../../src/services/time';

export default function DriverCheckInConfirmScreen() {
  const { initializing } = useProtectedRoute(['driver']);
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = useMemo(() => String(params?.token || '').trim(), [params?.token]);

  const [plateNumber, setPlateNumber] = useState('');
  const [requestId, setRequestId] = useState('');
  const [status, setStatus] = useState('');
  const [requestPayload, setRequestPayload] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!requestId) return undefined;

    const unsubscribe = firestore.collection('checkInRequests').doc(requestId).onSnapshot(
      (snap) => {
        if (!snap.exists) return;
        const payload = snap.data();
        setRequestPayload(payload);
        setStatus(payload?.status || '');
      },
      (error) => Alert.alert('Error', error.message || 'Failed to track request status')
    );

    return () => unsubscribe();
  }, [requestId]);

  if (initializing) return null;

  const submit = async () => {
    if (!token) {
      Alert.alert('Invalid QR', 'Missing token. Scan a valid QR code and try again.');
      return;
    }

    const normalized = normalizePlate(plateNumber);
    if (!normalized) {
      Alert.alert('Missing plate', 'Please enter your plate number.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await driverFunctions.confirmCheckInFromQr(token, normalized);
      setRequestId(result.requestId || '');
      setStatus(result.status || 'pending');
      Alert.alert('Submitted', 'Request sent. Wait for operator approval.');
    } catch (error) {
      Alert.alert('Request failed', error.message || 'Unable to submit check-in request');
    } finally {
      setSubmitting(false);
    }
  };

  const statusText = (() => {
    if (!status) return 'Not submitted yet';
    if (status === 'pending') return 'Waiting for operator approval';
    if (status === 'approved') return 'Approved. Your parking session has started.';
    if (status === 'rejected') return 'Rejected. Ask operator for a new QR.';
    if (status === 'expired') return 'Expired. Ask operator to refresh QR.';
    return `Current status: ${status}`;
  })();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Confirm Parking Check-In</Text>
      <Text style={styles.subtitle}>Scan operator QR, enter plate, and wait for approval.</Text>

      {!token ? <Text style={styles.errorText}>Missing token. Use scanner or paste link/token from Driver Home.</Text> : null}

      <View style={styles.card}>
        <Text style={styles.label}>Token</Text>
        <Text style={styles.value} numberOfLines={1}>{token || 'N/A'}</Text>

        <Input
          placeholder="Plate Number"
          value={plateNumber}
          onChangeText={(value) => setPlateNumber(normalizePlate(value))}
          autoCapitalize="characters"
        />

        <Button title={submitting ? 'Submitting...' : 'Confirm Check-In'} onPress={submit} loading={submitting} disabled={!token} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{statusText}</Text>
        {requestPayload ? (
          <Text style={styles.meta}>Parking: {requestPayload.parkingId || 'N/A'} | Request: {requestId || 'N/A'}</Text>
        ) : null}
        {status === 'approved' ? (
          <Button title="Go to Driver Home" variant="secondary" onPress={() => router.replace('/driver')} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  label: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' },
  value: { ...typography.body, color: colors.text, marginVertical: spacing.xs },
  meta: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xs },
  errorText: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
});

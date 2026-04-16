import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import { auth, firestore } from '../../../src/config/firebase';
import { colors, spacing, typography } from '../../../src/constants/theme';
import { driverFunctions } from '../../../src/utils/functions';
import { getParkingPaymentDetails, listPendingPaymentsForDriver } from '../../../src/services/api';
import { estimateCharge, normalizePlate, parkingCoords, toDateTime } from '../../../src/services/time';

export default function DriverHomeScreen() {
  const { initializing } = useProtectedRoute(['driver']);
  const router = useRouter();

  const [parkings, setParkings] = useState([]);
  const [selectedParkingId, setSelectedParkingId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [activeBookings, setActiveBookings] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingPaymentsError, setPendingPaymentsError] = useState('');
  const [manualQrInput, setManualQrInput] = useState('');
  const [loadingReserve, setLoadingReserve] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [referenceCode, setReferenceCode] = useState('');
  const [paymentDestination, setPaymentDestination] = useState({ phone: '', bankAccountNumber: '' });
  const [loadingDestination, setLoadingDestination] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('parkings')
      .where('status', '==', 'active')
      .onSnapshot(
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          list.sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)));
          setParkings(list);
          if (!selectedParkingId && list.length) {
            setSelectedParkingId(list[0].id);
          }
        },
        (error) => Alert.alert('Error', error.message || 'Failed to load parkings')
      );

    return () => unsubscribe();
  }, [selectedParkingId]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return undefined;

    const unsubBookings = firestore
      .collection('bookings')
      .where('driverId', '==', uid)
      .where('status', 'in', ['reserved', 'checked_in'])
      .onSnapshot(
        (snapshot) => setActiveBookings(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
        (error) => Alert.alert('Error', error.message || 'Failed to load bookings')
      );

    const unsubSessions = firestore
      .collection('sessions')
      .where('driverId', '==', uid)
      .where('status', '==', 'active')
      .onSnapshot(
        (snapshot) => setActiveSessions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
        (error) => Alert.alert('Error', error.message || 'Failed to load sessions')
      );

    let mounted = true;
    const loadPending = async () => {
      try {
        const result = await listPendingPaymentsForDriver();
        if (!mounted) return;
        setPendingPayments(Array.isArray(result?.pendingPayments) ? result.pendingPayments : []);
        setPendingPaymentsError('');
      } catch (_) {
        if (mounted) {
          setPendingPayments([]);
          setPendingPaymentsError('Pending payments are temporarily unavailable.');
        }
      }
    };

    loadPending();
    const timer = setInterval(loadPending, 8000);

    return () => {
      mounted = false;
      clearInterval(timer);
      unsubBookings();
      unsubSessions();
    };
  }, []);

  if (initializing) return null;

  const selectedParking = parkings.find((p) => p.id === selectedParkingId) || null;
  const selectedCoords = parkingCoords(selectedParking);
  const mapCoords = parkings
    .map((parking) => ({ parking, coords: parkingCoords(parking) }))
    .filter((item) => Boolean(item.coords));

  const initialRegion =
    selectedCoords ||
    mapCoords[0]?.coords || {
      latitude: 8.997,
      longitude: 38.786,
    };

  const openQrConfirm = (input = '') => {
    const value = String(input || '').trim();
    if (!value) {
      router.push('/driver/checkin-confirm');
      return;
    }

    try {
      const parsed = new URL(value);
      const token = parsed.searchParams.get('token');
      if (token) {
        router.push(`/driver/checkin-confirm?token=${encodeURIComponent(token)}`);
        return;
      }
    } catch (_) {
      // treat as raw token
    }

    router.push(`/driver/checkin-confirm?token=${encodeURIComponent(value)}`);
  };

  const reserveSlot = async () => {
    if (!selectedParkingId || !normalizePlate(plateNumber)) {
      Alert.alert('Missing data', 'Select parking and enter plate number.');
      return;
    }

    try {
      setLoadingReserve(true);
      const response = await driverFunctions.createBooking(selectedParkingId, normalizePlate(plateNumber));
      Alert.alert('Success', `Booking created: ${response.bookingId}`);
      setPlateNumber('');
    } catch (error) {
      Alert.alert('Booking failed', error.message || 'Unable to reserve slot');
    } finally {
      setLoadingReserve(false);
    }
  };

  const openPaymentModal = async (session) => {
    setCheckoutSession(session);
    setPaymentMethod('bank');
    setReferenceCode('');
    setPaymentDestination({ phone: '', bankAccountNumber: '' });
    setPaymentModalVisible(true);

    try {
      setLoadingDestination(true);
      const destination = await getParkingPaymentDetails(session.parkingId);
      setPaymentDestination({
        phone: destination?.phone || '',
        bankAccountNumber: destination?.bankAccountNumber || '',
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load payment destination');
    } finally {
      setLoadingDestination(false);
    }
  };

  const submitPayment = async () => {
    if (!checkoutSession) return;

    try {
      setCheckoutLoading(checkoutSession.id);
      const result = await driverFunctions.submitManualPayment(
        checkoutSession.parkingId,
        checkoutSession.plateNumber,
        paymentMethod,
        referenceCode.trim()
      );
      Alert.alert('Submitted', `Payment request sent. Amount: ${result.amountDue || 0} ETB`);
      setPaymentModalVisible(false);
      setCheckoutSession(null);
    } catch (error) {
      Alert.alert('Payment failed', error.message || 'Unable to submit payment');
    } finally {
      setCheckoutLoading('');
    }
  };

  const openParkingInExternalMap = async () => {
    if (!selectedCoords) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${selectedCoords.latitude},${selectedCoords.longitude}`;
    try {
      await Linking.openURL(url);
    } catch (_) {
      Alert.alert('Unable to open map', 'Please ensure a maps app is installed.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Driver Dashboard</Text>

      <Card title="QR Check-In">
        <Text style={styles.smallText}>Scan operator QR with your phone camera or paste token/link.</Text>
        <View style={styles.rowGap}>
          <Button title="Open QR Scanner" onPress={() => router.push('/driver/scan-qr')} />
          <Input
            placeholder="Paste QR link or token"
            value={manualQrInput}
            onChangeText={setManualQrInput}
            autoCapitalize="none"
          />
          <Button title="Open Check-In" variant="secondary" onPress={() => openQrConfirm(manualQrInput)} />
        </View>
      </Card>

      <Card title="Choose Parking on Map">
        {!Constants.expoConfig?.extra?.googleMapsApiKey ? (
          <Text style={styles.warning}>Google Maps API key missing. Add `GOOGLE_MAPS_API_KEY` to `.env`.</Text>
        ) : null}

        <View style={styles.chipWrap}>
          {parkings.map((parking) => (
            <TouchableOpacity
              key={parking.id}
              style={[styles.chip, parking.id === selectedParkingId && styles.chipActive]}
              onPress={() => setSelectedParkingId(parking.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipTitle, parking.id === selectedParkingId && styles.chipTitleActive]}>
                {parking.name || parking.id}
              </Text>
              <Text style={styles.chipMeta}>{parking.availableSlots || 0} available</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.mapContainer}>
          <View style={styles.mapFallback}>
            <Text style={styles.smallText}>
              Map preview is not available in this runtime. Open the selected parking in Google Maps.
            </Text>
            {selectedCoords ? (
              <Text style={styles.smallText}>
                Coordinates: {selectedCoords.latitude}, {selectedCoords.longitude}
              </Text>
            ) : null}
            <Button title="Open in Google Maps" onPress={openParkingInExternalMap} disabled={!selectedCoords} />
          </View>
        </View>
      </Card>

      <Card title="Reserve Slot">
        <Input
          placeholder="Plate Number"
          value={plateNumber}
          onChangeText={(value) => setPlateNumber(normalizePlate(value))}
          autoCapitalize="characters"
        />
        <Button title={loadingReserve ? 'Reserving...' : 'Reserve'} loading={loadingReserve} onPress={reserveSlot} />
      </Card>

      <Card title="Selected Parking">
        {selectedParking ? (
          <>
            <Text style={styles.body}>{selectedParking.name}</Text>
            <Text style={styles.smallText}>{selectedParking.address || 'No address'}</Text>
            <Text style={styles.smallText}>Rate: {selectedParking.hourlyRate || 50} ETB/hr</Text>
            <Text style={styles.smallText}>Available: {selectedParking.availableSlots || 0}</Text>
          </>
        ) : (
          <Text style={styles.smallText}>No parking selected.</Text>
        )}
      </Card>

      <Card title="My Active Bookings">
        {!activeBookings.length ? (
          <Text style={styles.smallText}>No active bookings.</Text>
        ) : (
          activeBookings.map((booking) => (
            <View key={booking.id} style={styles.listItem}>
              <Text style={styles.body}>{booking.plateNumber}</Text>
              <Text style={styles.smallText}>Status: {booking.status}</Text>
              <Text style={styles.smallText}>Expires: {toDateTime(booking.expiresAt)}</Text>
            </View>
          ))
        )}
      </Card>

      <Card title="My Active Sessions">
        {!activeSessions.length ? (
          <Text style={styles.smallText}>No active sessions.</Text>
        ) : (
          activeSessions.map((session) => {
            const pending = pendingPayments.some((item) => item.sessionId === session.id);
            return (
              <View key={session.id} style={styles.listItem}>
                <Text style={styles.body}>{session.plateNumber}</Text>
                <Text style={styles.smallText}>Parking: {session.parkingId}</Text>
                {pending ? <Text style={styles.pendingText}>Payment submitted. Waiting for operator.</Text> : null}
                <Button
                  title="Checkout & Submit Payment"
                  variant="secondary"
                  disabled={pending || checkoutLoading === session.id}
                  loading={checkoutLoading === session.id}
                  onPress={() => openPaymentModal(session)}
                />
              </View>
            );
          })
        )}
      </Card>

      <Card title="Pending Payment Confirmations">
        {pendingPaymentsError ? <Text style={styles.warning}>{pendingPaymentsError}</Text> : null}
        {!pendingPayments.length ? (
          <Text style={styles.smallText}>No pending payment confirmations.</Text>
        ) : (
          pendingPayments.map((request) => (
            <View key={request.id} style={styles.listItem}>
              <Text style={styles.body}>{request.plateNumber || 'Unknown plate'}</Text>
              <Text style={styles.smallText}>Amount: {request.amountDue || 0} ETB</Text>
              <Text style={styles.smallText}>Method: {request.method || 'N/A'}</Text>
              <Text style={styles.smallText}>Submitted: {toDateTime(request.submittedAt)}</Text>
            </View>
          ))
        )}
      </Card>

      <Modal visible={paymentModalVisible} transparent animationType="slide" onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Complete Manual Payment</Text>
            {!checkoutSession ? null : (
              <>
                <Text style={styles.body}>{checkoutSession.plateNumber}</Text>
                <Text style={styles.smallText}>Parking: {checkoutSession.parkingId}</Text>
                {(() => {
                  const charge = estimateCharge(checkoutSession.entryTime, checkoutSession.hourlyRate || 50);
                  return (
                    <Text style={styles.smallText}>
                      Estimated: {charge.amountDue} ETB ({charge.billedHours} hour block)
                    </Text>
                  );
                })()}

                <View style={styles.methodRow}>
                  <TouchableOpacity
                    style={[styles.methodChip, paymentMethod === 'bank' && styles.chipActive]}
                    onPress={() => setPaymentMethod('bank')}
                  >
                    <Text style={styles.smallText}>Bank</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodChip, paymentMethod === 'phone' && styles.chipActive]}
                    onPress={() => setPaymentMethod('phone')}
                  >
                    <Text style={styles.smallText}>Phone</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.smallText}>
                  {loadingDestination
                    ? 'Loading destination...'
                    : paymentMethod === 'bank'
                    ? `Bank: ${paymentDestination.bankAccountNumber || 'Not configured'}`
                    : `Phone: ${paymentDestination.phone || 'Not configured'}`}
                </Text>

                <Input
                  placeholder="Reference Code (optional)"
                  value={referenceCode}
                  onChangeText={setReferenceCode}
                  autoCapitalize="characters"
                />

                <View style={styles.modalActions}>
                  <Button title="Cancel" variant="secondary" onPress={() => setPaymentModalVisible(false)} />
                  <Button
                    title="Submit"
                    onPress={submitPayment}
                    loading={checkoutLoading === checkoutSession.id}
                    disabled={checkoutLoading === checkoutSession.id}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.text },
  smallText: { ...typography.caption, color: colors.textSecondary },
  warning: { ...typography.caption, color: colors.warning, marginBottom: spacing.sm },
  rowGap: { gap: spacing.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#dbeafe' },
  chipTitle: { ...typography.caption, color: colors.text, fontWeight: '600' },
  chipTitleActive: { color: colors.primary },
  chipMeta: { ...typography.small, color: colors.textSecondary },
  mapContainer: { borderRadius: 8, overflow: 'hidden', height: 250, borderWidth: 1, borderColor: colors.border },
  map: { width: '100%', height: '100%' },
  mapFallback: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#f8fafc',
  },
  listItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  pendingText: { ...typography.small, color: colors.info, marginVertical: spacing.xs },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  methodRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  methodChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
});

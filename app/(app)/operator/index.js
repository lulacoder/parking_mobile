import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import { auth, firestore } from '../../../src/config/firebase';
import { colors, spacing, typography } from '../../../src/constants/theme';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import { operatorFunctions } from '../../../src/utils/functions';
import { listPendingPaymentsForOperator } from '../../../src/services/api';
import { normalizePlate, toDateTime, toMs } from '../../../src/services/time';

export default function OperatorHomeScreen() {
  const { initializing } = useProtectedRoute(['operator']);

  const [assignedParkingIds, setAssignedParkingIds] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [selectedParkingId, setSelectedParkingId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [allowWalkIn, setAllowWalkIn] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);

  const [qrPayload, setQrPayload] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrRefreshNonce, setQrRefreshNonce] = useState(0);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return undefined;

    const unsub = firestore.collection('users').doc(uid).onSnapshot(
      (snap) => {
        const profile = snap.exists ? snap.data() : {};
        const assigned = Array.isArray(profile?.assignedParkingIds) ? profile.assignedParkingIds : [];
        setAssignedParkingIds(assigned);
        if (!selectedParkingId && assigned.length) {
          setSelectedParkingId(assigned[0]);
        }
      },
      () => Alert.alert('Error', 'Failed to load operator profile')
    );

    return () => unsub();
  }, [selectedParkingId, qrRefreshNonce]);

  useEffect(() => {
    if (!assignedParkingIds.length) {
      setParkings([]);
      return undefined;
    }

    let mounted = true;
    const unsubscribers = assignedParkingIds.map((parkingId) =>
      firestore.collection('parkings').doc(parkingId).onSnapshot((docSnap) => {
        if (!mounted) return;
        setParkings((prev) => {
          const filtered = prev.filter((item) => item.id !== parkingId);
          if (!docSnap.exists) return filtered;
          return [...filtered, { id: docSnap.id, ...docSnap.data() }].sort((a, b) =>
            String(a.name || a.id).localeCompare(String(b.name || b.id))
          );
        });
      })
    );

    return () => {
      mounted = false;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [assignedParkingIds]);

  useEffect(() => {
    if (!selectedParkingId) {
      setPendingRequests([]);
      return undefined;
    }

    const unsub = firestore
      .collection('checkInRequests')
      .where('parkingId', '==', selectedParkingId)
      .where('status', '==', 'pending')
      .onSnapshot(
        (snapshot) => {
          const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          requests.sort((a, b) => toMs(b.requestedAt || b.createdAt) - toMs(a.requestedAt || a.createdAt));
          setPendingRequests(requests);
        },
        () => Alert.alert('Error', 'Failed to load pending check-in requests')
      );

    return () => unsub();
  }, [selectedParkingId]);

  useEffect(() => {
    if (!selectedParkingId) {
      setActiveSessions([]);
      return undefined;
    }

    const unsub = firestore
      .collection('sessions')
      .where('parkingId', '==', selectedParkingId)
      .where('status', '==', 'active')
      .onSnapshot(
        (snapshot) => setActiveSessions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
        () => Alert.alert('Error', 'Failed to load active sessions')
      );

    return () => unsub();
  }, [selectedParkingId]);

  useEffect(() => {
    if (!selectedParkingId) {
      setPendingPayments([]);
      return undefined;
    }

    let mounted = true;
    const load = async () => {
      try {
        const result = await listPendingPaymentsForOperator(selectedParkingId);
        if (!mounted) return;
        setPendingPayments(Array.isArray(result?.pendingPayments) ? result.pendingPayments : []);
      } catch (_) {
        if (mounted) Alert.alert('Error', 'Failed to load pending payments');
      }
    };

    load();
    const timer = setInterval(load, 8000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [selectedParkingId]);

  useEffect(() => {
    if (!selectedParkingId) {
      setQrPayload(null);
      return undefined;
    }

    let mounted = true;
    const refreshQr = async () => {
      try {
        setQrLoading(true);
        const payload = await operatorFunctions.createParkingCheckInToken(selectedParkingId);
        if (!mounted) return;
        setQrPayload(payload);
      } catch (error) {
        if (mounted) Alert.alert('Error', error.message || 'Failed to create QR token');
      } finally {
        if (mounted) setQrLoading(false);
      }
    };

    refreshQr();
    const timer = setInterval(refreshQr, 55000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [selectedParkingId]);

  if (initializing) return null;

  const selectedParking = useMemo(
    () => parkings.find((parking) => parking.id === selectedParkingId) || null,
    [parkings, selectedParkingId]
  );

  const withAction = async (name, work) => {
    setActionLoading(name);
    try {
      await work();
    } finally {
      setActionLoading('');
    }
  };

  const checkInVehicle = () =>
    withAction('checkInVehicle', async () => {
      const normalized = normalizePlate(plateNumber);
      if (!selectedParkingId || !normalized) {
        Alert.alert('Missing data', 'Select parking and enter plate number.');
        return;
      }
      const response = await operatorFunctions.checkInVehicle(selectedParkingId, normalized, allowWalkIn);
      Alert.alert('Success', `Session started: ${response.sessionId || 'N/A'}`);
      setPlateNumber('');
    });

  const approveRequest = (requestId) =>
    withAction('approveCheckInRequest', async () => {
      const result = await operatorFunctions.approveCheckInRequest(requestId);
      Alert.alert('Approved', `Session ${result?.sessionId || ''} started.`);
    });

  const rejectRequest = (requestId) =>
    withAction('rejectCheckInRequest', async () => {
      await operatorFunctions.rejectCheckInRequest(requestId, 'Request denied by operator');
      Alert.alert('Rejected', 'Check-in request rejected.');
    });

  const confirmPayment = (requestId) =>
    withAction('confirmManualPayment', async () => {
      const result = await operatorFunctions.confirmManualPayment(requestId);
      Alert.alert('Confirmed', `Payment settled${result?.feeAmount ? `: ${result.feeAmount} ETB` : ''}.`);
    });

  const rejectPayment = (requestId) =>
    withAction('rejectManualPayment', async () => {
      await operatorFunctions.rejectManualPayment(requestId, 'Payment proof could not be verified');
      Alert.alert('Rejected', 'Payment request rejected.');
    });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Operator Dashboard</Text>

      <Card title="Assigned Parking">
        {!parkings.length ? (
          <Text style={styles.smallText}>No parking assignment found.</Text>
        ) : (
          <View style={styles.selectorWrap}>
            {parkings.map((parking) => (
              <Button
                key={parking.id}
                title={parking.name || parking.id}
                variant={parking.id === selectedParkingId ? 'primary' : 'secondary'}
                onPress={() => setSelectedParkingId(parking.id)}
              />
            ))}
          </View>
        )}

        {selectedParking ? (
          <View style={styles.inlineStats}>
            <Text style={styles.smallText}>Available: {selectedParking.availableSlots || 0}</Text>
            <Text style={styles.smallText}>Reserved: {selectedParking.reservedSlots || 0}</Text>
            <Text style={styles.smallText}>Occupied: {selectedParking.occupiedSlots || 0}</Text>
          </View>
        ) : null}
      </Card>

      <Card title="Driver Check-In QR">
        {!selectedParkingId ? (
          <Text style={styles.smallText}>Select parking to generate QR code.</Text>
        ) : qrLoading && !qrPayload ? (
          <Text style={styles.smallText}>Generating QR...</Text>
        ) : qrPayload ? (
          <>
            <View style={styles.qrWrap}>
              <QRCode value={qrPayload.deepLink || qrPayload.tokenId || ''} size={220} />
            </View>
            <Text style={styles.smallText}>Token: {qrPayload.tokenId}</Text>
            <Text style={styles.smallText}>Expires: {new Date(qrPayload.expiresAtMs || 0).toLocaleTimeString()}</Text>
            <Text style={styles.smallText} numberOfLines={2}>Link: {qrPayload.deepLink}</Text>
            <Button
              title={qrLoading ? 'Refreshing...' : 'Refresh QR'}
              loading={qrLoading}
              onPress={() => setQrRefreshNonce((n) => n + 1)}
            />
          </>
        ) : (
          <Text style={styles.smallText}>QR unavailable.</Text>
        )}
      </Card>

      <Card title="Manual Vehicle Check-In">
        <Input
          placeholder="Plate Number"
          value={plateNumber}
          onChangeText={(value) => setPlateNumber(normalizePlate(value))}
          autoCapitalize="characters"
        />
        <View style={styles.methodRow}>
          <Button
            title={allowWalkIn ? 'Walk-In Allowed' : 'Walk-In Disabled'}
            variant="secondary"
            onPress={() => setAllowWalkIn((prev) => !prev)}
          />
          <Button
            title={actionLoading === 'checkInVehicle' ? 'Checking In...' : 'Check In'}
            loading={actionLoading === 'checkInVehicle'}
            onPress={checkInVehicle}
          />
        </View>
      </Card>

      <Card title="Pending QR Confirmations">
        {!pendingRequests.length ? (
          <Text style={styles.smallText}>No pending confirmations.</Text>
        ) : (
          pendingRequests.map((request) => (
            <View key={request.id} style={styles.listItem}>
              <Text style={styles.body}>{request.plateNumber}</Text>
              <Text style={styles.smallText}>Driver: {request.driverUid}</Text>
              <Text style={styles.smallText}>Requested: {toDateTime(request.requestedAt || request.createdAt)}</Text>
              <View style={styles.methodRow}>
                <Button
                  title="Approve"
                  loading={actionLoading === 'approveCheckInRequest'}
                  disabled={actionLoading === 'approveCheckInRequest'}
                  onPress={() => approveRequest(request.id)}
                />
                <Button
                  title="Reject"
                  variant="secondary"
                  loading={actionLoading === 'rejectCheckInRequest'}
                  disabled={actionLoading === 'rejectCheckInRequest'}
                  onPress={() => rejectRequest(request.id)}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      <Card title="Active Sessions">
        {!activeSessions.length ? (
          <Text style={styles.smallText}>No active sessions.</Text>
        ) : (
          activeSessions.map((session) => {
            const payment = pendingPayments.find((item) => item.sessionId === session.id);
            return (
              <View key={session.id} style={styles.listItem}>
                <Text style={styles.body}>{session.plateNumber}</Text>
                <Text style={styles.smallText}>Session: {session.id}</Text>
                <Text style={styles.smallText}>Payment: {session.paymentStatus || 'unpaid'}</Text>
                {payment ? (
                  <View style={styles.methodRow}>
                    <Button
                      title="Confirm Payment"
                      loading={actionLoading === 'confirmManualPayment'}
                      disabled={actionLoading === 'confirmManualPayment'}
                      onPress={() => confirmPayment(payment.id)}
                    />
                    <Button
                      title="Reject"
                      variant="secondary"
                      loading={actionLoading === 'rejectManualPayment'}
                      disabled={actionLoading === 'rejectManualPayment'}
                      onPress={() => rejectPayment(payment.id)}
                    />
                  </View>
                ) : (
                  <Text style={styles.smallText}>No pending payment for this session.</Text>
                )}
              </View>
            );
          })
        )}
      </Card>

      <Card title="Pending Payments">
        {!pendingPayments.length ? (
          <Text style={styles.smallText}>No pending payments.</Text>
        ) : (
          pendingPayments.map((request) => (
            <View key={request.id} style={styles.listItem}>
              <Text style={styles.body}>{request.plateNumber || 'Unknown Plate'}</Text>
              <Text style={styles.smallText}>Amount: {request.amountDue || 0} ETB</Text>
              <Text style={styles.smallText}>Method: {request.method || 'N/A'}</Text>
              <Text style={styles.smallText}>Reference: {request.referenceCode || 'Not provided'}</Text>
              <Text style={styles.smallText}>Submitted: {toDateTime(request.submittedAtMs || request.submittedAt)}</Text>
              <View style={styles.methodRow}>
                <Button
                  title="Confirm"
                  loading={actionLoading === 'confirmManualPayment'}
                  disabled={actionLoading === 'confirmManualPayment'}
                  onPress={() => confirmPayment(request.id)}
                />
                <Button
                  title="Reject"
                  variant="secondary"
                  loading={actionLoading === 'rejectManualPayment'}
                  disabled={actionLoading === 'rejectManualPayment'}
                  onPress={() => rejectPayment(request.id)}
                />
              </View>
            </View>
          ))
        )}
      </Card>
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
  selectorWrap: { gap: spacing.xs },
  inlineStats: { marginTop: spacing.sm, gap: spacing.xs },
  qrWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  listItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});

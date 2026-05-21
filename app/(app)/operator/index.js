import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import { auth, firestore } from '../../../src/config/firebase';
import { colors, radius, shadows, spacing, typography } from '../../../src/constants/theme';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import { operatorFunctions } from '../../../src/utils/functions';
import { listPendingPaymentsForOperator } from '../../../src/services/api';
import { normalizePlate, toDateTime, toMs, estimateCharge } from '../../../src/services/time';

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
  const [pendingPaymentsError, setPendingPaymentsError] = useState('');
  const [listenerWarning, setListenerWarning] = useState('');
  const [qrError, setQrError] = useState('');

  const [qrPayload, setQrPayload] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrRefreshNonce, setQrRefreshNonce] = useState(0);
  const [actionLoading, setActionLoading] = useState('');

  const [reservedBookings, setReservedBookings] = useState([]);
  const [reservationCode, setReservationCode] = useState('');
  const [gateBannerText, setGateBannerText] = useState('');
  const [searchPlateQuery, setSearchPlateQuery] = useState('');


  const isPermissionDenied = (error) =>
    String(error?.code || '').includes('permission-denied') ||
    String(error?.message || '').toLowerCase().includes('insufficient permission');

  const isServiceUnavailable = (error) =>
    String(error?.code || '').includes('unavailable') ||
    String(error?.message || '').toLowerCase().includes('service unavailable');

  const getErrorMessage = (error, fallback) => error?.message || fallback;

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
      (error) => {
        if (isPermissionDenied(error)) {
          setListenerWarning('Permissions are limited for some operator data.');
          return;
        }
        setListenerWarning(getErrorMessage(error, 'Failed to load operator profile.'));
      }
    );

    return () => unsub();
  }, [selectedParkingId]);

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
        (error) => {
          if (isPermissionDenied(error)) {
            setPendingRequests([]);
            setListenerWarning('Permissions are limited for some operator data.');
            return;
          }
          setListenerWarning(getErrorMessage(error, 'Failed to load pending check-in requests'));
        }
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
        (error) => {
          if (isPermissionDenied(error)) {
            setActiveSessions([]);
            setListenerWarning('Permissions are limited for some operator data.');
            return;
          }
          setListenerWarning(getErrorMessage(error, 'Failed to load active sessions'));
        }
      );

    return () => unsub();
  }, [selectedParkingId]);

  useEffect(() => {
    if (!selectedParkingId) {
      setReservedBookings([]);
      return undefined;
    }

    const unsub = firestore
      .collection('bookings')
      .where('parkingId', '==', selectedParkingId)
      .where('status', '==', 'reserved')
      .onSnapshot(
        (snapshot) => {
          const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setReservedBookings(bookings);
        },
        (error) => {
          if (isPermissionDenied(error)) {
            setReservedBookings([]);
            setListenerWarning('Permissions are limited for some operator data.');
            return;
          }
          setListenerWarning(getErrorMessage(error, 'Failed to load reserved bookings'));
        }
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
        setPendingPaymentsError('');
        setListenerWarning('');
      } catch (_) {
        if (mounted) {
          if (isPermissionDenied(_) || isServiceUnavailable(_)) {
            setPendingPaymentsError('Pending payments are temporarily unavailable.');
            setPendingPayments([]);
            return;
          }
          setPendingPaymentsError('Failed to load pending payments.');
        }
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
        setQrError('');
      } catch (error) {
        if (mounted) {
          if (isPermissionDenied(error)) {
            setQrPayload(null);
            setQrError('Missing or insufficient permissions for QR generation.');
            return;
          }
          if (isServiceUnavailable(error)) {
            setQrPayload(null);
            setQrError('QR service unavailable. Check emulator/network connection.');
            return;
          }
          setQrPayload(null);
          setQrError(getErrorMessage(error, 'Failed to create QR token.'));
        }
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
  }, [selectedParkingId, qrRefreshNonce]);

  if (initializing) return null;

  const selectedParking = useMemo(
    () => parkings.find((parking) => parking.id === selectedParkingId) || null,
    [parkings, selectedParkingId]
  );

  const spotStatusList = useMemo(() => {
    if (!selectedParking) return [];
    const capacity = selectedParking.slotCapacity || 10;
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const list = [];

    const occupiedMap = {};
    activeSessions.forEach((s) => {
      if (s.spotId) {
        occupiedMap[s.spotId] = { type: 'occupied', plate: s.plateNumber, id: s.id, driverId: s.driverId };
      }
    });

    const reservedMap = {};
    reservedBookings.forEach((b) => {
      if (b.spotId) {
        reservedMap[b.spotId] = { type: 'reserved', plate: b.plateNumber, code: b.reservationCode };
      }
    });

    for (let i = 0; i < capacity; i++) {
      const rowIdx = Math.floor(i / 10);
      const spotNum = (i % 10) + 1;
      const rowLetter = rows[rowIdx] || 'F';
      const spotId = `${rowLetter}${spotNum}`;

      let status = 'available';
      let details = null;
      if (occupiedMap[spotId]) {
        status = 'occupied';
        details = occupiedMap[spotId];
      } else if (reservedMap[spotId]) {
        status = 'reserved';
        details = reservedMap[spotId];
      }

      list.push({ spotId, status, details });
    }
    return list;
  }, [selectedParking, activeSessions, reservedBookings]);

  const flowState = activeSessions.length
    ? 'Approved / Active Session'
    : pendingRequests.length
    ? 'Pending Approval'
    : 'QR / Manual Check-In';

  const filteredActiveSessions = useMemo(() => {
    const q = String(searchPlateQuery || '').trim().toUpperCase();
    if (!q) return activeSessions;
    return activeSessions.filter((s) => String(s.plateNumber || '').toUpperCase().includes(q));
  }, [activeSessions, searchPlateQuery]);

  const withAction = async (name, work) => {
    setActionLoading(name);
    try {
      await work();
    } catch (error) {
      const msg = getErrorMessage(error, 'Action failed.');
      if (isPermissionDenied(error)) {
        setListenerWarning('Your operator account lacks required permissions for this action.');
        return;
      }
      Alert.alert('Error', msg);
    } finally {
      setActionLoading('');
    }
  };

  const flashGateBanner = (msg = 'Gate Unlocked!') => {
    setGateBannerText(msg);
    setTimeout(() => {
      setGateBannerText('');
    }, 5000);
  };

  const checkInVehicle = () =>
    withAction('checkInVehicle', async () => {
      const normalizedPlate = normalizePlate(plateNumber);
      const code = String(reservationCode || '').trim();
      if (!selectedParkingId) {
        Alert.alert('Missing data', 'Select a parking lot first.');
        return;
      }
      if (!normalizedPlate && !code) {
        Alert.alert('Missing data', 'Enter either a plate number or reservation code.');
        return;
      }
      const response = await operatorFunctions.checkInVehicle(selectedParkingId, normalizedPlate, allowWalkIn, code);
      Alert.alert(
        'Success',
        `Session started: ${response.sessionId || 'N/A'}${response.spotId ? ` (Spot: ${response.spotId})` : ''}`
      );
      setPlateNumber('');
      setReservationCode('');
      flashGateBanner(`Gate Unlocked! (Check-In: ${normalizedPlate || code})`);
    });

  const approveRequest = (requestId) =>
    withAction('approveCheckInRequest', async () => {
      const result = await operatorFunctions.approveCheckInRequest(requestId);
      Alert.alert('Approved', `Session ${result?.sessionId || ''} started.`);
      flashGateBanner(`Gate Unlocked! (Check-In Approved)`);
    });

  const performDirectCheckout = (plate, method) => {
    withAction('checkOutVehicle', async () => {
      if (!selectedParkingId) return;
      const result = await operatorFunctions.checkOutVehicle(selectedParkingId, plate, method);

      Alert.alert(
        'Checkout Successful',
        `Gate Unlocked!\nPlate: ${plate}\nPayment Method: ${method.toUpperCase()}\nTotal Paid: $${(result?.receipt?.amountDue || 0).toFixed(2)} ETB\nRemaining Balance: $${(result?.receipt?.driverRemainingBalance ?? 0).toFixed(2)} ETB`
      );

      flashGateBanner(`Gate Unlocked! (Check-Out: ${plate})`);
    });
  };

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {gateBannerText ? (
        <View style={styles.gateBanner}>
          <MaterialIcons name="lock-open" size={20} color="#FFFFFF" />
          <Text style={styles.gateBannerText}>{gateBannerText}</Text>
        </View>
      ) : null}
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Operations</Text>
          <Text style={styles.title}>Operator Dashboard</Text>
        </View>
        {listenerWarning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{listenerWarning}</Text>
          </View>
        ) : null}

        <Card title="Check-In Flow State">
          <Text style={styles.smallText}>Reserve → QR/Manual Check-In → Pending Approval → Approved/Active Session</Text>
          <Text style={styles.body}>{flowState}</Text>
        </Card>

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

        {/* Dynamic Textual Spot Status List */}
        <Card title="Lot Spot Status Grid">
          <Text style={styles.smallText}>Comprehensive status grid representation of each spot state.</Text>
          {!selectedParkingId ? (
            <Text style={styles.smallText}>Select a lot to check spot assignments.</Text>
          ) : (
            <View style={styles.spotGrid}>
              {spotStatusList.map((spot) => {
                let bg = '#E6F4EA';
                let border = '#34A853';
                let textColor = '#137333';
                if (spot.status === 'occupied') {
                  bg = '#FCE8E6';
                  border = '#EA4335';
                  textColor = '#C5221F';
                } else if (spot.status === 'reserved') {
                  bg = '#FEF7E0';
                  border = '#FBBC04';
                  textColor = '#B06000';
                }

                return (
                  <View key={spot.spotId} style={[styles.spotItem, { backgroundColor: bg, borderColor: border }]}>
                    <Text style={[styles.spotIdText, { color: textColor }]}>{spot.spotId}</Text>
                    <Text style={[styles.spotStatusText, { color: textColor }]}>{spot.status.toUpperCase()}</Text>
                    {spot.details?.plate ? (
                      <Text style={[styles.spotPlateText, { color: textColor }]} numberOfLines={1}>
                        {spot.details.plate}
                      </Text>
                    ) : null}
                    {spot.details?.code ? (
                      <Text style={[styles.spotCodeText, { color: textColor }]} numberOfLines={1}>
                        Ref: {spot.details.code}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
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
            <Text style={styles.smallText}>{qrError || 'QR unavailable.'}</Text>
          )}
        </Card>

        <Card title="Manual Vehicle Check-In">
          <Input
            placeholder="Plate Number"
            value={plateNumber}
            onChangeText={(value) => setPlateNumber(normalizePlate(value))}
            autoCapitalize="characters"
          />
          <Input
            placeholder="Reservation Code (Optional)"
            value={reservationCode}
            onChangeText={setReservationCode}
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

        {/* Active Reservations Card */}
        <Card title="Active Reservations">
          {!reservedBookings.length ? (
            <Text style={styles.smallText}>No active reservations.</Text>
          ) : (
            reservedBookings.map((booking) => (
              <View key={booking.id} style={styles.listItem}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.body}>{booking.plateNumber}</Text>
                  <Text style={styles.spotBadge}>{booking.spotId || 'Pending'}</Text>
                </View>
                <Text style={styles.smallText}>
                  Code: <Text style={styles.boldText}>{booking.reservationCode}</Text>
                </Text>
                <Text style={styles.smallText}>
                  Reserved: {toDateTime(booking.startTimeMs)} to {toDateTime(booking.endTimeMs)}
                </Text>
                <Text style={styles.smallText}>Status: {booking.status}</Text>
              </View>
            ))
          )}
        </Card>

        {/* Active Sessions Card with Search Bar and estimated fare & checkout selectors */}
        <Card title="Active Sessions">
          <Input
            placeholder="🔍 Search Plate Number..."
            value={searchPlateQuery}
            onChangeText={setSearchPlateQuery}
            autoCapitalize="characters"
          />
          {!filteredActiveSessions.length ? (
            <Text style={styles.smallText}>No matching active sessions.</Text>
          ) : (
            filteredActiveSessions.map((session) => {
              const payment = pendingPayments.find((item) => item.sessionId === session.id);
              const hourlyRate = selectedParking?.hourlyRate || 50;
              const estimated = estimateCharge(session.entryTime, hourlyRate);

              return (
                <View key={session.id} style={styles.listItem}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.body}>{session.plateNumber}</Text>
                    <Text style={styles.spotBadge}>{session.spotId || 'Walk-In'}</Text>
                  </View>
                  <Text style={styles.smallText}>Session: {session.id}</Text>
                  <Text style={styles.smallText}>Entered: {toDateTime(session.entryTime)}</Text>
                  <Text style={styles.smallText}>
                    Est. Duration: {estimated.billedHours} hr ({estimated.durationMinutes} mins)
                  </Text>
                  <Text style={styles.smallText}>
                    Est. Fare: <Text style={styles.boldText}>${estimated.amountDue.toFixed(2)} ETB</Text>
                  </Text>
                  <Text style={styles.smallText}>Payment: {session.paymentStatus || 'unpaid'}</Text>

                  <View style={[styles.methodRow, { marginTop: spacing.xs }]}>
                    <Button
                      title="⚡ Direct Checkout"
                      onPress={() => {
                        Alert.alert(
                          'Direct Checkout',
                          `Calculate Fee for ${session.plateNumber}\nEstimated Due: $${estimated.amountDue.toFixed(2)} ETB\nSelect payment method:`,
                          [
                            {
                              text: '💵 Cash Payment',
                              onPress: () => performDirectCheckout(session.plateNumber, 'cash'),
                            },
                            {
                              text: '📱 Driver Wallet',
                              onPress: () => performDirectCheckout(session.plateNumber, 'wallet'),
                            },
                            {
                              text: 'Cancel',
                              style: 'cancel',
                            },
                          ]
                        );
                      }}
                    />
                    {payment ? (
                      <>
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
                      </>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </Card>

        <Card title="Pending Payments">
          {pendingPaymentsError ? <Text style={styles.warningText}>{pendingPaymentsError}</Text> : null}
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
    </View>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <MaterialIcons name="dashboard" size={16} color={colors.primaryDark} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  kicker: { ...typography.small, color: '#BFDBFE', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.surface },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...typography.h3, color: colors.text },
  body: { ...typography.body, color: colors.text },
  smallText: { ...typography.caption, color: colors.textSecondary },
  warningText: { ...typography.caption, color: colors.warning, marginBottom: spacing.xs },
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
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
  gateBanner: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  gateBannerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  spotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  spotItem: {
    width: '31%',
    minHeight: 70,
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  spotIdText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  spotStatusText: {
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
  },
  spotPlateText: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  spotCodeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    opacity: 0.8,
    marginTop: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  spotBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
});

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
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import { auth, firestore } from '../../../src/config/firebase';
import { colors, radius, shadows, spacing, typography } from '../../../src/constants/theme';
import { driverFunctions } from '../../../src/utils/functions';
import { getParkingPaymentDetails, listPendingPaymentsForDriver } from '../../../src/services/api';
import { estimateCharge, normalizePlate, parkingCoords, toDateTime, toMs } from '../../../src/services/time';

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
  const [uiBanner, setUiBanner] = useState({ type: '', message: '' });
  const [manualQrInput, setManualQrInput] = useState('');
  const [loadingReserve, setLoadingReserve] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState('');

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [referenceCode, setReferenceCode] = useState('');
  const [paymentDestination, setPaymentDestination] = useState({ phone: '', bankAccountNumber: '' });
  const [loadingDestination, setLoadingDestination] = useState(false);

  // New states for feature enhancements
  const [driverProfile, setDriverProfile] = useState(null);
  const [reserveStartTimeOption, setReserveStartTimeOption] = useState('now');
  const [reserveDurationOption, setReserveDurationOption] = useState(1);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [receiptDetails, setReceiptDetails] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);

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
        (error) => setUiBanner({ type: 'error', message: error.message || 'Failed to load parkings' })
      );

    return () => unsubscribe();
  }, [selectedParkingId]);

  // Subscribe to driver user profile for wallet balance
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return undefined;

    const unsubProfile = firestore
      .collection('users')
      .doc(uid)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setDriverProfile(doc.data());
          } else {
            setDriverProfile({ walletBalance: 100.00 });
          }
        },
        (error) => setUiBanner({ type: 'error', message: error.message || 'Failed to load wallet profile' })
      );

    return () => unsubProfile();
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return undefined;

    const unsubBookings = firestore
      .collection('bookings')
      .where('driverId', '==', uid)
      .where('status', 'in', ['reserved', 'checked_in'])
      .onSnapshot(
        (snapshot) => {
          const now = Date.now();
          const list = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((booking) => {
              if (booking.status !== 'reserved') return true;
              const expiresMs = toMs(booking.expiresAt);
              return !expiresMs || expiresMs > now;
            });
          setActiveBookings(list);
        },
        (error) => setUiBanner({ type: 'error', message: error.message || 'Failed to load bookings' })
      );

    const unsubSessions = firestore
      .collection('sessions')
      .where('driverId', '==', uid)
      .where('status', '==', 'active')
      .onSnapshot(
        (snapshot) => setActiveSessions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))),
        (error) => setUiBanner({ type: 'error', message: error.message || 'Failed to load sessions' })
      );

    let mounted = true;
    const loadPending = async () => {
      try {
        const result = await listPendingPaymentsForDriver();
        if (!mounted) return;
        setPendingPayments(Array.isArray(result?.pendingPayments) ? result.pendingPayments : []);
        setPendingPaymentsError('');
        setUiBanner((prev) => (prev.type === 'error' && prev.message === 'Pending payments are temporarily unavailable.' ? { type: '', message: '' } : prev));
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
  const hasActiveSession = activeSessions.length > 0;
  const hasReservedBooking = activeBookings.some((booking) => booking.status === 'reserved');
  const flowState = hasActiveSession ? 'Approved / Active Session' : hasReservedBooking ? 'Reserve Complete / Awaiting Check-In' : 'Reserve';
  const selectedCoords = parkingCoords(selectedParking);

  const handleTopUp = async (amount) => {
    try {
      setWalletLoading(true);
      const res = await driverFunctions.topUpWallet(amount);
      Alert.alert('Success', `Successfully topped up ${amount.toFixed(2)} ETB.\nNew Balance: ${res.newBalance.toFixed(2)} ETB`);
    } catch (error) {
      Alert.alert('Top up failed', error.message || 'Unable to top up');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleWalletCheckout = async (session) => {
    try {
      setCheckoutLoading(session.id);
      const result = await driverFunctions.checkOutVehicle(
        session.parkingId,
        session.plateNumber
      );
      setReceiptDetails(result.receipt);
      setReceiptModalVisible(true);
    } catch (error) {
      Alert.alert('Checkout failed', error.message || 'Unable to checkout');
    } finally {
      setCheckoutLoading('');
    }
  };

  // Textual Routing Helper
  const getNavigationDirections = (spotId) => {
    if (!spotId) return null;
    const zone = spotId.charAt(0).toUpperCase();
    const num = spotId.substring(1);
    return {
      driving: `🚗 Driving Directions to Spot ${spotId}:\n1. Drive through the entrance gate.\n2. Proceed straight and follow the lane signs for Zone ${zone}.\n3. Locate Spot ${spotId} in Row ${zone === 'A' ? '1' : '2'} (it's space #${num} on the right).`,
      walking: `🚶 Walking Directions back to Spot ${spotId}:\n1. Leave through the pedestrian elevator near the main lobby.\n2. Head ${zone === 'A' ? 'left' : 'right'} down the pedestrian corridor.\n3. Spot ${spotId} is located in Zone ${zone}, Row ${zone === 'A' ? '1' : '2'}.`
    };
  };

  const activeSessionWithSpot = activeSessions.find(s => s.spotId);
  const activeBookingWithSpot = activeBookings.find(b => b.spotId);
  const navigationSpotId = activeSessionWithSpot?.spotId || activeBookingWithSpot?.spotId;
  const navigationDirections = getNavigationDirections(navigationSpotId);

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
      const now = Date.now();
      let startTimeMs = now;
      if (reserveStartTimeOption === '15m') startTimeMs = now + 15 * 60 * 1000;
      else if (reserveStartTimeOption === '30m') startTimeMs = now + 30 * 60 * 1000;
      const endTimeMs = startTimeMs + reserveDurationOption * 60 * 60 * 1000;

      const response = await driverFunctions.createBooking(
        selectedParkingId,
        normalizePlate(plateNumber),
        startTimeMs,
        endTimeMs
      );
      Alert.alert('Success', `Booking created!\nSpot Allocated: ${response.spotId || 'N/A'}\nReservation Code: ${response.reservationCode || 'N/A'}\nHold Fee: 20.00 ETB deducted.`);
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
      <View style={styles.hero}>
        <Text style={styles.kicker}>Mobility</Text>
        <Text style={styles.title}>Driver Dashboard</Text>
      </View>

      {/* ETB Wallet Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <MaterialIcons name="account-balance-wallet" size={20} color={colors.surface} />
          <Text style={styles.walletLabel}>ETB DIGITAL WALLET</Text>
        </View>
        <Text style={styles.walletBalance}>
          {(driverProfile?.walletBalance !== undefined ? driverProfile.walletBalance : 100.00).toFixed(2)} ETB
        </Text>
        <Text style={styles.walletSubtext}>Instant checkout deductions & reservation bookings</Text>
        
        <View style={styles.quickTopUpRow}>
          <Text style={styles.topUpLabel}>Quick top-up wallet:</Text>
          <View style={styles.topUpButtons}>
            <TouchableOpacity 
              style={styles.topUpBtn} 
              onPress={() => handleTopUp(100)}
              disabled={walletLoading}
            >
              <Text style={styles.topUpBtnText}>+100.00 ETB</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.topUpBtn} 
              onPress={() => handleTopUp(200)}
              disabled={walletLoading}
            >
              <Text style={styles.topUpBtnText}>+200.00 ETB</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.topUpBtn} 
              onPress={() => handleTopUp(500)}
              disabled={walletLoading}
            >
              <Text style={styles.topUpBtnText}>+500.00 ETB</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Navigation Directions Box */}
      {navigationDirections ? (
        <Card title="Navigation Directions">
          <View style={styles.navBlock}>
            <Text style={styles.navSpotHeader}>
              Assigned Spot: <Text style={styles.navSpotValue}>{navigationSpotId}</Text>
            </Text>
            
            <View style={styles.directionSection}>
              <Text style={styles.directionText}>{navigationDirections.driving}</Text>
            </View>
            
            <View style={styles.directionDivider} />
            
            <View style={styles.directionSection}>
              <Text style={styles.directionText}>{navigationDirections.walking}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {uiBanner.message ? (
        <View style={[styles.banner, uiBanner.type === 'error' ? styles.errorBanner : styles.successBanner]}>
          <Text style={[styles.smallText, uiBanner.type === 'error' ? styles.errorBannerText : styles.successBannerText]}>{uiBanner.message}</Text>
        </View>
      ) : null}

      <Card title="Booking Flow State">
        <Text style={styles.smallText}>Reserve → QR/Manual Check-In → Pending Approval → Approved/Active Session</Text>
        <Text style={styles.body}>{flowState}</Text>
      </Card>

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

      <Card title="Choose Parking">
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
              Graphical maps are disabled for efficiency. Open coordinates below in Google Maps.
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

      {/* Upgraded Reserve Slot Card with date-time duration selections */}
      <Card title="Reserve Slot">
        <Text style={styles.fieldLabel}>Plate Number</Text>
        <Input
          placeholder="Plate Number (e.g., AA-1-A12345)"
          value={plateNumber}
          onChangeText={(value) => setPlateNumber(normalizePlate(value))}
          autoCapitalize="characters"
        />

        <Text style={styles.fieldLabel}>Start Time</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.timeChip, reserveStartTimeOption === 'now' && styles.chipActive]}
            onPress={() => setReserveStartTimeOption('now')}
          >
            <Text style={[styles.timeChipText, reserveStartTimeOption === 'now' && styles.timeChipTextActive]}>Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeChip, reserveStartTimeOption === '15m' && styles.chipActive]}
            onPress={() => setReserveStartTimeOption('15m')}
          >
            <Text style={[styles.timeChipText, reserveStartTimeOption === '15m' && styles.timeChipTextActive]}>In 15 Mins</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.timeChip, reserveStartTimeOption === '30m' && styles.chipActive]}
            onPress={() => setReserveStartTimeOption('30m')}
          >
            <Text style={[styles.timeChipText, reserveStartTimeOption === '30m' && styles.timeChipTextActive]}>In 30 Mins</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Duration Block</Text>
        <View style={styles.chipRow}>
          {[1, 2, 3, 5, 8].map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.timeChip, reserveDurationOption === h && styles.chipActive]}
              onPress={() => setReserveDurationOption(h)}
            >
              <Text style={[styles.timeChipText, reserveDurationOption === h && styles.timeChipTextActive]}>
                {h} Hour{h > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.feeInfoContainer}>
          <MaterialIcons name="info-outline" size={16} color="#B45309" />
          <Text style={styles.feeInfoText}>
            Holds Spot. Fee: $20.00 hold fee. Releasing spot past 15-min grace period incurs a $15.00 no-show penalty.
          </Text>
        </View>

        <Button title={loadingReserve ? 'Reserving...' : 'Reserve Spot'} loading={loadingReserve} onPress={reserveSlot} />
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
              <Text style={styles.smallText}>Spot ID: <Text style={{fontWeight: 'bold', color: colors.primary}}>{booking.spotId || 'Pending'}</Text></Text>
              <Text style={styles.smallText}>Reservation Code: <Text style={{fontWeight: 'bold', color: colors.warning}}>{booking.reservationCode || 'N/A'}</Text></Text>
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
            const isActiveSession = session.status === 'active';
            const paymentConfirmed = session.paymentStatus === 'confirmed';
            const canCheckout = isActiveSession && !pending && !paymentConfirmed;
            return (
              <View key={session.id} style={styles.listItem}>
                <Text style={styles.body}>{session.plateNumber}</Text>
                <Text style={styles.smallText}>Parking: {session.parkingId}</Text>
                <Text style={styles.smallText}>Spot ID: <Text style={{fontWeight: 'bold', color: colors.success}}>{session.spotId || 'N/A'}</Text></Text>
                {!isActiveSession ? <Text style={styles.warning}>Checkout unavailable: session is not active.</Text> : null}
                {paymentConfirmed ? <Text style={styles.smallText}>Payment already confirmed for this session.</Text> : null}
                {pending ? <Text style={styles.pendingText}>Payment submitted. Waiting for operator.</Text> : null}
                
                <View style={{flexDirection: 'column', gap: 6, marginTop: 8}}>
                  <Button
                    title="Instant Wallet Checkout"
                    disabled={!canCheckout || checkoutLoading === session.id}
                    loading={checkoutLoading === session.id}
                    onPress={() => handleWalletCheckout(session)}
                  />
                  <Button
                    title="Submit Manual Payment"
                    variant="secondary"
                    disabled={!canCheckout || checkoutLoading === session.id}
                    onPress={() => openPaymentModal(session)}
                  />
                </View>
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
              <Text style={styles.smallText}>Submitted: {toDateTime(request.submittedAtMs || request.submittedAt)}</Text>
            </View>
          ))
        )}
      </Card>

      {/* Manual Payment Modal */}
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

      {/* Itemized Wallet Checkout Receipt Modal */}
      <Modal visible={receiptModalVisible} transparent animationType="slide" onRequestClose={() => setReceiptModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.receiptSuccessHeader}>
              <MaterialIcons name="check-circle" size={40} color={colors.success} />
              <Text style={styles.receiptSuccessTitle}>Checkout Complete!</Text>
            </View>
            
            <View style={styles.gateAlertBanner}>
              <MaterialIcons name="door-sliding" size={24} color={colors.success} />
              <Text style={styles.gateAlertText}>Exit Gate Unlocked! Drive safely.</Text>
            </View>

            {receiptDetails ? (
              <View style={styles.receiptContent}>
                <Text style={styles.receiptKicker}>ITEMIZED DIGITAL RECEIPT</Text>
                
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptItemLabel}>Duration:</Text>
                  <Text style={styles.receiptItemValue}>
                    {receiptDetails.billedHours} hr{receiptDetails.billedHours > 1 ? 's' : ''} ({receiptDetails.durationMinutes} mins)
                  </Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptItemLabel}>Base Fare:</Text>
                  <Text style={styles.receiptItemValue}>${receiptDetails.baseFare.toFixed(2)} ETB</Text>
                </View>

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptItemLabel}>VAT (15%):</Text>
                  <Text style={styles.receiptItemValue}>${receiptDetails.tax.toFixed(2)} ETB</Text>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptItemLabelTotal}>Total Deducted:</Text>
                  <Text style={styles.receiptItemValueTotal}>${receiptDetails.amountDue.toFixed(2)} ETB</Text>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptRow}>
                  <Text style={styles.receiptItemLabel}>Remaining Balance:</Text>
                  <Text style={styles.receiptItemValue}>${receiptDetails.remainingBalance.toFixed(2)} ETB</Text>
                </View>
              </View>
            ) : null}

            <Button title="Dismiss" variant="secondary" style={{ marginTop: 16 }} onPress={() => setReceiptModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <MaterialIcons name="grid-view" size={16} color={colors.primaryDark} />
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
  
  // Wallet Styling
  walletCard: {
    backgroundColor: '#1E40AF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  walletLabel: {
    ...typography.small,
    color: '#93C5FD',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  walletBalance: {
    ...typography.h1,
    color: colors.surface,
    fontWeight: '800',
    marginVertical: spacing.xs,
  },
  walletSubtext: {
    ...typography.small,
    color: '#E0F2FE',
    marginBottom: spacing.md,
  },
  quickTopUpRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: spacing.sm,
  },
  topUpLabel: {
    ...typography.caption,
    color: '#93C5FD',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  topUpButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  topUpBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  topUpBtnText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: 'bold',
  },

  // Navigation Directions Styling
  navBlock: {
    gap: spacing.sm,
  },
  navSpotHeader: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  navSpotValue: {
    color: colors.primary,
    fontWeight: '800',
  },
  directionSection: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: spacing.sm,
  },
  directionText: {
    ...typography.caption,
    color: '#0369A1',
    lineHeight: 20,
  },
  directionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },

  // Custom booking styling
  fieldLabel: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  timeChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  timeChipText: {
    ...typography.small,
    color: colors.text,
  },
  timeChipTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  feeInfoContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: spacing.xs,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  feeInfoText: {
    ...typography.small,
    color: '#B45309',
    flex: 1,
  },

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
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBanner: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  successBanner: {
    borderColor: '#6ee7b7',
    backgroundColor: '#ecfdf5',
  },
  errorBannerText: { color: '#b91c1c' },
  successBannerText: { color: '#065f46' },
  warning: { ...typography.caption, color: colors.warning, marginBottom: spacing.sm },
  rowGap: { gap: spacing.xs },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#dbeafe' },
  chipTitle: { ...typography.caption, color: colors.text, fontWeight: '600' },
  chipTitleActive: { color: colors.primary },
  chipMeta: { ...typography.small, color: colors.textSecondary },
  mapContainer: { borderRadius: 8, overflow: 'hidden', height: 200, borderWidth: 1, borderColor: colors.border },
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
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceMuted,
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
    borderRadius: radius.lg,
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

  // Receipt Modal Styling
  receiptSuccessHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  receiptSuccessTitle: {
    ...typography.h3,
    color: colors.success,
    fontWeight: 'bold',
  },
  gateAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  gateAlertText: {
    ...typography.caption,
    color: '#065F46',
    fontWeight: 'bold',
    flex: 1,
  },
  receiptContent: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
  },
  receiptKicker: {
    ...typography.small,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  receiptItemLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  receiptItemValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  receiptItemLabelTotal: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  receiptItemValueTotal: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

import { useMemo, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import { colors, spacing, typography } from '../../../src/constants/theme';
import {
  useAdminAnalytics,
  useAssignOperatorToParking,
  useCreateOwnerAccount,
  useOperatorsList,
  useOwnersList,
  useParkingsList,
  useUpsertParking,
} from '../../../src/services/dashboardHooks';

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(37,99,235,${opacity})`,
  labelColor: () => colors.textSecondary,
};

export default function AdminHomeScreen() {
  const { initializing } = useProtectedRoute(['admin']);
  const [rangePreset, setRangePreset] = useState('30d');

  const analyticsQuery = useAdminAnalytics(rangePreset);
  const ownersQuery = useOwnersList();
  const parkingsQuery = useParkingsList();
  const operatorsQuery = useOperatorsList();

  const createOwner = useCreateOwnerAccount();
  const upsertParking = useUpsertParking();
  const assignOperator = useAssignOperatorToParking();

  const owners = ownersQuery.data || [];
  const parkings = parkingsQuery.data || [];
  const operators = operatorsQuery.data || [];
  const analytics = analyticsQuery.data;

  const [ownerForm, setOwnerForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    bankAccountNumber: '',
  });

  const [parkingForm, setParkingForm] = useState({
    parkingId: '',
    ownerId: '',
    name: '',
    address: '',
    status: 'active',
    slotCapacity: '20',
    availableSlots: '20',
    reservedSlots: '0',
    occupiedSlots: '0',
    hourlyRate: '50',
    lat: '',
    lng: '',
  });

  const [assignmentForm, setAssignmentForm] = useState({ operatorUid: '', parkingId: '', assign: true });

  if (initializing) return null;

  const chartWidth = Math.max(Dimensions.get('window').width - 48, 260);
  const summary = analytics?.summary || {};
  const revenueSeries = analytics?.revenueSeries || [];
  const paymentBreakdown = analytics?.paymentMethodBreakdown || [];

  const revenueData = useMemo(
    () => ({
      labels: revenueSeries.slice(-7).map((item) => item.label),
      datasets: [{ data: revenueSeries.slice(-7).map((item) => Number(item.grossAmount || 0)) }],
    }),
    [revenueSeries]
  );

  const methodData = useMemo(
    () => ({
      labels: paymentBreakdown.map((item) => item.method),
      datasets: [{ data: paymentBreakdown.map((item) => Number(item.amount || 0)) }],
    }),
    [paymentBreakdown]
  );

  const pieData = useMemo(
    () =>
      paymentBreakdown.map((item, index) => ({
        name: item.method,
        amount: Number(item.amount || 0),
        color: ['#2563eb', '#16a34a', '#f59e0b', '#ef4444'][index % 4],
        legendFontColor: colors.text,
        legendFontSize: 12,
      })),
    [paymentBreakdown]
  );

  const submitOwner = async () => {
    if (!ownerForm.fullName || !ownerForm.email || !ownerForm.password) {
      Alert.alert('Missing data', 'fullName, email and password are required.');
      return;
    }
    try {
      await createOwner.mutateAsync(ownerForm);
      Alert.alert('Success', 'Owner account created.');
      setOwnerForm({ fullName: '', email: '', password: '', phone: '', bankAccountNumber: '' });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create owner account');
    }
  };

  const submitParking = async () => {
    const lat = Number(parkingForm.lat);
    const lng = Number(parkingForm.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      Alert.alert('Invalid location', 'Latitude and longitude are required.');
      return;
    }

    try {
      await upsertParking.mutateAsync({
        ...parkingForm,
        slotCapacity: Number(parkingForm.slotCapacity || 0),
        availableSlots: Number(parkingForm.availableSlots || 0),
        reservedSlots: Number(parkingForm.reservedSlots || 0),
        occupiedSlots: Number(parkingForm.occupiedSlots || 0),
        hourlyRate: Number(parkingForm.hourlyRate || 0),
        lat,
        lng,
      });
      Alert.alert('Saved', 'Parking saved successfully.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save parking');
    }
  };

  const submitAssignment = async () => {
    if (!assignmentForm.operatorUid || !assignmentForm.parkingId) {
      Alert.alert('Missing data', 'Select operator and parking.');
      return;
    }

    try {
      await assignOperator.mutateAsync(assignmentForm);
      Alert.alert('Saved', 'Operator assignment updated.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update assignment');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <Card title="Analytics Range">
        <View style={styles.row}>
          <Button title="Last 7 Days" variant={rangePreset === '7d' ? 'primary' : 'secondary'} onPress={() => setRangePreset('7d')} />
          <Button title="Last 30 Days" variant={rangePreset === '30d' ? 'primary' : 'secondary'} onPress={() => setRangePreset('30d')} />
        </View>
        {analyticsQuery.isLoading ? <Text style={styles.smallText}>Loading analytics...</Text> : null}
      </Card>

      <Card title="Summary">
        <Text style={styles.body}>Gross Revenue: {Number(summary.totalGrossRevenue || 0).toFixed(2)} ETB</Text>
        <Text style={styles.smallText}>Admin 10%: {Number(summary.totalAdminCommission || 0).toFixed(2)} ETB</Text>
        <Text style={styles.smallText}>Owner Share: {Number(summary.totalOwnerRevenue || 0).toFixed(2)} ETB</Text>
        <Text style={styles.smallText}>Confirmed Payments: {summary.totalConfirmedPayments || 0}</Text>
        <Text style={styles.smallText}>Pending Payment Requests: {summary.pendingPaymentRequests || 0}</Text>
      </Card>

      {revenueSeries.length ? (
        <Card title="Revenue Trend (Gross)">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={revenueData}
              width={Math.max(chartWidth, revenueData.labels.length * 60)}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        </Card>
      ) : null}

      {paymentBreakdown.length ? (
        <Card title="Payment Method Breakdown">
          <BarChart
            data={methodData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            fromZero
            style={styles.chart}
            showValuesOnTopOfBars
          />
          <PieChart
            data={pieData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </Card>
      ) : null}

      <Card title="Create Owner Account">
        <Input placeholder="Full Name" value={ownerForm.fullName} onChangeText={(fullName) => setOwnerForm((prev) => ({ ...prev, fullName }))} />
        <Input placeholder="Email" value={ownerForm.email} onChangeText={(email) => setOwnerForm((prev) => ({ ...prev, email }))} autoCapitalize="none" />
        <Input placeholder="Temporary Password" value={ownerForm.password} onChangeText={(password) => setOwnerForm((prev) => ({ ...prev, password }))} secureTextEntry />
        <Input placeholder="Phone (optional)" value={ownerForm.phone} onChangeText={(phone) => setOwnerForm((prev) => ({ ...prev, phone }))} />
        <Input
          placeholder="Bank Account Number (optional)"
          value={ownerForm.bankAccountNumber}
          onChangeText={(bankAccountNumber) => setOwnerForm((prev) => ({ ...prev, bankAccountNumber }))}
        />
        <Button title="Create Owner" loading={createOwner.isPending} onPress={submitOwner} />
      </Card>

      <Card title="Create / Update Parking">
        <Input placeholder="Parking ID (optional)" value={parkingForm.parkingId} onChangeText={(parkingId) => setParkingForm((prev) => ({ ...prev, parkingId }))} />
        <Input placeholder="Owner ID" value={parkingForm.ownerId} onChangeText={(ownerId) => setParkingForm((prev) => ({ ...prev, ownerId }))} />
        <Input placeholder="Parking Name" value={parkingForm.name} onChangeText={(name) => setParkingForm((prev) => ({ ...prev, name }))} />
        <Input placeholder="Address" value={parkingForm.address} onChangeText={(address) => setParkingForm((prev) => ({ ...prev, address }))} />
        <Input placeholder="Latitude" value={parkingForm.lat} onChangeText={(lat) => setParkingForm((prev) => ({ ...prev, lat }))} keyboardType="numeric" />
        <Input placeholder="Longitude" value={parkingForm.lng} onChangeText={(lng) => setParkingForm((prev) => ({ ...prev, lng }))} keyboardType="numeric" />
        <Input placeholder="Capacity" value={parkingForm.slotCapacity} onChangeText={(slotCapacity) => setParkingForm((prev) => ({ ...prev, slotCapacity }))} keyboardType="numeric" />
        <Input placeholder="Available" value={parkingForm.availableSlots} onChangeText={(availableSlots) => setParkingForm((prev) => ({ ...prev, availableSlots }))} keyboardType="numeric" />
        <Input placeholder="Reserved" value={parkingForm.reservedSlots} onChangeText={(reservedSlots) => setParkingForm((prev) => ({ ...prev, reservedSlots }))} keyboardType="numeric" />
        <Input placeholder="Occupied" value={parkingForm.occupiedSlots} onChangeText={(occupiedSlots) => setParkingForm((prev) => ({ ...prev, occupiedSlots }))} keyboardType="numeric" />
        <Input placeholder="Hourly Rate" value={parkingForm.hourlyRate} onChangeText={(hourlyRate) => setParkingForm((prev) => ({ ...prev, hourlyRate }))} keyboardType="numeric" />
        <Input placeholder="Status (active/inactive)" value={parkingForm.status} onChangeText={(status) => setParkingForm((prev) => ({ ...prev, status }))} />
        <Button title="Save Parking" loading={upsertParking.isPending} onPress={submitParking} />
      </Card>

      <Card title="Assign Operator to Parking">
        <Input
          placeholder="Operator UID"
          value={assignmentForm.operatorUid}
          onChangeText={(operatorUid) => setAssignmentForm((prev) => ({ ...prev, operatorUid }))}
        />
        <Input
          placeholder="Parking ID"
          value={assignmentForm.parkingId}
          onChangeText={(parkingId) => setAssignmentForm((prev) => ({ ...prev, parkingId }))}
        />
        <View style={styles.row}>
          <Button
            title={assignmentForm.assign ? 'Assign Mode' : 'Unassign Mode'}
            variant="secondary"
            onPress={() => setAssignmentForm((prev) => ({ ...prev, assign: !prev.assign }))}
          />
          <Button title="Save Assignment" loading={assignOperator.isPending} onPress={submitAssignment} />
        </View>
      </Card>

      <Card title="Current Owners">
        {!owners.length ? (
          <Text style={styles.smallText}>No owners found.</Text>
        ) : (
          owners.map((owner) => (
            <View key={owner.id} style={styles.listItem}>
              <Text style={styles.body}>{owner.fullName || owner.id}</Text>
              <Text style={styles.smallText}>{owner.email}</Text>
              <Text style={styles.smallText}>Owner ID: {owner.ownerId || owner.id}</Text>
            </View>
          ))
        )}
      </Card>

      <Card title="Current Operators">
        {!operators.length ? (
          <Text style={styles.smallText}>No operators found.</Text>
        ) : (
          operators.map((operator) => (
            <View key={operator.id} style={styles.listItem}>
              <Text style={styles.body}>{operator.fullName || operator.email || operator.id}</Text>
              <Text style={styles.smallText}>Status: {operator.status || 'unknown'}</Text>
              <Text style={styles.smallText}>Assigned: {(operator.assignedParkingIds || []).join(', ') || 'none'}</Text>
            </View>
          ))
        )}
      </Card>

      <Card title="Current Parkings">
        {!parkings.length ? (
          <Text style={styles.smallText}>No parkings found.</Text>
        ) : (
          parkings.map((parking) => (
            <View key={parking.id} style={styles.listItem}>
              <Text style={styles.body}>{parking.name || parking.id}</Text>
              <Text style={styles.smallText}>{parking.address || 'No address'}</Text>
              <Text style={styles.smallText}>Owner: {parking.ownerId || 'N/A'}</Text>
              <Text style={styles.smallText}>
                Slots A/R/O: {parking.availableSlots || 0}/{parking.reservedSlots || 0}/{parking.occupiedSlots || 0}
              </Text>
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
  chart: { marginVertical: spacing.sm, borderRadius: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  listItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
});

import { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useProtectedRoute } from '../../../src/hooks/useProtectedRoute';
import Input from '../../../src/components/common/Input';
import Button from '../../../src/components/common/Button';
import { colors, radius, shadows, spacing, typography } from '../../../src/constants/theme';
import {
  useOwnerAnalytics,
  useOwnerCreateOperator,
  useOwnerSetOperatorStatus,
  useOwnerUpdateOperatorAssignments,
  useOwnerUpdatePaymentDetails,
} from '../../../src/services/dashboardHooks';

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: () => colors.textSecondary,
  propsForDots: { r: '3', strokeWidth: '1', stroke: '#2563eb' },
};

export default function OwnerHomeScreen() {
  const { initializing } = useProtectedRoute(['owner']);
  const [rangePreset, setRangePreset] = useState('30d');

  const analyticsQuery = useOwnerAnalytics(rangePreset);
  const analytics = analyticsQuery.data;

  const updatePayment = useOwnerUpdatePaymentDetails();
  const createOperator = useOwnerCreateOperator();
  const updateAssignments = useOwnerUpdateOperatorAssignments();
  const setStatus = useOwnerSetOperatorStatus();

  const [paymentForm, setPaymentForm] = useState({ phone: '', bankAccountNumber: '' });
  const [operatorForm, setOperatorForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    assignedParkingIds: [],
  });
  const [operatorAssignmentsDraft, setOperatorAssignmentsDraft] = useState({});

  useEffect(() => {
    if (!analytics?.ownerAccount) return;
    setPaymentForm({
      phone: analytics.ownerAccount.phone || '',
      bankAccountNumber: analytics.ownerAccount.bankAccountNumber || '',
    });
  }, [analytics?.ownerAccount]);

  useEffect(() => {
    const operators = analytics?.operators || [];
    setOperatorAssignmentsDraft((prev) => {
      const next = { ...prev };
      operators.forEach((operator) => {
        if (!next[operator.id]) {
          next[operator.id] = Array.isArray(operator.assignedParkingIds) ? operator.assignedParkingIds : [];
        }
      });
      Object.keys(next).forEach((operatorId) => {
        if (!operators.some((operator) => operator.id === operatorId)) {
          delete next[operatorId];
        }
      });
      return next;
    });
  }, [analytics?.operators]);

  if (initializing) return null;

  const summary = analytics?.summary || {};
  const revenueSeries = analytics?.revenueSeries || [];
  const paymentMethodBreakdown = analytics?.paymentMethodBreakdown || [];
  const parkings = analytics?.parkings || [];
  const operators = analytics?.operators || [];

  const chartWidth = Math.max(Dimensions.get('window').width - 48, 260);

  const revenueData = useMemo(
    () => ({
      labels: revenueSeries.slice(-7).map((item) => item.label),
      datasets: [{ data: revenueSeries.slice(-7).map((item) => Number(item.grossAmount || 0)) }],
    }),
    [revenueSeries]
  );

  const pieData = useMemo(
    () =>
      paymentMethodBreakdown.map((item, index) => ({
        name: item.method,
        amount: Number(item.amount || 0),
        color: index % 2 === 0 ? '#2563eb' : '#16a34a',
        legendFontColor: colors.text,
        legendFontSize: 12,
      })),
    [paymentMethodBreakdown]
  );

  const toggleNewOperatorParking = (parkingId) => {
    setOperatorForm((prev) => {
      const selected = prev.assignedParkingIds.includes(parkingId);
      return {
        ...prev,
        assignedParkingIds: selected
          ? prev.assignedParkingIds.filter((id) => id !== parkingId)
          : [...prev.assignedParkingIds, parkingId],
      };
    });
  };

  const toggleOperatorDraftParking = (operatorUid, parkingId) => {
    setOperatorAssignmentsDraft((prev) => {
      const current = prev[operatorUid] || [];
      const selected = current.includes(parkingId);
      return {
        ...prev,
        [operatorUid]: selected ? current.filter((id) => id !== parkingId) : [...current, parkingId],
      };
    });
  };

  const savePaymentDetails = async () => {
    if (!paymentForm.phone && !paymentForm.bankAccountNumber) {
      Alert.alert('Missing details', 'Provide phone or bank account number.');
      return;
    }

    try {
      await updatePayment.mutateAsync(paymentForm);
      Alert.alert('Updated', 'Payment destination details saved.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update payment details');
    }
  };

  const submitOperator = async () => {
    if (!operatorForm.fullName || !operatorForm.email || !operatorForm.password || !operatorForm.assignedParkingIds.length) {
      Alert.alert('Missing data', 'Fill name/email/password and assign at least one parking.');
      return;
    }

    try {
      await createOperator.mutateAsync(operatorForm);
      Alert.alert('Created', 'Operator account created.');
      setOperatorForm({ fullName: '', email: '', password: '', phone: '', assignedParkingIds: [] });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create operator');
    }
  };

  const saveOperatorAssignments = async (operatorUid) => {
    const assignedParkingIds = operatorAssignmentsDraft[operatorUid] || [];
    if (!assignedParkingIds.length) {
      Alert.alert('Missing data', 'Assign at least one parking.');
      return;
    }

    try {
      await updateAssignments.mutateAsync({ operatorUid, assignedParkingIds });
      Alert.alert('Updated', 'Assignments updated.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update assignments');
    }
  };

  const toggleStatus = async (operator) => {
    const targetStatus = operator.status === 'active' ? 'inactive' : 'active';
    try {
      await setStatus.mutateAsync({ operatorUid: operator.id, status: targetStatus });
      Alert.alert('Updated', `Operator set to ${targetStatus}.`);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update operator status');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Business Control</Text>
        <Text style={styles.title}>Owner Dashboard</Text>
      </View>

      <Card title="Analytics Range">
        <View style={styles.row}>
          <Button title="Last 7 Days" variant={rangePreset === '7d' ? 'primary' : 'secondary'} onPress={() => setRangePreset('7d')} />
          <Button title="Last 30 Days" variant={rangePreset === '30d' ? 'primary' : 'secondary'} onPress={() => setRangePreset('30d')} />
        </View>
        {analyticsQuery.isLoading ? <Text style={styles.smallText}>Loading analytics...</Text> : null}
      </Card>

      <Card title="Summary">
        <Text style={styles.body}>Owner Revenue: {Number(summary.totalOwnerRevenue || 0).toFixed(2)} ETB</Text>
        <Text style={styles.smallText}>Gross Revenue: {Number(summary.totalGrossRevenue || 0).toFixed(2)} ETB</Text>
        <Text style={styles.smallText}>Admin 10%: {Number(summary.totalAdminCommission || 0).toFixed(2)} ETB</Text>
        <Text style={styles.smallText}>Completed Sessions: {summary.totalCompletedSessions || 0}</Text>
        <Text style={styles.smallText}>Pending Payments: {summary.pendingPaymentRequests || 0}</Text>
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

      {pieData.length ? (
        <Card title="Payment Method Breakdown">
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

      <Card title="Payment Destination Details">
        <Input placeholder="Phone" value={paymentForm.phone} onChangeText={(phone) => setPaymentForm((prev) => ({ ...prev, phone }))} />
        <Input
          placeholder="Bank Account Number"
          value={paymentForm.bankAccountNumber}
          onChangeText={(bankAccountNumber) => setPaymentForm((prev) => ({ ...prev, bankAccountNumber }))}
        />
        <Button title="Save Payment Details" loading={updatePayment.isPending} onPress={savePaymentDetails} />
      </Card>

      <Card title="Create Operator">
        <Input placeholder="Full Name" value={operatorForm.fullName} onChangeText={(fullName) => setOperatorForm((prev) => ({ ...prev, fullName }))} />
        <Input placeholder="Email" value={operatorForm.email} onChangeText={(email) => setOperatorForm((prev) => ({ ...prev, email }))} autoCapitalize="none" />
        <Input placeholder="Temporary Password" value={operatorForm.password} onChangeText={(password) => setOperatorForm((prev) => ({ ...prev, password }))} secureTextEntry />
        <Input placeholder="Phone (optional)" value={operatorForm.phone} onChangeText={(phone) => setOperatorForm((prev) => ({ ...prev, phone }))} />

        <Text style={styles.smallTitle}>Assigned Parkings</Text>
        <View style={styles.tagWrap}>
          {parkings.map((parking) => {
            const selected = operatorForm.assignedParkingIds.includes(parking.id);
            return (
              <TouchableOpacity
                key={parking.id}
                style={[styles.tag, selected && styles.tagActive]}
                onPress={() => toggleNewOperatorParking(parking.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagText, selected && styles.tagTextActive]}>{parking.name || parking.id}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button title="Create Operator" loading={createOperator.isPending} onPress={submitOperator} />
      </Card>

      <Card title="Owned Parkings">
        {!parkings.length ? (
          <Text style={styles.smallText}>No parkings linked yet.</Text>
        ) : (
          parkings.map((parking) => (
            <View key={parking.id} style={styles.listItem}>
              <Text style={styles.body}>{parking.name || parking.id}</Text>
              <Text style={styles.smallText}>{parking.address || 'No address'}</Text>
              <Text style={styles.smallText}>Status: {parking.status}</Text>
              <Text style={styles.smallText}>
                Slots A/R/O: {parking.availableSlots || 0}/{parking.reservedSlots || 0}/{parking.occupiedSlots || 0}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card title="Owned Operators">
        {!operators.length ? (
          <Text style={styles.smallText}>No operators linked yet.</Text>
        ) : (
          operators.map((operator) => (
            <View key={operator.id} style={styles.listItem}>
              <Text style={styles.body}>{operator.fullName || operator.email}</Text>
              <Text style={styles.smallText}>{operator.email}</Text>
              <Text style={styles.smallText}>Status: {operator.status || 'unknown'}</Text>

              <View style={styles.tagWrap}>
                {parkings.map((parking) => {
                  const selected = (operatorAssignmentsDraft[operator.id] || []).includes(parking.id);
                  return (
                    <TouchableOpacity
                      key={`${operator.id}:${parking.id}`}
                      style={[styles.tag, selected && styles.tagActive]}
                      onPress={() => toggleOperatorDraftParking(operator.id, parking.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagText, selected && styles.tagTextActive]}>{parking.name || parking.id}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.row}>
                <Button
                  title="Save Assignments"
                  variant="secondary"
                  loading={updateAssignments.isPending}
                  onPress={() => saveOperatorAssignments(operator.id)}
                />
                <Button title={operator.status === 'active' ? 'Deactivate' : 'Activate'} loading={setStatus.isPending} onPress={() => toggleStatus(operator)} />
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
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <MaterialIcons name="analytics" size={16} color={colors.primaryDark} />
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
  smallTitle: { ...typography.caption, color: colors.text, fontWeight: '600', marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  chart: { marginVertical: spacing.sm, borderRadius: 8 },
  listItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tagActive: { backgroundColor: '#dbeafe', borderColor: colors.primary },
  tagText: { ...typography.small, color: colors.text },
  tagTextActive: { color: colors.primary, fontWeight: '600' },
});

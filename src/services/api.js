import { callFunction } from '../utils/functions';

export async function getAdminAnalytics(rangePreset = '30d') {
  return callFunction('getAdminAnalytics', { rangePreset });
}

export async function getOwnerAnalytics(rangePreset = '30d') {
  return callFunction('getOwnerAnalytics', { rangePreset });
}

export async function createOwnerAccount(payload) {
  return callFunction('createOwnerAccount', payload);
}

export async function upsertParking(payload) {
  return callFunction('upsertParking', payload);
}

export async function assignOperatorToParking(payload) {
  return callFunction('assignOperatorToParking', payload);
}

export async function ownerCreateOperator(payload) {
  return callFunction('ownerCreateOperator', payload);
}

export async function ownerUpdateOperatorAssignments(payload) {
  return callFunction('ownerUpdateOperatorAssignments', payload);
}

export async function ownerSetOperatorStatus(payload) {
  return callFunction('ownerSetOperatorStatus', payload);
}

export async function ownerUpdatePaymentDetails(payload) {
  return callFunction('ownerUpdatePaymentDetails', payload);
}

export async function getParkingPaymentDetails(parkingId) {
  return callFunction('getParkingPaymentDetails', { parkingId });
}

export async function listPendingPaymentsForDriver() {
  return callFunction('listPendingPaymentsForDriver', {});
}

export async function listPendingPaymentsForOperator(parkingId) {
  return callFunction('listPendingPaymentsForOperator', { parkingId });
}

/**
 * Firebase callable functions utility with consistent error handling.
 */

import { functionsClient, functionsProdClient, isUsingFunctionsEmulator } from '../config/firebase';
import { handleNetworkError } from './errorHandlers';

function normalizeCode(code) {
  if (!code) return '';
  return String(code).replace(/^functions\//, '');
}

export const callFunction = async (functionName, data = {}) => {
  const invoke = async (client) => {
    const callable = client.httpsCallable(functionName);
    const result = await callable(data);
    return result.data;
  };

  try {
    return await invoke(functionsClient);
  } catch (error) {
    const code = normalizeCode(error?.code);
    const message = String(error?.message || '').toLowerCase();
    const shouldTryProdFallback =
      isUsingFunctionsEmulator &&
      (code === 'deadline-exceeded' ||
        code === 'unavailable' ||
        code === 'internal' ||
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('failed to fetch'));

    if (shouldTryProdFallback) {
      try {
        return await invoke(functionsProdClient);
      } catch (_) {
        // fall through to original error mapping from emulator failure
      }
    }

    switch (code) {
      case 'unauthenticated':
        throw new Error('Authentication required. Please sign in again.');
      case 'permission-denied':
        throw new Error('You do not have permission to perform this action.');
      case 'not-found':
        throw new Error('The requested resource was not found.');
      case 'already-exists':
        throw new Error(error?.message || 'The resource already exists.');
      case 'resource-exhausted':
        throw new Error('Resource limit exceeded. Please try again later.');
      case 'failed-precondition':
      case 'invalid-argument':
      case 'unavailable':
        throw new Error(error?.message || 'Operation failed. Please try again.');
      case 'deadline-exceeded':
        throw new Error('Request timed out. Emulator or backend may be unreachable. Check network/emulator host and try again.');
      case 'internal':
        throw new Error(error?.message || 'Internal server error from backend.');
      default:
        throw new Error(handleNetworkError(error));
    }
  }
};

export const driverFunctions = {
  createBooking: async (parkingId, plateNumber) => callFunction('createBooking', { parkingId, plateNumber }),
  submitManualPayment: async (parkingId, plateNumber, method, referenceCode) =>
    callFunction('submitManualPayment', { parkingId, plateNumber, method, referenceCode }),
  checkOutVehicle: async (parkingId, plateNumber, method, referenceCode) =>
    callFunction('driverCheckOutVehicle', { parkingId, plateNumber, method, referenceCode }),
  listPendingPayments: async () => callFunction('listPendingPaymentsForDriver', {}),
  confirmCheckInFromQr: async (token, plateNumber) => callFunction('confirmCheckInFromQr', { token, plateNumber }),
};

export const operatorFunctions = {
  checkInVehicle: async (parkingId, plateNumber, allowWalkIn = false) =>
    callFunction('checkInVehicle', { parkingId, plateNumber, allowWalkIn }),
  listPendingPayments: async (parkingId) => callFunction('listPendingPaymentsForOperator', { parkingId }),
  getPendingPaymentForSession: async (sessionId) => callFunction('getPendingPaymentForSession', { sessionId }),
  confirmManualPayment: async (requestId) => callFunction('confirmManualPayment', { requestId }),
  rejectManualPayment: async (requestId, reason = 'Payment not verified') =>
    callFunction('rejectManualPayment', { requestId, reason }),
  createParkingCheckInToken: async (parkingId) => callFunction('createParkingCheckInToken', { parkingId }),
  approveCheckInRequest: async (requestId) => callFunction('approveCheckInRequest', { requestId }),
  rejectCheckInRequest: async (requestId, reason = 'Request denied') =>
    callFunction('rejectCheckInRequest', { requestId, reason }),
};

export const ownerFunctions = {
  getAnalytics: async (options = { rangePreset: '30d' }) => callFunction('getOwnerAnalytics', options),
  createOperator: async ({ fullName, email, password, phone = '', assignedParkingIds = [] }) =>
    callFunction('ownerCreateOperator', { fullName, email, password, phone, assignedParkingIds }),
  updateOperatorAssignments: async (operatorUid, assignedParkingIds) =>
    callFunction('ownerUpdateOperatorAssignments', { operatorUid, assignedParkingIds }),
  setOperatorStatus: async (operatorUid, status) => callFunction('ownerSetOperatorStatus', { operatorUid, status }),
  updatePaymentDetails: async (phone, bankAccountNumber) =>
    callFunction('ownerUpdatePaymentDetails', { phone, bankAccountNumber }),
};

export const adminFunctions = {
  getAnalytics: async (options = { rangePreset: '30d' }) => callFunction('getAdminAnalytics', options),
  createOwnerAccount: async ({ fullName, email, password, phone = '', bankAccountNumber = '' }) =>
    callFunction('createOwnerAccount', { fullName, email, password, phone, bankAccountNumber }),
  upsertParking: async (parkingData, parkingId = null) =>
    callFunction('upsertParking', { ...parkingData, parkingId }),
  assignOperatorToParking: async (operatorUid, parkingId, assign = true) =>
    callFunction('assignOperatorToParking', { operatorUid, parkingId, assign }),
};

export const utilityFunctions = {
  getParkingPaymentDetails: async (parkingId) => callFunction('getParkingPaymentDetails', { parkingId }),
};

export const testEmulatorConnection = async () => {
  try {
    await callFunction('getAdminAnalytics', { rangePreset: '7d' });
    return true;
  } catch (_) {
    return false;
  }
};

export default {
  callFunction,
  driverFunctions,
  operatorFunctions,
  ownerFunctions,
  adminFunctions,
  utilityFunctions,
  testEmulatorConnection,
};

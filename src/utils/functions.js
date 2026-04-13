/**
 * Firebase Functions utility for calling cloud functions
 * Provides a centralized interface for all function calls with error handling
 */

import { functionsClient } from '../config/firebase';
import { handleNetworkError } from './errorHandlers';

/**
 * Generic function caller with error handling
 * @param {string} functionName - Name of the cloud function to call
 * @param {Object} data - Data to pass to the function
 * @returns {Promise<any>} Function result
 * @throws {Error} Formatted error message
 */
export const callFunction = async (functionName, data = {}) => {
  try {
    console.log(`🔧 Calling function: ${functionName}`, data);
    
    const callable = functionsClient.httpsCallable(functionName);
    const result = await callable(data);
    
    console.log(`✅ Function ${functionName} completed successfully`);
    return result.data;
  } catch (error) {
    console.error(`❌ Function ${functionName} failed:`, error);
    
    // Handle Firebase Functions specific errors
    if (error.code) {
      switch (error.code) {
        case 'unauthenticated':
          throw new Error('Authentication required. Please sign in again.');
        case 'permission-denied':
          throw new Error('You do not have permission to perform this action.');
        case 'not-found':
          throw new Error('The requested resource was not found.');
        case 'already-exists':
          throw new Error('The resource already exists.');
        case 'resource-exhausted':
          throw new Error('Resource limit exceeded. Please try again later.');
        case 'failed-precondition':
          throw new Error(error.message || 'Operation cannot be completed at this time.');
        case 'invalid-argument':
          throw new Error(error.message || 'Invalid input provided.');
        case 'unavailable':
          throw new Error('Service temporarily unavailable. Please try again.');
        case 'deadline-exceeded':
          throw new Error('Request timed out. Please try again.');
        default:
          throw new Error(error.message || 'An error occurred while processing your request.');
      }
    }
    
    // Handle network and other errors
    throw new Error(handleNetworkError(error));
  }
};

/**
 * Driver-specific function calls
 */
export const driverFunctions = {
  /**
   * Create a parking booking
   * @param {string} parkingId - ID of the parking to book
   * @param {string} plateNumber - Vehicle plate number
   * @returns {Promise<Object>} Booking details
   */
  createBooking: async (parkingId, plateNumber) => {
    return callFunction('createBooking', { parkingId, plateNumber });
  },

  /**
   * Submit manual payment for parking session
   * @param {string} parkingId - ID of the parking
   * @param {string} plateNumber - Vehicle plate number
   * @param {string} method - Payment method ('bank' or 'phone')
   * @param {string} referenceCode - Payment reference code
   * @returns {Promise<Object>} Payment request details
   */
  submitManualPayment: async (parkingId, plateNumber, method, referenceCode) => {
    return callFunction('submitManualPayment', {
      parkingId,
      plateNumber,
      method,
      referenceCode,
    });
  },

  /**
   * Driver checkout with payment submission
   * @param {string} parkingId - ID of the parking
   * @param {string} plateNumber - Vehicle plate number
   * @param {string} method - Payment method ('bank' or 'phone')
   * @param {string} referenceCode - Payment reference code
   * @returns {Promise<Object>} Checkout and payment details
   */
  checkOutVehicle: async (parkingId, plateNumber, method, referenceCode) => {
    return callFunction('driverCheckOutVehicle', {
      parkingId,
      plateNumber,
      method,
      referenceCode,
    });
  },

  /**
   * List pending payment requests for driver
   * @returns {Promise<Object>} List of pending payments
   */
  listPendingPayments: async () => {
    return callFunction('listPendingPaymentsForDriver');
  },

  /**
   * Confirm check-in from QR code
   * @param {string} token - QR token from operator
   * @param {string} plateNumber - Vehicle plate number
   * @returns {Promise<Object>} Check-in confirmation details
   */
  confirmCheckInFromQr: async (token, plateNumber) => {
    return callFunction('confirmCheckInFromQr', { token, plateNumber });
  },
};

/**
 * Operator-specific function calls
 */
export const operatorFunctions = {
  /**
   * Check in a vehicle
   * @param {string} parkingId - ID of the parking
   * @param {string} plateNumber - Vehicle plate number
   * @param {boolean} allowWalkIn - Allow walk-in without reservation
   * @returns {Promise<Object>} Check-in session details
   */
  checkInVehicle: async (parkingId, plateNumber, allowWalkIn = false) => {
    return callFunction('checkInVehicle', { parkingId, plateNumber, allowWalkIn });
  },

  /**
   * List pending payment requests for operator's parking
   * @param {string} parkingId - ID of the parking
   * @returns {Promise<Object>} List of pending payments
   */
  listPendingPayments: async (parkingId) => {
    return callFunction('listPendingPaymentsForOperator', { parkingId });
  },

  /**
   * Get pending payment for specific session
   * @param {string} sessionId - ID of the session
   * @returns {Promise<Object>} Pending payment details
   */
  getPendingPaymentForSession: async (sessionId) => {
    return callFunction('getPendingPaymentForSession', { sessionId });
  },

  /**
   * Confirm manual payment
   * @param {string} requestId - ID of the payment request
   * @returns {Promise<Object>} Confirmation details
   */
  confirmManualPayment: async (requestId) => {
    return callFunction('confirmManualPayment', { requestId });
  },

  /**
   * Reject manual payment
   * @param {string} requestId - ID of the payment request
   * @param {string} reason - Reason for rejection
   * @returns {Promise<Object>} Rejection details
   */
  rejectManualPayment: async (requestId, reason = 'Payment not verified') => {
    return callFunction('rejectManualPayment', { requestId, reason });
  },

  /**
   * Create parking check-in token (QR code)
   * @param {string} parkingId - ID of the parking
   * @returns {Promise<Object>} Token details with QR URL
   */
  createParkingCheckInToken: async (parkingId) => {
    return callFunction('createParkingCheckInToken', { parkingId });
  },

  /**
   * Approve check-in request
   * @param {string} requestId - ID of the check-in request
   * @returns {Promise<Object>} Approval details
   */
  approveCheckInRequest: async (requestId) => {
    return callFunction('approveCheckInRequest', { requestId });
  },

  /**
   * Reject check-in request
   * @param {string} requestId - ID of the check-in request
   * @param {string} reason - Reason for rejection
   * @returns {Promise<Object>} Rejection details
   */
  rejectCheckInRequest: async (requestId, reason = 'Request denied') => {
    return callFunction('rejectCheckInRequest', { requestId, reason });
  },
};

/**
 * Owner-specific function calls
 */
export const ownerFunctions = {
  /**
   * Get owner analytics
   * @param {Object} options - Analytics options
   * @param {string} options.rangePreset - '7d', '30d', or 'custom'
   * @param {number} options.fromMs - Start timestamp for custom range
   * @param {number} options.toMs - End timestamp for custom range
   * @returns {Promise<Object>} Analytics data
   */
  getAnalytics: async (options = { rangePreset: '30d' }) => {
    return callFunction('getOwnerAnalytics', options);
  },

  /**
   * Create operator account
   * @param {string} email - Operator email
   * @param {string} password - Operator password
   * @param {Array<string>} assignedParkingIds - List of parking IDs to assign
   * @returns {Promise<Object>} Created operator details
   */
  createOperator: async (email, password, assignedParkingIds = []) => {
    return callFunction('ownerCreateOperator', { email, password, assignedParkingIds });
  },

  /**
   * Update operator parking assignments
   * @param {string} operatorId - ID of the operator
   * @param {Array<string>} assignedParkingIds - List of parking IDs to assign
   * @returns {Promise<Object>} Update confirmation
   */
  updateOperatorAssignments: async (operatorId, assignedParkingIds) => {
    return callFunction('ownerUpdateOperatorAssignments', { operatorId, assignedParkingIds });
  },

  /**
   * Set operator status
   * @param {string} operatorId - ID of the operator
   * @param {string} status - 'active' or 'inactive'
   * @returns {Promise<Object>} Status update confirmation
   */
  setOperatorStatus: async (operatorId, status) => {
    return callFunction('ownerSetOperatorStatus', { operatorId, status });
  },

  /**
   * Update payment details
   * @param {string} method - Payment method ('bank' or 'phone')
   * @param {string} accountNumber - Account number or phone number
   * @param {string} accountName - Account holder name
   * @returns {Promise<Object>} Update confirmation
   */
  updatePaymentDetails: async (method, accountNumber, accountName) => {
    return callFunction('ownerUpdatePaymentDetails', { method, accountNumber, accountName });
  },
};

/**
 * Admin-specific function calls
 */
export const adminFunctions = {
  /**
   * Get admin analytics
   * @param {Object} options - Analytics options
   * @param {string} options.rangePreset - '7d', '30d', or 'custom'
   * @param {number} options.fromMs - Start timestamp for custom range
   * @param {number} options.toMs - End timestamp for custom range
   * @returns {Promise<Object>} Analytics data
   */
  getAnalytics: async (options = { rangePreset: '30d' }) => {
    return callFunction('getAdminAnalytics', options);
  },

  /**
   * Create owner account
   * @param {string} email - Owner email
   * @param {string} password - Owner password
   * @param {string} businessName - Business name
   * @param {string} contactPhone - Contact phone number
   * @param {string} paymentMethod - Payment method ('bank' or 'phone')
   * @param {string} accountNumber - Account number or phone number
   * @param {string} accountName - Account holder name
   * @returns {Promise<Object>} Created owner details
   */
  createOwnerAccount: async (email, password, businessName, contactPhone, paymentMethod, accountNumber, accountName) => {
    return callFunction('createOwnerAccount', {
      email,
      password,
      businessName,
      contactPhone,
      paymentMethod,
      accountNumber,
      accountName,
    });
  },

  /**
   * Create owner profile
   * @param {string} ownerId - Owner user ID
   * @param {string} businessName - Business name
   * @param {string} contactPhone - Contact phone number
   * @param {string} paymentMethod - Payment method ('bank' or 'phone')
   * @param {string} accountNumber - Account number or phone number
   * @param {string} accountName - Account holder name
   * @returns {Promise<Object>} Created profile details
   */
  createOwnerProfile: async (ownerId, businessName, contactPhone, paymentMethod, accountNumber, accountName) => {
    return callFunction('createOwnerProfile', {
      ownerId,
      businessName,
      contactPhone,
      paymentMethod,
      accountNumber,
      accountName,
    });
  },

  /**
   * Create or update parking
   * @param {Object} parkingData - Parking data
   * @param {string} parkingData.name - Parking name
   * @param {string} parkingData.location - Parking location
   * @param {number} parkingData.slotCapacity - Total parking slots
   * @param {string} parkingData.ownerId - Owner ID
   * @param {string} parkingData.status - 'active' or 'inactive'
   * @param {string} parkingId - Optional parking ID for updates
   * @returns {Promise<Object>} Parking details
   */
  upsertParking: async (parkingData, parkingId = null) => {
    return callFunction('upsertParking', { ...parkingData, parkingId });
  },

  /**
   * Assign operator to parking
   * @param {string} operatorId - Operator user ID
   * @param {Array<string>} assignedParkingIds - List of parking IDs to assign
   * @returns {Promise<Object>} Assignment confirmation
   */
  assignOperatorToParking: async (operatorId, assignedParkingIds) => {
    return callFunction('assignOperatorToParking', { operatorId, assignedParkingIds });
  },
};

/**
 * General utility functions
 */
export const utilityFunctions = {
  /**
   * Get parking payment details
   * @param {string} parkingId - ID of the parking
   * @returns {Promise<Object>} Payment details
   */
  getParkingPaymentDetails: async (parkingId) => {
    return callFunction('getParkingPaymentDetails', { parkingId });
  },
};

/**
 * Test function to verify emulator connection
 * @returns {Promise<boolean>} True if connection successful
 */
export const testEmulatorConnection = async () => {
  try {
    // Try to call a simple function to test connection
    // This will fail gracefully if emulator is not running
    await callFunction('getAdminAnalytics', { rangePreset: '7d' });
    console.log('✅ Firebase Functions emulator connection successful');
    return true;
  } catch (error) {
    console.warn('⚠️ Firebase Functions emulator connection failed:', error.message);
    return false;
  }
};

// Export all function groups
export default {
  callFunction,
  driverFunctions,
  operatorFunctions,
  ownerFunctions,
  adminFunctions,
  utilityFunctions,
  testEmulatorConnection,
};
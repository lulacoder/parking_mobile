/**
 * Tests for Firebase Functions utility
 */

import { callFunction, driverFunctions, operatorFunctions, testEmulatorConnection } from './functions';

// Mock Firebase Functions
jest.mock('../config/firebase', () => ({
  functionsClient: {
    httpsCallable: jest.fn(),
  },
}));

describe('Firebase Functions Utility', () => {
  let mockCallable;
  
  beforeEach(() => {
    const { functionsClient } = require('../config/firebase');
    mockCallable = jest.fn();
    functionsClient.httpsCallable.mockReturnValue(mockCallable);
    
    // Clear console logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('callFunction', () => {
    it('should call function successfully and return data', async () => {
      const mockResult = { data: { success: true, bookingId: 'test-booking' } };
      mockCallable.mockResolvedValue(mockResult);

      const result = await callFunction('createBooking', { parkingId: 'test-parking' });

      expect(result).toEqual(mockResult.data);
      expect(mockCallable).toHaveBeenCalledWith({ parkingId: 'test-parking' });
    });

    it('should handle Firebase Functions errors correctly', async () => {
      const mockError = {
        code: 'permission-denied',
        message: 'Access denied',
      };
      mockCallable.mockRejectedValue(mockError);

      await expect(callFunction('createBooking', {})).rejects.toThrow(
        'You do not have permission to perform this action.'
      );
    });

    it('should handle unauthenticated error', async () => {
      const mockError = { code: 'unauthenticated' };
      mockCallable.mockRejectedValue(mockError);

      await expect(callFunction('createBooking', {})).rejects.toThrow(
        'Authentication required. Please sign in again.'
      );
    });

    it('should handle not-found error', async () => {
      const mockError = { code: 'not-found' };
      mockCallable.mockRejectedValue(mockError);

      await expect(callFunction('createBooking', {})).rejects.toThrow(
        'The requested resource was not found.'
      );
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network request failed');
      mockCallable.mockRejectedValue(mockError);

      await expect(callFunction('createBooking', {})).rejects.toThrow();
    });

    it('should handle custom error messages', async () => {
      const mockError = {
        code: 'failed-precondition',
        message: 'Custom error message',
      };
      mockCallable.mockRejectedValue(mockError);

      await expect(callFunction('createBooking', {})).rejects.toThrow('Custom error message');
    });
  });

  describe('driverFunctions', () => {
    it('should call createBooking with correct parameters', async () => {
      const mockResult = { data: { bookingId: 'test-booking', status: 'reserved' } };
      mockCallable.mockResolvedValue(mockResult);

      const result = await driverFunctions.createBooking('parking-123', 'ABC-123');

      expect(result).toEqual(mockResult.data);
      expect(mockCallable).toHaveBeenCalledWith({
        parkingId: 'parking-123',
        plateNumber: 'ABC-123',
      });
    });

    it('should call submitManualPayment with correct parameters', async () => {
      const mockResult = { data: { requestId: 'payment-123', status: 'pending' } };
      mockCallable.mockResolvedValue(mockResult);

      const result = await driverFunctions.submitManualPayment(
        'parking-123',
        'ABC-123',
        'bank',
        'REF-123'
      );

      expect(result).toEqual(mockResult.data);
      expect(mockCallable).toHaveBeenCalledWith({
        parkingId: 'parking-123',
        plateNumber: 'ABC-123',
        method: 'bank',
        referenceCode: 'REF-123',
      });
    });

    it('should call listPendingPayments without parameters', async () => {
      const mockResult = { data: { pendingPayments: [] } };
      mockCallable.mockResolvedValue(mockResult);

      const result = await driverFunctions.listPendingPayments();

      expect(result).toEqual(mockResult.data);
      expect(mockCallable).toHaveBeenCalledWith({});
    });
  });

  describe('operatorFunctions', () => {
    it('should call checkInVehicle with correct parameters', async () => {
      const mockResult = { data: { sessionId: 'session-123', status: 'active' } };
      mockCallable.mockResolvedValue(mockResult);

      const result = await operatorFunctions.checkInVehicle('parking-123', 'ABC-123', true);

      expect(result).toEqual(mockResult.data);
      expect(mockCallable).toHaveBeenCalledWith({
        parkingId: 'parking-123',
        plateNumber: 'ABC-123',
        allowWalkIn: true,
      });
    });

    it('should call confirmManualPayment with correct parameters', async () => {
      const mockResult = { data: { status: 'confirmed', paymentId: 'payment-123' } };
      mockCallable.mockResolvedValue(mockResult);

      const result = await operatorFunctions.confirmManualPayment('request-123');

      expect(result).toEqual(mockResult.data);
      expect(mockCallable).toHaveBeenCalledWith({
        requestId: 'request-123',
      });
    });

    it('should call rejectManualPayment with default reason', async () => {
      const mockResult = { data: { status: 'rejected' } };
      mockCallable.mockResolvedValue(mockResult);

      const result = await operatorFunctions.rejectManualPayment('request-123');

      expect(result).toEqual(mockResult.data);
      expect(mockCallable).toHaveBeenCalledWith({
        requestId: 'request-123',
        reason: 'Payment not verified',
      });
    });

    it('should call rejectManualPayment with custom reason', async () => {
      const mockResult = { data: { status: 'rejected' } };
      mockCallable.mockResolvedValue(mockResult);

      const result = await operatorFunctions.rejectManualPayment('request-123', 'Invalid reference');

      expect(result).toEqual(mockResult.data);
      expect(mockCallable).toHaveBeenCalledWith({
        requestId: 'request-123',
        reason: 'Invalid reference',
      });
    });
  });

  describe('testEmulatorConnection', () => {
    it('should return true when connection is successful', async () => {
      const mockResult = { data: { success: true } };
      mockCallable.mockResolvedValue(mockResult);

      const result = await testEmulatorConnection();

      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      const mockError = new Error('Connection failed');
      mockCallable.mockRejectedValue(mockError);

      const result = await testEmulatorConnection();

      expect(result).toBe(false);
    });
  });
});
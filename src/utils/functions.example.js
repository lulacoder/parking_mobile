/**
 * Example usage of Firebase Functions utility
 * This file demonstrates how to use the functions utility in your components
 */

import { driverFunctions, operatorFunctions, ownerFunctions, adminFunctions, testEmulatorConnection } from './functions';

/**
 * Example: Driver creating a booking
 */
export const exampleDriverBooking = async () => {
  try {
    const result = await driverFunctions.createBooking('parking-123', 'ABC-1234');
    console.log('Booking created:', result);
    // Expected result: { bookingId: 'booking-456', status: 'reserved', expiresAt: timestamp }
    return result;
  } catch (error) {
    console.error('Booking failed:', error.message);
    throw error;
  }
};

/**
 * Example: Driver submitting payment
 */
export const exampleDriverPayment = async () => {
  try {
    const result = await driverFunctions.submitManualPayment(
      'parking-123',
      'ABC-1234',
      'bank',
      'TXN-789123'
    );
    console.log('Payment submitted:', result);
    // Expected result: { requestId: 'req-789', sessionId: 'session-456', status: 'pending', amountDue: 50 }
    return result;
  } catch (error) {
    console.error('Payment submission failed:', error.message);
    throw error;
  }
};

/**
 * Example: Driver checking out with payment
 */
export const exampleDriverCheckout = async () => {
  try {
    const result = await driverFunctions.checkOutVehicle(
      'parking-123',
      'ABC-1234',
      'phone',
      '+254712345678'
    );
    console.log('Checkout completed:', result);
    return result;
  } catch (error) {
    console.error('Checkout failed:', error.message);
    throw error;
  }
};

/**
 * Example: Operator checking in a vehicle
 */
export const exampleOperatorCheckIn = async () => {
  try {
    const result = await operatorFunctions.checkInVehicle('parking-123', 'XYZ-5678', true);
    console.log('Vehicle checked in:', result);
    // Expected result: { sessionId: 'session-789', status: 'active' }
    return result;
  } catch (error) {
    console.error('Check-in failed:', error.message);
    throw error;
  }
};

/**
 * Example: Operator listing pending payments
 */
export const exampleOperatorPendingPayments = async () => {
  try {
    const result = await operatorFunctions.listPendingPayments('parking-123');
    console.log('Pending payments:', result);
    // Expected result: { parkingId: 'parking-123', pendingPayments: [...] }
    return result;
  } catch (error) {
    console.error('Failed to fetch pending payments:', error.message);
    throw error;
  }
};

/**
 * Example: Operator confirming payment
 */
export const exampleOperatorConfirmPayment = async () => {
  try {
    const result = await operatorFunctions.confirmManualPayment('request-456');
    console.log('Payment confirmed:', result);
    // Expected result: { requestId: 'request-456', status: 'confirmed', paymentId: 'payment-789' }
    return result;
  } catch (error) {
    console.error('Payment confirmation failed:', error.message);
    throw error;
  }
};

/**
 * Example: Owner getting analytics
 */
export const exampleOwnerAnalytics = async () => {
  try {
    const result = await ownerFunctions.getAnalytics({ rangePreset: '30d' });
    console.log('Owner analytics:', result);
    return result;
  } catch (error) {
    console.error('Failed to fetch analytics:', error.message);
    throw error;
  }
};

/**
 * Example: Owner creating an operator
 */
export const exampleOwnerCreateOperator = async () => {
  try {
    const result = await ownerFunctions.createOperator(
      'operator@example.com',
      'securePassword123',
      ['parking-123', 'parking-456']
    );
    console.log('Operator created:', result);
    return result;
  } catch (error) {
    console.error('Operator creation failed:', error.message);
    throw error;
  }
};

/**
 * Example: Admin getting system analytics
 */
export const exampleAdminAnalytics = async () => {
  try {
    const result = await adminFunctions.getAnalytics({ rangePreset: '7d' });
    console.log('Admin analytics:', result);
    return result;
  } catch (error) {
    console.error('Failed to fetch admin analytics:', error.message);
    throw error;
  }
};

/**
 * Example: Admin creating owner account
 */
export const exampleAdminCreateOwner = async () => {
  try {
    const result = await adminFunctions.createOwnerAccount(
      'owner@example.com',
      'securePassword123',
      'ABC Parking Ltd',
      '+254712345678',
      'bank',
      '1234567890',
      'ABC Parking Ltd'
    );
    console.log('Owner account created:', result);
    return result;
  } catch (error) {
    console.error('Owner account creation failed:', error.message);
    throw error;
  }
};

/**
 * Example: Testing emulator connection
 */
export const exampleTestConnection = async () => {
  try {
    const isConnected = await testEmulatorConnection();
    if (isConnected) {
      console.log('✅ Firebase Functions emulator is connected and working');
    } else {
      console.log('❌ Firebase Functions emulator is not available');
    }
    return isConnected;
  } catch (error) {
    console.error('Connection test failed:', error.message);
    return false;
  }
};

/**
 * Example: Error handling patterns
 */
export const exampleErrorHandling = async () => {
  try {
    // This will likely fail with authentication error if not signed in
    await driverFunctions.createBooking('parking-123', 'ABC-1234');
  } catch (error) {
    // Handle specific error types
    if (error.message.includes('Authentication required')) {
      console.log('User needs to sign in');
      // Redirect to login screen
    } else if (error.message.includes('permission')) {
      console.log('User does not have permission');
      // Show permission denied message
    } else if (error.message.includes('Network error')) {
      console.log('Network issue detected');
      // Show retry option
    } else {
      console.log('Unknown error:', error.message);
      // Show generic error message
    }
  }
};

/**
 * Example: Using functions in React components
 */
export const exampleReactUsage = `
// In a React component:
import React, { useState } from 'react';
import { driverFunctions } from '../utils/functions';

const BookingScreen = () => {
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);

  const handleCreateBooking = async (parkingId, plateNumber) => {
    try {
      setLoading(true);
      const result = await driverFunctions.createBooking(parkingId, plateNumber);
      setBooking(result);
      console.log('Booking created successfully:', result);
    } catch (error) {
      console.error('Booking failed:', error.message);
      // Show error to user
      Alert.alert('Booking Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Your component JSX here
  );
};
`;

// Export all examples for easy testing
export default {
  exampleDriverBooking,
  exampleDriverPayment,
  exampleDriverCheckout,
  exampleOperatorCheckIn,
  exampleOperatorPendingPayments,
  exampleOperatorConfirmPayment,
  exampleOwnerAnalytics,
  exampleOwnerCreateOperator,
  exampleAdminAnalytics,
  exampleAdminCreateOwner,
  exampleTestConnection,
  exampleErrorHandling,
};
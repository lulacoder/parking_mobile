import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import DrawerContent from './DrawerContent';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@react-navigation/drawer', () => ({
  DrawerContentScrollView: ({ children, ...props }) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  DrawerItemList: () => {
    const { View } = require('react-native');
    return <View testID="drawer-item-list" />;
  },
}));

describe('DrawerContent', () => {
  const mockSignOut = jest.fn();
  const mockUser = {
    email: 'test@example.com',
    uid: 'test-uid',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
  });

  it('should display user email and role', () => {
    useAuth.mockReturnValue({
      user: mockUser,
      userRole: 'driver',
      signOut: mockSignOut,
    });

    const { getByText } = render(<DrawerContent />);

    expect(getByText('test@example.com')).toBeTruthy();
    expect(getByText('DRIVER')).toBeTruthy();
  });

  it('should display sign out button', () => {
    useAuth.mockReturnValue({
      user: mockUser,
      userRole: 'admin',
      signOut: mockSignOut,
    });

    const { getByText } = render(<DrawerContent />);

    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('should show confirmation alert when sign out is pressed', () => {
    useAuth.mockReturnValue({
      user: mockUser,
      userRole: 'owner',
      signOut: mockSignOut,
    });

    const { getByText } = render(<DrawerContent />);
    const signOutButton = getByText('Sign Out');

    fireEvent.press(signOutButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Out',
      'Are you sure you want to sign out?',
      expect.any(Array)
    );
  });

  it('should call signOut when confirmed', async () => {
    useAuth.mockReturnValue({
      user: mockUser,
      userRole: 'operator',
      signOut: mockSignOut,
    });

    // Mock Alert.alert to automatically call the sign out action
    Alert.alert.mockImplementation((title, message, buttons) => {
      const signOutButton = buttons.find(btn => btn.text === 'Sign Out');
      if (signOutButton && signOutButton.onPress) {
        signOutButton.onPress();
      }
    });

    const { getByText } = render(<DrawerContent />);
    const signOutButton = getByText('Sign Out');

    fireEvent.press(signOutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('should display role in uppercase', () => {
    useAuth.mockReturnValue({
      user: mockUser,
      userRole: 'admin',
      signOut: mockSignOut,
    });

    const { getByText } = render(<DrawerContent />);

    expect(getByText('ADMIN')).toBeTruthy();
  });

  it('should render drawer navigation items', () => {
    useAuth.mockReturnValue({
      user: mockUser,
      userRole: 'driver',
      signOut: mockSignOut,
    });

    const { getByTestId } = render(<DrawerContent />);

    expect(getByTestId('drawer-item-list')).toBeTruthy();
  });
});

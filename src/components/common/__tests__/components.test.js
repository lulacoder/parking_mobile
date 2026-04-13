import React from 'react';
import { render } from '@testing-library/react-native';
import Button from '../Button';
import Input from '../Input';
import LoadingScreen from '../LoadingScreen';
import ErrorMessage from '../ErrorMessage';

// Mock the image require for LoadingScreen
jest.mock('../../../../assets/splash-icon.png', () => 'splash-icon.png');

describe('Common UI Components', () => {
  describe('Button', () => {
    it('renders with title', () => {
      const { getByText } = render(<Button title="Test Button" onPress={() => {}} />);
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('shows loading indicator when loading prop is true', () => {
      const { queryByText, UNSAFE_getByType } = render(
        <Button title="Test Button" onPress={() => {}} loading={true} />
      );
      expect(queryByText('Test Button')).toBeNull();
    });

    it('applies disabled state', () => {
      const { getByText } = render(
        <Button title="Test Button" onPress={() => {}} disabled={true} />
      );
      expect(getByText('Test Button')).toBeTruthy();
    });
  });

  describe('Input', () => {
    it('renders with placeholder', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="Test Input" value="" onChangeText={() => {}} />
      );
      expect(getByPlaceholderText('Test Input')).toBeTruthy();
    });

    it('displays error message when error prop is provided', () => {
      const { getByText } = render(
        <Input 
          placeholder="Test Input" 
          value="" 
          onChangeText={() => {}} 
          error="This field is required"
        />
      );
      expect(getByText('This field is required')).toBeTruthy();
    });

    it('does not display error when error prop is not provided', () => {
      const { queryByText } = render(
        <Input placeholder="Test Input" value="" onChangeText={() => {}} />
      );
      expect(queryByText('This field is required')).toBeNull();
    });
  });

  describe('LoadingScreen', () => {
    it('renders with default message', () => {
      const { getByText } = render(<LoadingScreen />);
      expect(getByText('Loading...')).toBeTruthy();
    });

    it('renders with custom message', () => {
      const { getByText } = render(<LoadingScreen message="Please wait..." />);
      expect(getByText('Please wait...')).toBeTruthy();
    });
  });

  describe('ErrorMessage', () => {
    it('renders error message when message prop is provided', () => {
      const { getByText } = render(<ErrorMessage message="An error occurred" />);
      expect(getByText('An error occurred')).toBeTruthy();
    });

    it('does not render when message prop is not provided', () => {
      const { container } = render(<ErrorMessage />);
      expect(container.children.length).toBe(0);
    });

    it('does not render when message is empty string', () => {
      const { container } = render(<ErrorMessage message="" />);
      expect(container.children.length).toBe(0);
    });
  });
});

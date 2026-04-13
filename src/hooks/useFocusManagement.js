import { useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { setAccessibilityFocus, announceForAccessibility, isScreenReaderEnabled } from '../utils/accessibility';

/**
 * Hook for managing accessibility focus when navigating between screens
 * @param {string} screenTitle - Title of the current screen to announce
 * @param {boolean} announceOnFocus - Whether to announce screen title when focused
 * @returns {React.RefObject} - Ref to attach to the element that should receive focus
 */
export function useFocusManagement(screenTitle, announceOnFocus = true) {
  const focusRef = useRef(null);
  const hasAnnouncedRef = useRef(false);

  useFocusEffect(() => {
    const handleScreenFocus = async () => {
      // Check if screen reader is enabled
      const screenReaderEnabled = await isScreenReaderEnabled();
      
      if (screenReaderEnabled) {
        // Small delay to ensure screen is fully rendered
        setTimeout(() => {
          // Set focus to the main content area
          if (focusRef.current) {
            setAccessibilityFocus(focusRef);
          }
          
          // Announce screen title if requested and not already announced
          if (announceOnFocus && screenTitle && !hasAnnouncedRef.current) {
            announceForAccessibility(screenTitle);
            hasAnnouncedRef.current = true;
          }
        }, 100);
      }
    };

    handleScreenFocus();

    // Reset announcement flag when screen loses focus
    return () => {
      hasAnnouncedRef.current = false;
    };
  });

  return focusRef;
}

/**
 * Hook for managing focus when forms have validation errors
 * @param {object} errors - Object containing form validation errors
 * @param {object} fieldRefs - Object containing refs to form fields
 */
export function useFormErrorFocus(errors, fieldRefs) {
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      // Find the first field with an error
      const firstErrorField = Object.keys(errors)[0];
      const fieldRef = fieldRefs[firstErrorField];
      
      if (fieldRef?.current) {
        // Focus the field with error
        setTimeout(() => {
          setAccessibilityFocus(fieldRef);
          
          // Announce the error
          const errorMessage = errors[firstErrorField];
          if (errorMessage) {
            announceForAccessibility(`Error in ${firstErrorField}: ${errorMessage}`, true);
          }
        }, 100);
      }
    }
  }, [errors, fieldRefs]);
}

/**
 * Hook for announcing loading states
 * @param {boolean} loading - Whether something is currently loading
 * @param {string} loadingMessage - Message to announce when loading starts
 * @param {string} completeMessage - Message to announce when loading completes
 */
export function useLoadingAnnouncement(loading, loadingMessage = 'Loading', completeMessage = 'Loading complete') {
  const previousLoadingRef = useRef(loading);

  useEffect(() => {
    const wasLoading = previousLoadingRef.current;
    const isLoading = loading;

    if (!wasLoading && isLoading) {
      // Started loading
      announceForAccessibility(loadingMessage);
    } else if (wasLoading && !isLoading) {
      // Finished loading
      announceForAccessibility(completeMessage);
    }

    previousLoadingRef.current = loading;
  }, [loading, loadingMessage, completeMessage]);
}

/**
 * Hook for announcing navigation changes
 * @param {string} currentRoute - Current route name
 * @param {string} routeTitle - Human-readable title for the route
 */
export function useNavigationAnnouncement(currentRoute, routeTitle) {
  const previousRouteRef = useRef(currentRoute);

  useEffect(() => {
    const previousRoute = previousRouteRef.current;
    
    if (previousRoute !== currentRoute && routeTitle) {
      announceForAccessibility(`Navigated to ${routeTitle}`);
    }

    previousRouteRef.current = currentRoute;
  }, [currentRoute, routeTitle]);
}

/**
 * Hook for managing focus when modals or overlays open/close
 * @param {boolean} isVisible - Whether the modal/overlay is visible
 * @param {React.RefObject} focusRef - Ref to element that should receive focus when modal opens
 * @param {React.RefObject} returnFocusRef - Ref to element that should receive focus when modal closes
 */
export function useModalFocusManagement(isVisible, focusRef, returnFocusRef) {
  const previousVisibleRef = useRef(isVisible);

  useEffect(() => {
    const wasVisible = previousVisibleRef.current;
    const isCurrentlyVisible = isVisible;

    if (!wasVisible && isCurrentlyVisible) {
      // Modal opened - focus the modal content
      setTimeout(() => {
        if (focusRef?.current) {
          setAccessibilityFocus(focusRef);
        }
      }, 100);
    } else if (wasVisible && !isCurrentlyVisible) {
      // Modal closed - return focus to the trigger element
      setTimeout(() => {
        if (returnFocusRef?.current) {
          setAccessibilityFocus(returnFocusRef);
        }
      }, 100);
    }

    previousVisibleRef.current = isVisible;
  }, [isVisible, focusRef, returnFocusRef]);
}

/**
 * Hook for announcing status changes (success, error, etc.)
 * @param {string} status - Current status
 * @param {object} statusMessages - Object mapping status values to announcement messages
 */
export function useStatusAnnouncement(status, statusMessages = {}) {
  const previousStatusRef = useRef(status);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    
    if (previousStatus !== status && statusMessages[status]) {
      announceForAccessibility(statusMessages[status], true);
    }

    previousStatusRef.current = status;
  }, [status, statusMessages]);
}

export default {
  useFocusManagement,
  useFormErrorFocus,
  useLoadingAnnouncement,
  useNavigationAnnouncement,
  useModalFocusManagement,
  useStatusAnnouncement,
};
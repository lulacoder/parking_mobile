import { Stack } from 'expo-router';

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="scan-qr" />
      <Stack.Screen name="checkin-confirm" />
    </Stack>
  );
}

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="scan" 
          options={{ 
            title: "Scan Product",
            presentation: "modal",
          }} 
        />
        <Stack.Screen 
          name="products" 
          options={{ 
            title: "Products",
          }} 
        />
      </Stack>
    </>
  );
}

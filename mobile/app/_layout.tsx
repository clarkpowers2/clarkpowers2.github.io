import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: "FreshSave Staff",
            headerLargeTitle: true,
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

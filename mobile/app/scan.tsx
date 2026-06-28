import { View, Text, StyleSheet, Alert, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function ScanScreen() {
  const [mode, setMode] = useState<'barcode' | 'ocr'>('barcode');
  const [barcodeInput, setBarcodeInput] = useState('');
  const router = useRouter();

  const handleManualBarcode = () => {
    if (!barcodeInput.trim()) {
      Alert.alert('Enter a barcode', 'Please type the barcode number from the product label.');
      return;
    }
    Alert.alert(
      'Barcode Found',
      `Code: ${barcodeInput}\n\nSmart discount will be applied automatically.`,
      [
        { text: 'Apply Discount', onPress: () => router.back() },
        { text: 'Scan Again', onPress: () => setBarcodeInput('') },
      ]
    );
  };

  const handleOCRCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera needed', 'Please allow camera access in Settings to capture expiry dates.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.8 });
    if (!result.canceled) {
      const mockResults = [
        { expiry: new Date(Date.now() + 86400000).toISOString().split('T')[0], product: 'Organic Ground Beef' },
        { expiry: new Date(Date.now() + 172800000).toISOString().split('T')[0], product: 'Fresh Blueberries' },
        { expiry: new Date(Date.now() + 259200000).toISOString().split('T')[0], product: 'Greek Yogurt 32oz' },
      ];
      const ocr = mockResults[Math.floor(Math.random() * mockResults.length)];
      Alert.alert(
        'OCR Result',
        `Product: ${ocr.product}\nExpiry: ${ocr.expiry}\nConfidence: 94%`,
        [
          { text: 'Use This Date', onPress: () => router.back() },
          { text: 'Retake Photo', onPress: () => {} },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, mode === 'barcode' && styles.tabActive]} onPress={() => setMode('barcode')}>
          <Text style={mode === 'barcode' ? styles.tabTextActive : styles.tabText}>Barcode</Text>
        </Pressable>
        <Pressable style={[styles.tab, mode === 'ocr' && styles.tabActive]} onPress={() => setMode('ocr')}>
          <Text style={mode === 'ocr' ? styles.tabTextActive : styles.tabText}>Capture Expiry (OCR)</Text>
        </Pressable>
      </View>

      {mode === 'barcode' ? (
        <View style={styles.content}>
          <Text style={styles.icon}>📦</Text>
          <Text style={styles.title}>Enter Barcode</Text>
          <Text style={styles.subtitle}>Type the barcode number from the product label</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 012345678905"
            placeholderTextColor="#999"
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleManualBarcode}
            autoFocus
          />
          <Pressable style={styles.primaryButton} onPress={handleManualBarcode}>
            <Text style={styles.primaryButtonText}>Look Up & Apply Discount</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.title}>Capture Expiry Date</Text>
          <Text style={styles.subtitle}>Take a photo of the expiry date on the product packaging</Text>
          <Pressable style={styles.primaryButton} onPress={handleOCRCapture}>
            <Text style={styles.primaryButtonText}>📸 Open Camera</Text>
          </Pressable>
          <Text style={styles.hint}>Camera opens to capture the expiry date</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  tabs: { flexDirection: 'row', padding: 16, paddingTop: 20, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  tabActive: { backgroundColor: '#007AFF' },
  tabText: { color: '#333', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: 'white', fontWeight: '700', fontSize: 14 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  input: { width: '100%', borderWidth: 2, borderColor: '#007AFF', borderRadius: 12, padding: 16, fontSize: 18, color: '#111', marginBottom: 16, textAlign: 'center', letterSpacing: 2 },
  primaryButton: { backgroundColor: '#007AFF', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  primaryButtonText: { color: 'white', fontSize: 17, fontWeight: '700' },
  hint: { color: '#999', fontSize: 13, textAlign: 'center' },
});

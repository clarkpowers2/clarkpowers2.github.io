import { View, Text, StyleSheet, Button, Alert, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<'barcode' | 'ocr'>('barcode');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Alert.alert(
      'Barcode Detected',
      `Code: ${data}\n\nSmart discount would be applied automatically.`,
      [
        { text: 'Use & Apply Discount', onPress: () => router.back() },
        { text: 'Scan Again', onPress: () => setScanned(false) },
      ]
    );
  };

  const simulateOCR = () => {
    // Feature 5: OCR fallback simulation (like the web version)
    const mockResults = [
      { expiry: '2025-06-12', product: 'Organic Ground Beef' },
      { expiry: '2025-06-10', product: 'Fresh Blueberries' },
      { expiry: '2025-06-08', product: 'Greek Yogurt 32oz' },
    ];
    const result = mockResults[Math.floor(Math.random() * mockResults.length)];

    Alert.alert(
      'OCR Result',
      `Product: ${result.product}\nExpiry: ${result.expiry}\nConfidence: 94%`,
      [
        {
          text: 'Use This Date',
          onPress: () => router.back(),
        },
        { text: 'Retake Photo', onPress: () => {} },
      ]
    );
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No camera access</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable 
          style={[styles.tab, mode === 'barcode' && styles.tabActive]} 
          onPress={() => setMode('barcode')}
        >
          <Text style={mode === 'barcode' ? styles.tabTextActive : styles.tabText}>Barcode</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, mode === 'ocr' && styles.tabActive]} 
          onPress={() => setMode('ocr')}
        >
          <Text style={mode === 'ocr' ? styles.tabTextActive : styles.tabText}>Capture Expiry (OCR)</Text>
        </Pressable>
      </View>

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={mode === 'barcode' && !scanned ? handleBarcodeScanned : undefined}
      />

      <View style={styles.overlay}>
        {mode === 'barcode' ? (
          <>
            <Text style={styles.instruction}>Align barcode in frame</Text>
            <View style={styles.scanFrame} />
            {scanned && <Button title="Scan Again" onPress={() => setScanned(false)} />}
          </>
        ) : (
          <>
            <Text style={styles.instruction}>Position expiry date clearly</Text>
            <View style={[styles.scanFrame, { height: 220 }]} />
            <Pressable style={styles.captureButton} onPress={simulateOCR}>
              <Text style={styles.captureText}>📸 Capture & Analyze</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  tabs: { flexDirection: 'row', position: 'absolute', top: 60, zIndex: 10, alignSelf: 'center' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, marginHorizontal: 4 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: 'white', fontWeight: '600' },
  tabTextActive: { color: '#000', fontWeight: '700' },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instruction: {
    color: 'white',
    fontSize: 15,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 30,
    textAlign: 'center',
  },
  scanFrame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  captureButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 40,
  },
  captureText: { fontSize: 17, fontWeight: '700', color: '#000' },
});

import { View, Text, StyleSheet, Alert, Pressable, AppState } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<'barcode' | 'ocr'>('barcode');
  const [isCameraActive, setIsCameraActive] = useState(true);
  const appState = useRef(AppState.currentState);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    const subscription = AppState.addEventListener('change', next => {
      setIsCameraActive(next === 'active');
      appState.current = next;
    });
    return () => subscription.remove();
  }, []);

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setIsCameraActive(false);
    Alert.alert(
      'Barcode Detected',
      `Code: ${data}\n\nSmart discount will be applied automatically.`,
      [
        { text: 'Use & Apply Discount', onPress: () => router.back() },
        { text: 'Scan Again', onPress: () => { setScanned(false); setIsCameraActive(true); } },
      ]
    );
  };

  const simulateOCR = () => {
    const mockResults = [
      { expiry: new Date(Date.now() + 86400000).toISOString().split('T')[0], product: 'Organic Ground Beef' },
      { expiry: new Date(Date.now() + 172800000).toISOString().split('T')[0], product: 'Fresh Blueberries' },
      { expiry: new Date(Date.now() + 259200000).toISOString().split('T')[0], product: 'Greek Yogurt 32oz' },
    ];
    const result = mockResults[Math.floor(Math.random() * mockResults.length)];
    Alert.alert(
      'OCR Result',
      `Product: ${result.product}\nExpiry: ${result.expiry}\nConfidence: 94%`,
      [
        { text: 'Use This Date', onPress: () => router.back() },
        { text: 'Retake Photo', onPress: () => {} },
      ]
    );
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text style={styles.centerText}>Requesting camera permission...</Text></View>;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Camera access denied.</Text>
        <Text style={styles.centerSub}>Go to Settings → FreshSave Staff → Camera and enable access.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        active={isCameraActive}
        barcodeScannerSettings={{ barcodeTypes: ['ean13','ean8','upc_a','upc_e','code128','code39','qr'] }}
        onBarcodeScanned={mode === 'barcode' && !scanned ? handleBarcodeScanned : undefined}
      />
      <View style={styles.tabs}>
        <Pressable style={[styles.tab, mode === 'barcode' && styles.tabActive]} onPress={() => { setMode('barcode'); setScanned(false); setIsCameraActive(true); }}>
          <Text style={mode === 'barcode' ? styles.tabTextActive : styles.tabText}>Barcode</Text>
        </Pressable>
        <Pressable style={[styles.tab, mode === 'ocr' && styles.tabActive]} onPress={() => setMode('ocr')}>
          <Text style={mode === 'ocr' ? styles.tabTextActive : styles.tabText}>Capture Expiry (OCR)</Text>
        </Pressable>
      </View>
      <View style={styles.overlay}>
        {mode === 'barcode' ? (
          <>
            <Text style={styles.instruction}>Align barcode in frame</Text>
            <View style={styles.scanFrame} />
            {scanned && (
              <Pressable style={styles.captureButton} onPress={() => { setScanned(false); setIsCameraActive(true); }}>
                <Text style={styles.captureText}>Scan Again</Text>
              </Pressable>
            )}
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
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#000' },
  centerText: { color: 'white', fontSize: 17, textAlign: 'center', marginBottom: 12 },
  centerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center' },
  tabs: { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'center' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, marginHorizontal: 4 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: 'white', fontWeight: '600' },
  tabTextActive: { color: '#000', fontWeight: '700' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  instruction: { color: 'white', fontSize: 15, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginBottom: 30, textAlign: 'center' },
  scanFrame: { width: 260, height: 160, borderWidth: 3, borderColor: '#fff', borderRadius: 12, backgroundColor: 'transparent' },
  captureButton: { backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30, marginTop: 40 },
  captureText: { fontSize: 17, fontWeight: '700', color: '#000' },
});

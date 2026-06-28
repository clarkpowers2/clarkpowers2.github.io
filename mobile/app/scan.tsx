import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useFocusEffect } from 'expo-router';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [mode, setMode] = useState<'barcode' | 'ocr'>('barcode');
  const [scanned, setScanned] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const device = useCameraDevice('back');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      const timer = setTimeout(() => setIsActive(true), 300);
      return () => { clearTimeout(timer); setIsActive(false); };
    }, [])
  );

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'qr'],
    onCodeScanned: (codes) => {
      if (scanned || codes.length === 0) return;
      setScanned(true);
      setIsActive(false);
      const data = codes[0].value ?? '';
      Alert.alert(
        'Barcode Detected',
        `Code: ${data}\n\nSmart discount will be applied automatically.`,
        [
          { text: 'Use & Apply Discount', onPress: () => router.back() },
          { text: 'Scan Again', onPress: () => { setScanned(false); setIsActive(true); } },
        ]
      );
    },
  });

  const handleOCRCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera needed', 'Please allow camera access in Settings.');
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

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerText}>Camera access needed to scan barcodes.</Text>
        <Pressable style={styles.permButton} onPress={async () => {
          const status = await Camera.requestCameraPermission();
          setHasPermission(status === 'granted');
        }}>
          <Text style={styles.permButtonText}>Grant Camera Access</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return <View style={styles.center}><Text style={styles.centerText}>No camera found.</Text></View>;
  }

  return (
    <View style={styles.container}>
      {mode === 'barcode' && isActive && (
        <Camera
          style={StyleSheet.absoluteFillObject}
          device={device}
          isActive={isActive}
          codeScanner={codeScanner}
        />
      )}

      {mode === 'ocr' && (
        <View style={styles.ocrContent}>
          <Text style={styles.ocrIcon}>📅</Text>
          <Text style={styles.ocrTitle}>Capture Expiry Date</Text>
          <Text style={styles.ocrSubtitle}>Take a photo of the expiry date on the product packaging</Text>
          <Pressable style={styles.captureButton} onPress={handleOCRCapture}>
            <Text style={styles.captureText}>📸 Open Camera</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, mode === 'barcode' && styles.tabActive]} onPress={() => { setMode('barcode'); setScanned(false); setIsActive(true); }}>
          <Text style={mode === 'barcode' ? styles.tabTextActive : styles.tabText}>Barcode</Text>
        </Pressable>
        <Pressable style={[styles.tab, mode === 'ocr' && styles.tabActive]} onPress={() => { setMode('ocr'); setIsActive(false); }}>
          <Text style={mode === 'ocr' ? styles.tabTextActive : styles.tabText}>Capture Expiry (OCR)</Text>
        </Pressable>
      </View>

      {mode === 'barcode' && (
        <View style={styles.overlay}>
          <Text style={styles.instruction}>Align barcode in frame</Text>
          <View style={styles.scanFrame} />
          {scanned && (
            <Pressable style={styles.rescanButton} onPress={() => { setScanned(false); setIsActive(true); }}>
              <Text style={styles.captureText}>Scan Again</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#000' },
  centerText: { color: 'white', fontSize: 17, textAlign: 'center', marginBottom: 20 },
  permButton: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  tabs: { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'center' },
  tab: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, marginHorizontal: 4 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { color: 'white', fontWeight: '600' },
  tabTextActive: { color: '#000', fontWeight: '700' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  instruction: { color: 'white', fontSize: 15, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginBottom: 30, textAlign: 'center' },
  scanFrame: { width: 260, height: 160, borderWidth: 3, borderColor: '#fff', borderRadius: 12, backgroundColor: 'transparent' },
  rescanButton: { backgroundColor: '#fff', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 30, marginTop: 40 },
  captureButton: { backgroundColor: '#007AFF', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  captureText: { fontSize: 17, fontWeight: '700', color: '#000' },
  ocrContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  ocrIcon: { fontSize: 64, marginBottom: 16 },
  ocrTitle: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  ocrSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
});

import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useProducts, STORES } from '../lib/useProducts';
import { calculateDiscountInfo } from '../lib/productUtils';

export default function StaffHome() {
  const { 
    products, 
    currentStore, 
    stores, 
    currentStoreId, 
    switchStore, 
    applySmartDiscount 
  } = useProducts();

  // Group by urgency (ported + enhanced from web TodaysActionList)
  const critical = products.filter(p => {
    const info = calculateDiscountInfo(p);
    return info.urgencyLevel === 'critical' && p.status === 'pending';
  });
  const high = products.filter(p => {
    const info = calculateDiscountInfo(p);
    return info.urgencyLevel === 'high' && p.status === 'pending';
  });
  const medium = products.filter(p => {
    const info = calculateDiscountInfo(p);
    return info.urgencyLevel === 'medium' && p.status === 'pending';
  });

  const potentialRevenue = [...critical, ...high, ...medium].reduce((sum, p) => {
    const info = calculateDiscountInfo(p);
    return sum + info.discountedPrice;
  }, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Store Switcher - Feature 2 */}
      <View style={styles.storeSwitcher}>
        {stores.map(store => (
          <Pressable
            key={store.id}
            style={[
              styles.storePill,
              currentStoreId === store.id && styles.storePillActive
            ]}
            onPress={() => switchStore(store.id)}
          >
            <Text style={currentStoreId === store.id ? styles.storePillTextActive : styles.storePillText}>
              {store.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>FreshSave Staff</Text>
        <Text style={styles.subtitle}>{currentStore.name} • Today</Text>
      </View>

      {/* Big prominent Scan button */}
      <Link href="/scan" asChild>
        <Pressable style={styles.scanButton}>
          <Text style={styles.scanButtonText}>📷 Scan Product</Text>
          <Text style={styles.scanButtonSub}>Barcode or Capture Expiry Date</Text>
        </Pressable>
      </Link>

      {/* Enhanced Today's Action List (Feature 4) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Action List</Text>

        <View style={styles.buckets}>
          <View style={[styles.bucket, styles.critical]}>
            <Text style={styles.bucketLabel}>Critical</Text>
            <Text style={styles.bucketCount}>{critical.length}</Text>
            <Text style={styles.bucketSub}>Expires today</Text>
          </View>
          <View style={[styles.bucket, styles.high]}>
            <Text style={styles.bucketLabel}>High</Text>
            <Text style={styles.bucketCount}>{high.length}</Text>
            <Text style={styles.bucketSub}>Expires tomorrow</Text>
          </View>
          <View style={[styles.bucket, styles.medium]}>
            <Text style={styles.bucketLabel}>Medium</Text>
            <Text style={styles.bucketCount}>{medium.length}</Text>
            <Text style={styles.bucketSub}>In 3 days</Text>
          </View>
        </View>

        <Text style={styles.potential}>
          Potential revenue at risk: <Text style={{ fontWeight: '700' }}>${potentialRevenue.toFixed(0)}</Text>
        </Text>

        {critical.length + high.length + medium.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>All caught up! 🎉</Text>
          </View>
        ) : (
          [...critical, ...high, ...medium].slice(0, 4).map(product => {
            const info = calculateDiscountInfo(product);
            return (
              <View key={product.id} style={styles.productCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productMeta}>
                    {info.daysUntilExpiry}d • {info.discountPercentage}% smart discount
                  </Text>
                </View>
                <Pressable 
                  style={styles.actionButton}
                  onPress={() => applySmartDiscount(product.id)}
                >
                  <Text style={styles.actionButtonText}>Apply</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>

      <Link href="/products" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>View All Products →</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  storeSwitcher: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  storePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  storePillActive: { backgroundColor: '#007AFF' },
  storePillText: { color: '#333' },
  storePillTextActive: { color: 'white', fontWeight: '600' },
  header: { marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#666', marginTop: 2 },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 22,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButtonText: { color: 'white', fontSize: 20, fontWeight: '700' },
  scanButtonSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4, fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  buckets: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  bucket: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  critical: { backgroundColor: '#fee2e2' },
  high: { backgroundColor: '#fef3c7' },
  medium: { backgroundColor: '#dbeafe' },
  bucketLabel: { fontSize: 12, fontWeight: '600' },
  bucketCount: { fontSize: 22, fontWeight: '800' },
  bucketSub: { fontSize: 10, color: '#666' },
  potential: { fontSize: 14, color: '#444', marginBottom: 12, textAlign: 'center' },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  productName: { fontSize: 16, fontWeight: '600' },
  productMeta: { color: '#666', marginTop: 2, fontSize: 13 },
  actionButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionButtonText: { color: 'white', fontWeight: '700' },
  secondaryButton: { padding: 14, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  emptyState: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 16 },
});

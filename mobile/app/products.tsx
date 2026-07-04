import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useProducts } from '../lib/useProducts';
import { calculateDiscountInfo } from '../lib/productUtils';

export default function ProductsScreen() {
  const { products, applySmartDiscount } = useProducts();

  const handleApply = (id: string, name: string) => {
    const info = calculateDiscountInfo(products.find(p => p.id === id)!);
    
    Alert.alert(
      'Smart Discount Applied',
      `${name}\n${info.baseDiscount}% base + ${info.categoryModifier}% category + ${info.timeModifier}% peak = ${info.discountPercentage}%\n\nNew price: $${info.discountedPrice}`,
      [
        { text: 'Print Label', onPress: () => Alert.alert('Label Printed!', 'Sent to thermal printer (demo)') },
        { text: 'Done', style: 'cancel' }
      ]
    );
    
    applySmartDiscount(id);
  };

  const renderItem = ({ item }: { item: any }) => {
    const info = calculateDiscountInfo(item);
    const isDiscounted = item.status === 'discounted';

    return (
      <View style={styles.card}>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>{item.category} • Expires in {info.daysUntilExpiry}d</Text>
          <Text style={styles.price}>
            ${item.originalPrice} {isDiscounted && `→ $${info.discountedPrice?.toFixed(2)} (${info.discountPercentage}%)`}
          </Text>
        </View>

        {!isDiscounted && (
          <Pressable style={styles.button} onPress={() => handleApply(item.id, item.name)}>
            <Text style={styles.buttonText}>Apply + Print</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
  },
  name: { fontSize: 17, fontWeight: '600' },
  meta: { color: '#666', marginTop: 4 },
  price: { marginTop: 6, fontSize: 15 },
  button: { backgroundColor: '#15803D', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
});

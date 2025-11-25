import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import api from '../../src/services/api';

interface ServicePrice {
  id: number;
  serviceName: string;
  category: string;
  price: number;
  unit: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
}

interface GroupedService {
  category: string;
  services: ServicePrice[];
}

const categories = [
  { label: 'Tất cả', value: '', icon: 'list' },
  { label: 'Khám bệnh', value: 'Khám bệnh', icon: 'stethoscope' },
  { label: 'Xét nghiệm', value: 'Xét nghiệm', icon: 'flask' },
  { label: 'Chẩn đoán hình ảnh', value: 'Chẩn đoán hình ảnh', icon: 'camera' },
  { label: 'Thủ thuật', value: 'Thủ thuật', icon: 'medkit' },
  { label: 'Phẫu thuật', value: 'Phẫu thuật', icon: 'heartbeat' },
];

export default function PricingScreen() {
  const [groupedServices, setGroupedServices] = useState<GroupedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const loadPrices = React.useCallback(async () => {
    try {
      setLoading(true);
      
      const params: any = {};
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const response = await api.get<GroupedService[]>('/serviceprices', { params });
      setGroupedServices(response.data);
    } catch (error: any) {
      console.error('Error loading prices:', error);
      Alert.alert('Lỗi', 'Không thể tải bảng giá');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Khám bệnh': '#0066cc',
      'Xét nghiệm': '#00a86b',
      'Chẩn đoán hình ảnh': '#ff6b35',
      'Thủ thuật': '#9b59b6',
      'Phẫu thuật': '#e74c3c',
    };
    return colors[category] || '#95a5a6';
  };

  const getCategoryIcon = (category: string): any => {
    const icons: { [key: string]: string } = {
      'Khám bệnh': 'stethoscope',
      'Xét nghiệm': 'flask',
      'Chẩn đoán hình ảnh': 'camera',
      'Thủ thuật': 'medkit',
      'Phẫu thuật': 'heartbeat',
    };
    return icons[category] || 'hospital-o';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải bảng giá...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bảng giá Dịch vụ</Text>
        <Text style={styles.headerSubtitle}>Giá cả minh bạch, chất lượng đảm bảo</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryChip,
              selectedCategory === cat.value && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            <FontAwesome
              name={cat.icon as any}
              size={16}
              color={selectedCategory === cat.value ? '#fff' : '#7f8c8d'}
              style={styles.categoryIcon}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.value && styles.categoryChipTextActive
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Price List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0066cc']}
          />
        }
      >
        {groupedServices.length > 0 ? (
          groupedServices.map((group, index) => (
            <View key={index} style={styles.categorySection}>
              <View
                style={[
                  styles.categoryHeader,
                  { backgroundColor: getCategoryColor(group.category) }
                ]}
              >
                <FontAwesome
                  name={getCategoryIcon(group.category)}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.categoryTitle}>{group.category}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {group.services.length}
                  </Text>
                </View>
              </View>

              <View style={styles.servicesContainer}>
                {group.services.map((service, idx) => (
                  <View
                    key={service.id}
                    style={[
                      styles.serviceItem,
                      idx === group.services.length - 1 && styles.serviceItemLast
                    ]}
                  >
                    <View style={styles.serviceInfo}>
                      <View style={styles.serviceHeader}>
                        <Text style={styles.serviceOrder}>{service.displayOrder || idx + 1}</Text>
                        <View style={styles.serviceDetails}>
                          <Text style={styles.serviceName}>{service.serviceName}</Text>
                          {service.description && (
                            <Text style={styles.serviceDescription} numberOfLines={2}>
                              {service.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceAmount}>
                          {formatCurrency(service.price)}
                        </Text>
                        <Text style={styles.priceUnit}>{service.unit}</Text>
                      </View>
                    </View>
                    {service.isActive && (
                      <View style={styles.activeIndicator}>
                        <FontAwesome name="check-circle" size={16} color="#00a86b" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome name="inbox" size={60} color="#bdc3c7" />
            <Text style={styles.emptyText}>Chưa có dịch vụ nào</Text>
          </View>
        )}

        {/* Info Note */}
        <View style={styles.noteContainer}>
          <FontAwesome name="info-circle" size={20} color="#3498db" />
          <Text style={styles.noteText}>
            Giá trên chỉ mang tính chất tham khảo. Giá thực tế có thể thay đổi tùy theo tình trạng bệnh lý và phương pháp điều trị cụ thể.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0066cc',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  categoryScrollWrapper: {
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  categoryContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#0066cc',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  servicesContainer: {
    backgroundColor: '#fff',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  serviceItemLast: {
    borderBottomWidth: 0,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceOrder: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
    marginRight: 10,
    marginTop: 2,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 26,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  priceUnit: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  activeIndicator: {
    marginLeft: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#95a5a6',
  },
  noteContainer: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#2c3e50',
    lineHeight: 20,
    marginLeft: 10,
  },
});

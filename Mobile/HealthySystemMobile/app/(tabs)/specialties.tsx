import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import api from '../../src/services/api';

interface Specialty {
  Id: number;
  Name: string;
  Description?: string;
}

export default function SpecialtiesScreen() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialties = async () => {
    try {
      setError(null);
      const response = await api.get('/specialties');
      console.log('Specialties fetched:', response.data);
      setSpecialties(response.data);
    } catch (err: any) {
      console.error('Error fetching specialties:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách chuyên khoa');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSpecialties();
  };

  const getSpecialtyIcon = (name: string): any => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('tim') || lowerName.includes('mạch')) return 'heartbeat';
    if (lowerName.includes('xương') || lowerName.includes('khớp')) return 'wheelchair';
    if (lowerName.includes('mắt')) return 'eye';
    if (lowerName.includes('tai') || lowerName.includes('mũi') || lowerName.includes('họng')) return 'stethoscope';
    if (lowerName.includes('da')) return 'hand-paper-o';
    if (lowerName.includes('thần kinh') || lowerName.includes('não')) return 'brain';
    if (lowerName.includes('tiêu hóa')) return 'cutlery';
    if (lowerName.includes('nhi')) return 'child';
    if (lowerName.includes('phụ')) return 'female';
    if (lowerName.includes('răng')) return 'tooth';
    return 'hospital-o';
  };

  const renderSpecialty = ({ item }: { item: Specialty }) => (
    <TouchableOpacity
      style={styles.specialtyCard}
      onPress={() => router.push(`/specialty-detail/${item.Id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <FontAwesome name={getSpecialtyIcon(item.Name)} size={32} color="#0066cc" />
      </View>
      <View style={styles.specialtyInfo}>
        <Text style={styles.specialtyName}>{item.Name}</Text>
        {item.Description && (
          <Text style={styles.specialtyDescription} numberOfLines={2}>
            {item.Description}
          </Text>
        )}
      </View>
      <FontAwesome name="chevron-right" size={16} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải chuyên khoa...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSpecialties}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chuyên khoa</Text>
        <Text style={styles.headerSubtitle}>
          {specialties.length} chuyên khoa khám chữa bệnh
        </Text>
      </View>

      <FlatList
        data={specialties}
        renderItem={renderSpecialty}
        keyExtractor={(item, index) => item?.Id?.toString() || `specialty-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0066cc']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="folder-open-o" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có chuyên khoa nào</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  specialtyInfo: {
    flex: 1,
  },
  specialtyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  specialtyDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});

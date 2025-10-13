import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import api from '../../src/services/api';

interface Specialty {
  id: number;
  name: string;
}

interface Doctor {
  id: number;
  publicId: string;
  fullName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  description?: string;
  yearsOfExperience: number;
  specialties: Specialty[];
}

export default function DoctorsScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, doctors]);

  const fetchDoctors = async () => {
    try {
      setError(null);
      const response = await api.get('/doctors');
      console.log('Doctors fetched:', response.data);
      setDoctors(response.data);
      setFilteredDoctors(response.data);
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterDoctors = () => {
    if (!searchQuery.trim()) {
      setFilteredDoctors(doctors);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = doctors.filter(
      (doctor) =>
        doctor.fullName.toLowerCase().includes(query) ||
        doctor.department.toLowerCase().includes(query) ||
        doctor.specialties.some((s) => s.name.toLowerCase().includes(query))
    );
    setFilteredDoctors(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctors();
  };

  const renderDoctor = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => router.push(`/doctor-detail/${item.publicId}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.doctorAvatar}>
        <FontAwesome name="user-md" size={32} color="#0066cc" />
      </View>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>
          {item.title} {item.fullName}
        </Text>
        <Text style={styles.doctorDepartment}>{item.department}</Text>
        <View style={styles.experienceContainer}>
          <FontAwesome name="briefcase" size={12} color="#666" />
          <Text style={styles.experienceText}>
            {item.yearsOfExperience} năm kinh nghiệm
          </Text>
        </View>
        {item.specialties.length > 0 && (
          <View style={styles.specialtiesRow}>
            {item.specialties.slice(0, 2).map((specialty) => (
              <View key={specialty.id} style={styles.specialtyBadge}>
                <Text style={styles.specialtyBadgeText}>{specialty.name}</Text>
              </View>
            ))}
            {item.specialties.length > 2 && (
              <Text style={styles.moreSpecialties}>
                +{item.specialties.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>
      <FontAwesome name="chevron-right" size={16} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDoctors}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bác sĩ</Text>
        <Text style={styles.headerSubtitle}>
          {filteredDoctors.length} bác sĩ {searchQuery ? 'được tìm thấy' : 'đang hoạt động'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên, chuyên khoa..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome name="times-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item.id.toString()}
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
            <FontAwesome name="user-times" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy bác sĩ phù hợp' : 'Chưa có bác sĩ nào'}
            </Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  doctorCard: {
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
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  doctorDepartment: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 4,
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  experienceText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  specialtiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyBadge: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyBadgeText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
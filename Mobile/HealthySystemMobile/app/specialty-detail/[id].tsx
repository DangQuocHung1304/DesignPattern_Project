import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import api from '../../src/services/api';

interface Specialty {
  id: number;
  name: string;
  description?: string;
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
  isAvailable: boolean;
}

export default function SpecialtyDetailScreen() {
  const { id } = useLocalSearchParams();
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpecialtyDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSpecialtyDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch specialty info
      const specialtyResponse = await api.get(`/specialties/${id}`);
      setSpecialty(specialtyResponse.data);

      // Fetch doctors in this specialty
      const doctorsResponse = await api.get(`/specialties/${id}/doctors`);
      setDoctors(doctorsResponse.data);

      console.log('Specialty loaded:', specialtyResponse.data);
      console.log('Doctors loaded:', doctorsResponse.data.length);
    } catch (err: any) {
      console.error('Error loading specialty details:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin chuyên khoa');
    } finally {
      setLoading(false);
    }
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => router.push(`/doctor-detail/${item.publicId}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.doctorAvatar}>
        <FontAwesome name="user-md" size={32} color="#0066cc" />
      </View>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.title} {item.fullName}</Text>
        <Text style={styles.doctorDepartment}>{item.department}</Text>
        <View style={styles.experienceContainer}>
          <FontAwesome name="briefcase" size={12} color="#666" />
          <Text style={styles.experienceText}>
            {item.yearsOfExperience} năm kinh nghiệm
          </Text>
        </View>
        {item.description && (
          <Text style={styles.doctorDescription} numberOfLines={2}>
            {item.description}
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
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error || !specialty) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error || 'Không tìm thấy chuyên khoa'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết chuyên khoa</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Specialty Info */}
        <View style={styles.specialtyInfoCard}>
          <View style={styles.specialtyIcon}>
            <FontAwesome name="hospital-o" size={40} color="#0066cc" />
          </View>
          <Text style={styles.specialtyName}>{specialty.name}</Text>
          {specialty.description && (
            <Text style={styles.specialtyDescription}>{specialty.description}</Text>
          )}
        </View>

        {/* Doctors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="user-md" size={20} color="#333" />
            <Text style={styles.sectionTitle}>
              Đội ngũ bác sĩ ({doctors.length})
            </Text>
          </View>

          {doctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="user-times" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                Chưa có bác sĩ trong chuyên khoa này
              </Text>
            </View>
          ) : (
            <FlatList
              data={doctors}
              renderItem={renderDoctorCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  specialtyInfoCard: {
    backgroundColor: 'white',
    padding: 24,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specialtyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  specialtyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  specialtyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
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
    marginBottom: 4,
  },
  experienceText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  doctorDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});

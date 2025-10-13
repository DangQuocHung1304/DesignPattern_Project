import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
  gender: string;
  dateOfBirth?: string;
  title: string;
  department: string;
  description?: string;
  yearsOfExperience: number;
  specialties: Specialty[];
}

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctorDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/doctors/${id}`);
      setDoctor(response.data);
      console.log('Doctor loaded:', response.data);
    } catch (err: any) {
      console.error('Error loading doctor details:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const getGenderText = (gender: string) => {
    if (gender === 'male') return 'Nam';
    if (gender === 'female') return 'Nữ';
    return 'Khác';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Không rõ';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải thông tin bác sĩ...</Text>
      </View>
    );
  }

  if (error || !doctor) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error || 'Không tìm thấy bác sĩ'}</Text>
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
        <Text style={styles.headerTitle}>Thông tin bác sĩ</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Doctor Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <FontAwesome name="user-md" size={60} color="#0066cc" />
          </View>
          <Text style={styles.doctorName}>
            {doctor.title} {doctor.fullName}
          </Text>
          <Text style={styles.department}>{doctor.department}</Text>
          
          <View style={styles.experienceBadge}>
            <FontAwesome name="briefcase" size={14} color="#fff" />
            <Text style={styles.experienceText}>
              {doctor.yearsOfExperience} năm kinh nghiệm
            </Text>
          </View>
        </View>

        {/* Specialties */}
        {doctor.specialties && doctor.specialties.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome name="stethoscope" size={18} color="#333" />
              <Text style={styles.sectionTitle}>Chuyên khoa</Text>
            </View>
            <View style={styles.specialtiesContainer}>
              {doctor.specialties.map((specialty) => (
                <View key={specialty.id} style={styles.specialtyTag}>
                  <Text style={styles.specialtyTagText}>{specialty.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        {doctor.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome name="info-circle" size={18} color="#333" />
              <Text style={styles.sectionTitle}>Giới thiệu</Text>
            </View>
            <Text style={styles.description}>{doctor.description}</Text>
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="address-card" size={18} color="#333" />
            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          </View>
          
          <View style={styles.infoRow}>
            <FontAwesome name="envelope" size={16} color="#666" />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{doctor.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="phone" size={16} color="#666" />
            <Text style={styles.infoLabel}>Điện thoại:</Text>
            <Text style={styles.infoValue}>{doctor.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome name="venus-mars" size={16} color="#666" />
            <Text style={styles.infoLabel}>Giới tính:</Text>
            <Text style={styles.infoValue}>{getGenderText(doctor.gender)}</Text>
          </View>

          {doctor.dateOfBirth && (
            <View style={styles.infoRow}>
              <FontAwesome name="birthday-cake" size={16} color="#666" />
              <Text style={styles.infoLabel}>Ngày sinh:</Text>
              <Text style={styles.infoValue}>{formatDate(doctor.dateOfBirth)}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              router.push(`/book-appointment/${doctor.publicId}` as any);
            }}
          >
            <FontAwesome name="calendar-plus-o" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Đặt lịch khám</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // TODO: Call doctor
              console.log('Call doctor:', doctor.phone);
            }}
          >
            <FontAwesome name="phone" size={20} color="#0066cc" />
            <Text style={styles.secondaryButtonText}>Gọi điện</Text>
          </TouchableOpacity>
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
  profileCard: {
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
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  department: {
    fontSize: 16,
    color: '#0066cc',
    textAlign: 'center',
    marginBottom: 12,
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  experienceText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyTagText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 20,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0066cc',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
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
});

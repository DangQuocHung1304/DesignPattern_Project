import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import api from '../../src/services/api';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    patients: 1000,
    doctors: 50,
    specialties: 10,
    rating: 4.9,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [specialtiesResponse, doctorsResponse] = await Promise.all([
        api.get('/specialties'),
        api.get('/doctors')
      ]);

      setSpecialties(specialtiesResponse.data.slice(0, 6));
      setDoctors(doctorsResponse.data.slice(0, 4));
      
      // Update stats with real data
      setStats({
        patients: 1000,
        doctors: doctorsResponse.data.length || 50,
        specialties: specialtiesResponse.data.length || 10,
        rating: 4.9,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const quickActions = [
    {
      title: 'Đặt lịch khám',
      icon: 'calendar-plus-o',
      color: '#0066cc',
      onPress: () => router.push('/doctors'),
    },
    {
      title: 'Lịch hẹn',
      icon: 'calendar',
      color: '#00a86b',
      onPress: () => router.push('/appointments'),
    },
    {
      title: 'Bác sĩ',
      icon: 'user-md',
      color: '#ff6b35',
      onPress: () => router.push('/doctors'),
    },
    {
      title: 'Hồ sơ',
      icon: 'user',
      color: '#6c5ce7',
      onPress: () => router.push('/profile'),
    },
  ];

  const renderQuickAction = (action: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.quickActionCard}
      onPress={action.onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
        <FontAwesome name={action.icon} size={24} color="white" />
      </View>
      <Text style={styles.quickActionText}>{action.title}</Text>
    </TouchableOpacity>
  );

  const renderSpecialtyCard = (specialty: any, index: number) => (
    <TouchableOpacity
      key={specialty.id || index}
      style={styles.specialtyCard}
      onPress={() => router.push(`/specialty-detail/${specialty.id}` as any)}
    >
      <View style={styles.specialtyIcon}>
        <FontAwesome name={getSpecialtyIcon(specialty.name)} size={20} color="#0066cc" />
      </View>
      <Text style={styles.specialtyName} numberOfLines={2}>
        {specialty.name}
      </Text>
    </TouchableOpacity>
  );

  const renderDoctorCard = (doctor: any, index: number) => (
    <TouchableOpacity
      key={doctor.id || index}
      style={styles.doctorCard}
      onPress={() => router.push(`/doctor-detail/${doctor.publicId}` as any)}
    >
      <View style={styles.doctorAvatar}>
        <FontAwesome name="user-md" size={24} color="#0066cc" />
      </View>
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName} numberOfLines={1}>
          {doctor.title || 'BS.'} {doctor.fullName}
        </Text>
        <Text style={styles.doctorSpecialty} numberOfLines={1}>
          {doctor.department || 'Chưa xác định'}
        </Text>
        {doctor.yearsOfExperience && (
          <Text style={styles.doctorExperience}>
            <FontAwesome name="briefcase" size={12} color="#666" /> {doctor.yearsOfExperience} năm kinh nghiệm
          </Text>
        )}
      </View>
      <FontAwesome name="chevron-right" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào,</Text>
          <Text style={styles.userName}>{(user as any)?.fullName || (user as any)?.name || 'Bạn'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <FontAwesome name="bell" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>

      {/* Welcome Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Chăm sóc sức khỏe</Text>
          <Text style={styles.bannerSubtitle}>
            Đặt lịch khám với bác sĩ chuyên khoa
          </Text>
        </View>
        <View style={styles.bannerIcon}>
          <FontAwesome name="heartbeat" size={40} color="white" />
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <FontAwesome name="users" size={24} color="#0066cc" />
          <Text style={styles.statNumber}>{stats.patients}+</Text>
          <Text style={styles.statLabel}>Bệnh nhân</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome name="user-md" size={24} color="#00a86b" />
          <Text style={styles.statNumber}>{stats.doctors}+</Text>
          <Text style={styles.statLabel}>Bác sĩ</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome name="hospital-o" size={24} color="#ff6b35" />
          <Text style={styles.statNumber}>{stats.specialties}+</Text>
          <Text style={styles.statLabel}>Chuyên khoa</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome name="star" size={24} color="#ffc107" />
          <Text style={styles.statNumber}>{stats.rating}</Text>
          <Text style={styles.statLabel}>Đánh giá</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Truy cập nhanh</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => renderQuickAction(action, index))}
        </View>
      </View>

      {/* Specialties */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chuyên khoa</Text>
          <TouchableOpacity onPress={() => router.push('/specialties')}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.horizontalList}>
            {specialties.map((specialty, index) =>
              renderSpecialtyCard(specialty, index)
            )}
          </View>
        </ScrollView>
      </View>

      {/* Doctors */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bác sĩ nổi bật</Text>
          <TouchableOpacity onPress={() => router.push('/doctors')}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View>
          {doctors.map((doctor, index) => renderDoctorCard(doctor, index))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  notificationButton: {
    padding: 10,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#0066cc',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bannerIcon: {
    marginLeft: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 15,
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  horizontalList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  specialtyCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 15,
    width: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  specialtyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialtyName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
  },
  doctorExperience: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
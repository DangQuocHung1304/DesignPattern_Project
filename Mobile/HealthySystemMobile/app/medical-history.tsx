import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../src/services/api';

interface Appointment {
  id: string;
  appointmentStart: string;
  appointmentEnd?: string;
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  isEmergency: boolean;
  patient?: {
    id: number;
    publicId: string;
    fullName: string;
    phone: string;
    email: string;
  };
  doctor: {
    id: number;
    publicId: string;
    fullName: string;
    title: string;
    department: string;
    specialties?: { id: number; name: string }[];
  };
  createdDate: string;
  updatedDate?: string;
}

export default function MedicalHistoryScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data || []);
    } catch (error: any) {
      console.error('Error loading appointments:', error);
      
      // Xử lý 401 Unauthorized (chưa đăng nhập)
      if (error.response?.status === 401) {
        console.log('User not logged in - showing empty state');
      }
      // Xử lý 404 (không có dữ liệu)
      else if (error.response?.status === 404) {
        console.log('No appointments found');
      }
      
      // Luôn hiển thị empty state, không alert
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return '#28a745';
      case 'Pending':
        return '#ffc107';
      case 'Completed':
        return '#6c757d';
      case 'Cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'Đã xác nhận';
      case 'Pending':
        return 'Chờ xác nhận';
      case 'Completed':
        return 'Đã hoàn thành';
      case 'Cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  const renderAppointmentCard = ({ item }: { item: Appointment }) => {
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    return (
      <View style={styles.card}>
        {/* Header with Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <FontAwesome name="calendar" size={18} color="#0066cc" />
            <Text style={styles.dateTime}>
              {formatDateTime(item.appointmentStart)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        {/* Doctor Info */}
        <View style={styles.doctorInfo}>
          <View style={styles.doctorAvatar}>
            <FontAwesome name="user-md" size={24} color="#0066cc" />
          </View>
          <View style={styles.doctorDetails}>
            <Text style={styles.doctorName}>
              {item.doctor.title} {item.doctor.fullName}
            </Text>
            <Text style={styles.department}>{item.doctor.department}</Text>
          </View>
        </View>

        {/* Notes */}
        {item.notes && (
          <View style={styles.notesSection}>
            <FontAwesome name="file-text-o" size={14} color="#666" />
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}

        {/* Emergency Badge */}
        {item.isEmergency && (
          <View style={styles.emergencyBadge}>
            <FontAwesome name="warning" size={14} color="#ff4757" />
            <Text style={styles.emergencyText}>Khám cấp cứu</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Thông báo', 'Xem chi tiết lịch khám')}
          >
            <FontAwesome name="info-circle" size={16} color="#0066cc" />
            <Text style={styles.actionButtonText}>Chi tiết</Text>
          </TouchableOpacity>

          {item.status === 'Pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() =>
                Alert.alert(
                  'Hủy lịch khám',
                  'Bạn có chắc chắn muốn hủy lịch khám này?',
                  [
                    { text: 'Không', style: 'cancel' },
                    {
                      text: 'Hủy lịch',
                      style: 'destructive',
                      onPress: () =>
                        Alert.alert('Thông báo', 'Chức năng đang phát triển'),
                    },
                  ]
                )
              }
            >
              <FontAwesome name="times-circle" size={16} color="#ff4757" />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Hủy lịch
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="calendar-times-o" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Chưa có lịch sử khám</Text>
      <Text style={styles.emptySubtitle}>
        Bạn chưa có lịch hẹn nào trong hệ thống
      </Text>
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => router.push('/(tabs)/doctors')}
      >
        <FontAwesome name="plus" size={16} color="white" />
        <Text style={styles.bookButtonText}>Đặt lịch khám ngay</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải lịch sử khám...</Text>
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
          <FontAwesome name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử khám</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Appointment List */}
      <FlatList
        data={appointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          appointments.length === 0
            ? styles.emptyListContent
            : styles.listContent
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0066cc']}
          />
        }
      />

      {/* Stats Footer */}
      {appointments.length > 0 && (
        <View style={styles.statsFooter}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Tổng lịch hẹn</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {
                appointments.filter((a) => a.status === 'Completed').length
              }
            </Text>
            <Text style={styles.statLabel}>Đã hoàn thành</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {appointments.filter((a) => a.status === 'Pending').length}
            </Text>
            <Text style={styles.statLabel}>Chờ xác nhận</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 15,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    color: '#666',
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    lineHeight: 20,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffe5e5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  emergencyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff4757',
    marginLeft: 6,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    marginRight: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066cc',
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: '#ffe5e5',
  },
  cancelButtonText: {
    color: '#ff4757',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  statsFooter: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
});

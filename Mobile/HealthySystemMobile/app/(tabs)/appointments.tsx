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
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../src/services/api';

interface Appointment {
  id: number;
  appointmentStart: string;
  appointmentEnd: string;
  status: string;
  notes?: string;
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
    specialties: { id: number; name: string }[];
  };
  createdDate: string;
  updatedDate?: string;
}

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setError(null);
      const response = await api.get('/appointments');
      console.log('Appointments fetched:', response.data);
      setAppointments(response.data || []);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      
      // Xử lý 401 Unauthorized (chưa đăng nhập)
      if (err.response?.status === 401) {
        setError('Vui lòng đăng nhập để xem lịch hẹn');
        setAppointments([]);
      }
      // Xử lý 404 (không có dữ liệu) - không hiển thị lỗi
      else if (err.response?.status === 404) {
        setAppointments([]);
      }
      // Các lỗi khác
      else {
        setError(err.response?.data?.message || 'Không thể tải lịch hẹn');
        setAppointments([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return '#0066cc';
      case 'confirmed':
        return '#00cc66';
      case 'completed':
        return '#666';
      case 'cancelled':
        return '#ff4444';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'Đã đặt';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const renderAppointment = ({ item }: { item: Appointment }) => {
    const startTime = formatDateTime(item.appointmentStart);
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.appointmentCard}
        activeOpacity={0.7}
        onPress={() => {
          // TODO: Navigate to appointment detail
          console.log('View appointment:', item.id);
        }}
      >
        {item.isEmergency && (
          <View style={styles.emergencyBadge}>
            <FontAwesome name="exclamation-circle" size={12} color="#fff" />
            <Text style={styles.emergencyText}>Khẩn cấp</Text>
          </View>
        )}

        <View style={styles.appointmentHeader}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateBox}>
              <FontAwesome name="calendar" size={16} color="#0066cc" />
              <Text style={styles.dateText}>{startTime.date}</Text>
            </View>
            <View style={styles.timeBox}>
              <FontAwesome name="clock-o" size={16} color="#0066cc" />
              <Text style={styles.timeText}>{startTime.time}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.doctorSection}>
          <View style={styles.doctorAvatar}>
            <FontAwesome name="user-md" size={24} color="#0066cc" />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>
              {item.doctor.title} {item.doctor.fullName}
            </Text>
            <Text style={styles.doctorDepartment}>{item.doctor.department}</Text>
            {item.doctor.specialties.length > 0 && (
              <View style={styles.specialtiesRow}>
                {item.doctor.specialties.slice(0, 2).map((specialty) => (
                  <View key={specialty.id} style={styles.specialtyTag}>
                    <Text style={styles.specialtyTagText}>{specialty.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {item.notes && (
          <>
            <View style={styles.divider} />
            <View style={styles.notesSection}>
              <FontAwesome name="file-text-o" size={14} color="#666" />
              <Text style={styles.notesText} numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAppointments}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch hẹn</Text>
        <Text style={styles.headerSubtitle}>
          {appointments.length} cuộc hẹn
        </Text>
      </View>

      <FlatList
        data={appointments}
        renderItem={renderAppointment}
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
            <FontAwesome name="calendar-times-o" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có lịch hẹn nào</Text>
            <Text style={styles.emptySubtext}>
              Hãy đặt lịch khám với bác sĩ của chúng tôi
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/(tabs)/doctors' as any)}
            >
              <FontAwesome name="plus" size={16} color="white" />
              <Text style={styles.bookButtonText}>Đặt lịch khám ngay</Text>
            </TouchableOpacity>
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
  appointmentCard: {
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
  emergencyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  emergencyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
    gap: 8,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 15,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  doctorSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  doctorDepartment: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 6,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyTag: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  specialtyTagText: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '500',
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  notesText: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#bbb',
    marginBottom: 30,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
});
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

  const handleCancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Xác nhận hủy lịch',
      `Bạn có chắc muốn hủy lịch hẹn với ${appointment.doctor.title} ${appointment.doctor.fullName}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/appointments/${appointment.id}`);
              Alert.alert('Thành công', 'Đã hủy lịch hẹn');
              fetchAppointments();
            } catch (err: any) {
              console.error('Error canceling appointment:', err);
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể hủy lịch hẹn');
            }
          },
        },
      ]
    );
  };

  const handleRescheduleAppointment = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(new Date(appointment.appointmentStart));
    setShowRescheduleModal(true);
    
    // Load available slots for this doctor
    try {
      setLoadingSlots(true);
      const date = new Date(appointment.appointmentStart).toISOString().split('T')[0];
      const response = await api.get(`/doctors/${appointment.doctor.publicId}/available-slots`, {
        params: { date }
      });
      setAvailableSlots(response.data || []);
    } catch (err) {
      console.error('Error loading slots:', err);
      Alert.alert('Lỗi', 'Không thể tải lịch trống');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmReschedule = async (newSlot: any) => {
    if (!selectedAppointment) return;

    Alert.alert(
      'Xác nhận đổi giờ',
      `Đổi sang ${newSlot.time} ngày ${selectedDate.toLocaleDateString('vi-VN')}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await api.put(`/appointments/${selectedAppointment.id}/status`, {
                status: 'scheduled',
                notes: `Đã đổi lịch sang ${newSlot.time}`,
              });
              
              // Create new appointment with new time
              await api.post('/appointments', {
                patientPublicId: selectedAppointment.patient?.publicId,
                doctorPublicId: selectedAppointment.doctor.publicId,
                appointmentStart: newSlot.startTime,
                appointmentEnd: newSlot.endTime,
                notes: selectedAppointment.notes,
                isEmergency: selectedAppointment.isEmergency,
              });

              // Cancel old appointment
              await api.delete(`/appointments/${selectedAppointment.id}`);

              Alert.alert('Thành công', 'Đã đổi giờ hẹn');
              setShowRescheduleModal(false);
              fetchAppointments();
            } catch (err: any) {
              console.error('Error rescheduling:', err);
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể đổi giờ hẹn');
            }
          },
        },
      ]
    );
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

        {/* Action Buttons - Only show for scheduled/confirmed appointments */}
        {(item.status.toLowerCase() === 'scheduled' || item.status.toLowerCase() === 'confirmed') && (
          <>
            <View style={styles.divider} />
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleRescheduleAppointment(item)}
              >
                <FontAwesome name="calendar" size={16} color="#0066cc" />
                <Text style={styles.actionButtonText}>Đổi giờ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancelAppointment(item)}
              >
                <FontAwesome name="times-circle" size={16} color="#ff4444" />
                <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Hủy lịch</Text>
              </TouchableOpacity>
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
        keyExtractor={(item, index) => item?.id?.toString() || `appointment-${index}`}
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

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRescheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn giờ khám mới</Text>
              <TouchableOpacity onPress={() => setShowRescheduleModal(false)}>
                <FontAwesome name="times" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <View style={styles.modalDoctorInfo}>
                <FontAwesome name="user-md" size={20} color="#0066cc" />
                <Text style={styles.modalDoctorText}>
                  {selectedAppointment.doctor.title} {selectedAppointment.doctor.fullName}
                </Text>
              </View>
            )}

            <ScrollView style={styles.slotsContainer}>
              {loadingSlots ? (
                <ActivityIndicator size="large" color="#0066cc" style={styles.modalLoading} />
              ) : availableSlots.length === 0 ? (
                <View style={styles.noSlotsContainer}>
                  <FontAwesome name="calendar-times-o" size={48} color="#ccc" />
                  <Text style={styles.noSlotsText}>Không có lịch trống</Text>
                </View>
              ) : (
                availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.slotItem,
                      !slot.available && styles.slotItemDisabled
                    ]}
                    disabled={!slot.available}
                    onPress={() => handleConfirmReschedule(slot)}
                  >
                    <View style={styles.slotInfo}>
                      <FontAwesome name="clock-o" size={16} color={slot.available ? "#0066cc" : "#ccc"} />
                      <Text style={[
                        styles.slotTime,
                        !slot.available && styles.slotTimeDisabled
                      ]}>
                        {slot.time}
                      </Text>
                    </View>
                    {!slot.available && (
                      <Text style={styles.slotUnavailable}>Đã đặt</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRescheduleModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
    backgroundColor: '#fff',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  cancelButton: {
    borderColor: '#ff4444',
  },
  cancelButtonText: {
    color: '#ff4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDoctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    gap: 10,
  },
  modalDoctorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  slotsContainer: {
    maxHeight: 400,
    padding: 16,
  },
  modalLoading: {
    marginVertical: 40,
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSlotsText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  slotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
  },
  slotItemDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  slotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  slotTimeDisabled: {
    color: '#999',
  },
  slotUnavailable: {
    fontSize: 14,
    color: '#999',
  },
  modalCloseButton: {
    margin: 16,
    backgroundColor: '#e0e0e0',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
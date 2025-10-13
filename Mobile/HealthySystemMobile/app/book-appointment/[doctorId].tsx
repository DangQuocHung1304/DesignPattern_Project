import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../src/services/api';

interface Doctor {
  id: number;
  publicId: string;
  fullName: string;
  title: string;
  department: string;
  specialties: { id: number; name: string }[];
}

export default function BookAppointmentScreen() {
  const { doctorId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Available time slots
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/${doctorId}`);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin bác sĩ');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedTime) {
      Alert.alert('Thông báo', 'Vui lòng chọn giờ khám');
      return;
    }

    try {
      setSubmitting(true);

      // Create appointment datetime
      const [hours, minutes] = selectedTime.split(':');
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0);

      const appointmentData = {
        doctorPublicId: doctorId,
        appointmentStart: appointmentDate.toISOString(),
        notes: notes || null,
        isEmergency,
      };

      await api.post('/appointments', appointmentData);

      Alert.alert(
        'Thành công',
        'Đặt lịch khám thành công! Vui lòng chờ xác nhận từ bác sĩ.',
        [
          {
            text: 'Xem lịch hẹn',
            onPress: () => router.push('/appointments'),
          },
          {
            text: 'Về trang chủ',
            onPress: () => router.push('/'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      const errorMessage = error.response?.data?.message || 'Không thể đặt lịch khám. Vui lòng thử lại.';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={64} color="#ccc" />
        <Text style={styles.errorText}>Không tìm thấy thông tin bác sĩ</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={20} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch khám</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor Info Card */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorAvatar}>
            <FontAwesome name="user-md" size={32} color="#0066cc" />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>
              {doctor.title} {doctor.fullName}
            </Text>
            <Text style={styles.doctorDepartment}>{doctor.department}</Text>
            {doctor.specialties && doctor.specialties.length > 0 && (
              <View style={styles.specialtiesRow}>
                {doctor.specialties.slice(0, 2).map((specialty) => (
                  <View key={specialty.id} style={styles.specialtyBadge}>
                    <Text style={styles.specialtyText}>{specialty.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <FontAwesome name="calendar" size={16} color="#0066cc" /> Chọn ngày khám
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <FontAwesome name="calendar-o" size={20} color="#0066cc" />
            <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
            <FontAwesome name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <FontAwesome name="clock-o" size={16} color="#0066cc" /> Chọn giờ khám
          </Text>
          <View style={styles.timeSlotsContainer}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.timeSlotSelected,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    selectedTime === time && styles.timeSlotTextSelected,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Emergency Toggle */}
        <TouchableOpacity
          style={styles.emergencyToggle}
          onPress={() => setIsEmergency(!isEmergency)}
        >
          <View style={styles.emergencyInfo}>
            <FontAwesome
              name="exclamation-triangle"
              size={20}
              color={isEmergency ? '#ff6b35' : '#666'}
            />
            <Text style={styles.emergencyText}>Khám cấp cứu</Text>
          </View>
          <View
            style={[
              styles.toggle,
              isEmergency && styles.toggleActive,
            ]}
          >
            <View
              style={[
                styles.toggleCircle,
                isEmergency && styles.toggleCircleActive,
              ]}
            />
          </View>
        </TouchableOpacity>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <FontAwesome name="file-text-o" size={16} color="#0066cc" /> Ghi chú (không bắt buộc)
          </Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Mô tả triệu chứng hoặc lý do khám..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Thông tin đặt lịch</Text>
          <View style={styles.summaryRow}>
            <FontAwesome name="user-md" size={16} color="#666" />
            <Text style={styles.summaryText}>
              {doctor.title} {doctor.fullName}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <FontAwesome name="calendar" size={16} color="#666" />
            <Text style={styles.summaryText}>{formatDate(selectedDate)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <FontAwesome name="clock-o" size={16} color="#666" />
            <Text style={styles.summaryText}>
              {selectedTime || 'Chưa chọn giờ'}
            </Text>
          </View>
          {isEmergency && (
            <View style={[styles.summaryRow, styles.emergencyRow]}>
              <FontAwesome name="exclamation-triangle" size={16} color="#ff6b35" />
              <Text style={styles.emergencyBadgeText}>Khám cấp cứu</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <FontAwesome name="calendar-check-o" size={20} color="white" />
              <Text style={styles.submitButtonText}>Xác nhận đặt lịch</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  doctorDepartment: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyBadge: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 5,
    marginTop: 5,
  },
  specialtyText: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '500',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: 'white',
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: 'white',
  },
  emergencyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emergencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#ff6b35',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 15,
    fontSize: 15,
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 204, 0.2)',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  emergencyRow: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  emergencyBadgeText: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

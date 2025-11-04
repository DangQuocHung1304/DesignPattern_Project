// Firestore API Service - Thay thế cho SQL Server API
import { db, auth } from './firebase-init.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class FirestoreAPI {
  constructor() {
    this.db = db;
    this.auth = auth;
  }

  // ==================== USERS ====================
  
  async getUser(userId) {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const q = query(collection(this.db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const docRef = await addDoc(collection(this.db, 'users'), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId, userData) {
    try {
      await updateDoc(doc(this.db, 'users', userId), {
        ...userData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // ==================== APPOINTMENTS ====================
  
  async getAppointmentsByDoctor(doctorId, statusFilter = null) {
    try {
      let q;
      if (statusFilter) {
        q = query(
          collection(this.db, 'appointments'),
          where('doctorId', '==', doctorId),
          where('status', '==', statusFilter),
          orderBy('appointmentStart', 'asc')
        );
      } else {
        q = query(
          collection(this.db, 'appointments'),
          where('doctorId', '==', doctorId),
          orderBy('appointmentStart', 'asc')
        );
      }
      
      const snapshot = await getDocs(q);
      const appointments = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to JS Date
          appointmentStart: data.appointmentStart?.toDate(),
          appointmentEnd: data.appointmentEnd?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        });
      });
      
      return appointments;
    } catch (error) {
      console.error('Error getting doctor appointments:', error);
      throw error;
    }
  }

  async getAppointmentsByPatient(patientId) {
    try {
      const q = query(
        collection(this.db, 'appointments'),
        where('patientId', '==', patientId),
        orderBy('appointmentStart', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const appointments = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          ...data,
          appointmentStart: data.appointmentStart?.toDate(),
          appointmentEnd: data.appointmentEnd?.toDate()
        });
      });
      
      return appointments;
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      throw error;
    }
  }

  async createAppointment(appointmentData) {
    try {
      // Convert JS Date to Firestore Timestamp
      const data = {
        ...appointmentData,
        appointmentStart: Timestamp.fromDate(new Date(appointmentData.appointmentStart)),
        appointmentEnd: Timestamp.fromDate(new Date(appointmentData.appointmentEnd)),
        status: appointmentData.status || 'scheduled',
        reminderSent: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(this.db, 'appointments'), data);
      return docRef.id;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(appointmentId, updates) {
    try {
      const data = { ...updates, updatedAt: serverTimestamp() };
      
      // Convert dates if present
      if (updates.appointmentStart) {
        data.appointmentStart = Timestamp.fromDate(new Date(updates.appointmentStart));
      }
      if (updates.appointmentEnd) {
        data.appointmentEnd = Timestamp.fromDate(new Date(updates.appointmentEnd));
      }
      
      await updateDoc(doc(this.db, 'appointments', appointmentId), data);
      
      // Log to history subcollection
      await addDoc(collection(this.db, 'appointments', appointmentId, 'history'), {
        ...updates,
        changedAt: serverTimestamp(),
        changedBy: this.auth.currentUser?.uid || null
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async cancelAppointment(appointmentId, reason) {
    try {
      await this.updateAppointment(appointmentId, {
        status: 'cancelled',
        cancellationReason: reason
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  // ==================== SPECIALTIES ====================
  
  async getAllSpecialties() {
    try {
      const snapshot = await getDocs(collection(this.db, 'specialties'));
      const specialties = [];
      
      snapshot.forEach(doc => {
        specialties.push({ id: doc.id, ...doc.data() });
      });
      
      return specialties;
    } catch (error) {
      console.error('Error getting specialties:', error);
      throw error;
    }
  }

  // ==================== SERVICES ====================
  
  async getAllServices() {
    try {
      const snapshot = await getDocs(collection(this.db, 'services'));
      const services = [];
      
      snapshot.forEach(doc => {
        services.push({ id: doc.id, ...doc.data() });
      });
      
      return services;
    } catch (error) {
      console.error('Error getting services:', error);
      throw error;
    }
  }

  // ==================== INVOICES ====================
  
  async getInvoicesByPatient(patientId) {
    try {
      const q = query(
        collection(this.db, 'invoices'),
        where('patientId', '==', patientId),
        orderBy('issuedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const invoices = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        invoices.push({
          id: doc.id,
          ...data,
          issuedAt: data.issuedAt?.toDate()
        });
      });
      
      return invoices;
    } catch (error) {
      console.error('Error getting patient invoices:', error);
      throw error;
    }
  }

  // ==================== ENCOUNTERS ====================
  
  async getEncountersByPatient(patientId) {
    try {
      const q = query(
        collection(this.db, 'encounters'),
        where('patientId', '==', patientId),
        orderBy('visitDatetime', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const encounters = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        encounters.push({
          id: doc.id,
          ...data,
          visitDatetime: data.visitDatetime?.toDate()
        });
      });
      
      return encounters;
    } catch (error) {
      console.error('Error getting patient encounters:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================
  
  getCurrentUserId() {
    return this.auth.currentUser?.uid || null;
  }

  async getCurrentUser() {
    const userId = this.getCurrentUserId();
    if (!userId) return null;
    return await this.getUser(userId);
  }
}

// Export singleton instance
const firestoreAPI = new FirestoreAPI();
export default firestoreAPI;

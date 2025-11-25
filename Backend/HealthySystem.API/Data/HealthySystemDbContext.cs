using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Models;

namespace HealthySystem.API.Data
{
    public class HealthySystemDbContext : DbContext
    {
        public HealthySystemDbContext(DbContextOptions<HealthySystemDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<PatientProfile> PatientProfiles { get; set; }
        public DbSet<StaffProfile> StaffProfiles { get; set; }
        public DbSet<Specialty> Specialties { get; set; }
        public DbSet<DoctorSpecialty> DoctorSpecialties { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Encounter> Encounters { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<PrescriptionItem> PrescriptionItems { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<LabRequest> LabRequests { get; set; }
        public DbSet<LabResult> LabResults { get; set; }
        public DbSet<ImagingRequest> ImagingRequests { get; set; }
        public DbSet<ImagingResult> ImagingResults { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<AppointmentHistory> AppointmentHistory { get; set; }
        public DbSet<WalkInPatient> WalkInPatients { get; set; }
        public DbSet<Treatment> Treatments { get; set; }
        public DbSet<TreatmentItem> TreatmentItems { get; set; }
        public DbSet<DoctorSchedule> DoctorSchedules { get; set; }
        public DbSet<HealthNews> HealthNews { get; set; }
        public DbSet<ServicePrice> ServicePrices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure composite key for DoctorSpecialty
            modelBuilder.Entity<DoctorSpecialty>()
                .HasKey(ds => new { ds.DoctorUserId, ds.SpecialtyId });

            // Configure User relationships
            modelBuilder.Entity<User>()
                .HasOne(u => u.PatientProfile)
                .WithOne(p => p.User)
                .HasForeignKey<PatientProfile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasOne(u => u.StaffProfile)
                .WithOne(s => s.User)
                .HasForeignKey<StaffProfile>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Appointment relationships
            // NOTE: Removed all triggers - validation now done in application code
            
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Patient)
                .WithMany(u => u.PatientAppointments)
                .HasForeignKey(a => a.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.Doctor)
                .WithMany(u => u.DoctorAppointments)
                .HasForeignKey(a => a.DoctorId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.CreatedByUser)
                .WithMany()
                .HasForeignKey(a => a.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.RescheduledFromAppointment)
                .WithMany(a => a.RescheduledAppointments)
                .HasForeignKey(a => a.RescheduledFromAppointmentId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configure DoctorSpecialty relationships
            modelBuilder.Entity<DoctorSpecialty>()
                .HasOne(ds => ds.Doctor)
                .WithMany(u => u.DoctorSpecialties)
                .HasForeignKey(ds => ds.DoctorUserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DoctorSpecialty>()
                .HasOne(ds => ds.Specialty)
                .WithMany(s => s.DoctorSpecialties)
                .HasForeignKey(ds => ds.SpecialtyId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure Rating relationships
            modelBuilder.Entity<Rating>()
                .HasOne(r => r.Patient)
                .WithMany(u => u.PatientRatings)
                .HasForeignKey(r => r.PatientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Rating>()
                .HasOne(r => r.Doctor)
                .WithMany(u => u.DoctorRatings)
                .HasForeignKey(r => r.DoctorId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Rating>()
                .HasOne(r => r.Service)
                .WithMany(s => s.Ratings)
                .HasForeignKey(r => r.ServiceId)
                .OnDelete(DeleteBehavior.NoAction);

            // Configure unique constraints
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.PublicId)
                .IsUnique();

            modelBuilder.Entity<PatientProfile>()
                .HasIndex(p => p.MedicalRecordNumber)
                .IsUnique();

            modelBuilder.Entity<StaffProfile>()
                .HasIndex(s => s.StaffCode)
                .IsUnique();

            modelBuilder.Entity<Specialty>()
                .HasIndex(s => s.Name)
                .IsUnique();

            modelBuilder.Entity<Service>()
                .HasIndex(s => s.Code)
                .IsUnique();

            // Configure indexes for performance
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Phone);

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => new { a.DoctorId, a.AppointmentStart });

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => new { a.PatientId, a.AppointmentStart });

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.Status);

            // Walk-in patient relationship
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.WalkInPatient)
                .WithMany(w => w.Appointments)
                .HasForeignKey(a => a.WalkInPatientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasIndex(a => a.WalkInPatientId);

            // WalkInPatient indexes
            modelBuilder.Entity<WalkInPatient>()
                .HasIndex(w => w.Phone);

            modelBuilder.Entity<WalkInPatient>()
                .HasIndex(w => w.PublicId)
                .IsUnique();

            modelBuilder.Entity<WalkInPatient>()
                .HasIndex(w => w.MedicalRecordNumber)
                .IsUnique();

            modelBuilder.Entity<Invoice>()
                .HasIndex(i => i.PatientId);

            // Configure DoctorSchedule relationships
            modelBuilder.Entity<DoctorSchedule>()
                .HasOne(ds => ds.Doctor)
                .WithMany()
                .HasForeignKey(ds => ds.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Create unique constraint for doctor schedule (using ScheduleDate instead of DayOfWeek)
            modelBuilder.Entity<DoctorSchedule>()
                .HasIndex(ds => new { ds.DoctorId, ds.ScheduleDate, ds.StartTime })
                .IsUnique()
                .HasDatabaseName("UQ_doctor_schedule");

            // Create index for performance
            modelBuilder.Entity<DoctorSchedule>()
                .HasIndex(ds => ds.DoctorId)
                .HasDatabaseName("IX_doctor_schedules_doctor_id");

            modelBuilder.Entity<DoctorSchedule>()
                .HasIndex(ds => ds.ScheduleDate)
                .HasDatabaseName("IX_doctor_schedules_schedule_date");

            modelBuilder.Entity<DoctorSchedule>()
                .HasIndex(ds => ds.IsAvailable)
                .HasDatabaseName("IX_doctor_schedules_is_available");
        }
    }
}
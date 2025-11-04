using Microsoft.EntityFrameworkCore;
using HealthySystem.API.Models;

namespace HealthySystem.WebAPI.Data
{
    // Alias for HealthySystemDbContext to use in WebAPI project
    public class ApplicationDbContext : HealthySystem.API.Data.HealthySystemDbContext
    {
        public ApplicationDbContext(DbContextOptions<HealthySystemDbContext> options) : base(options)
        {
        }

        // Add new DbSet for DoctorSchedule
        public DbSet<DoctorSchedule> DoctorSchedules { get; set; }

        // Additional entities specific to Sprint 8-10
        public DbSet<Encounter> Encounters { get; set; }
        public DbSet<LabRequest> LabRequests { get; set; }
        public DbSet<LabResult> LabResults { get; set; }
        public DbSet<ImagingRequest> ImagingRequests { get; set; }
        public DbSet<ImagingResult> ImagingResults { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<PrescriptionItem> PrescriptionItems { get; set; }
        public DbSet<Treatment> Treatments { get; set; }
        public DbSet<TreatmentItem> TreatmentItems { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<PatientProfile> Patients { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure DoctorSchedule entity
            modelBuilder.Entity<DoctorSchedule>()
                .HasOne(ds => ds.Doctor)
                .WithMany()
                .HasForeignKey(ds => ds.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Create unique constraint for doctor schedule
            modelBuilder.Entity<DoctorSchedule>()
                .HasIndex(ds => new { ds.DoctorId, ds.DayOfWeek, ds.StartTime })
                .IsUnique()
                .HasDatabaseName("UQ_doctor_schedule");

            // Create index for performance
            modelBuilder.Entity<DoctorSchedule>()
                .HasIndex(ds => ds.DoctorId)
                .HasDatabaseName("IX_doctor_schedules_doctor_id");

            modelBuilder.Entity<DoctorSchedule>()
                .HasIndex(ds => ds.DayOfWeek)
                .HasDatabaseName("IX_doctor_schedules_day_of_week");

            modelBuilder.Entity<DoctorSchedule>()
                .HasIndex(ds => ds.IsAvailable)
                .HasDatabaseName("IX_doctor_schedules_is_available");
        }
    }
}

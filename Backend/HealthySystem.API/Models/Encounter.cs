using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("encounters")]
    public class Encounter
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("appointment_id")]
        public long? AppointmentId { get; set; }

        [Column("patient_id")]
        public long PatientId { get; set; }

        [Column("doctor_id")]
        public long? DoctorId { get; set; }

        [Column("visit_datetime")]
        public DateTimeOffset VisitDateTime { get; set; } = DateTimeOffset.UtcNow;

        [Column("chief_complaint")]
        public string? ChiefComplaint { get; set; }

        [Column("diagnosis")]
        public string? Diagnosis { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "open";

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(AppointmentId))]
        public Appointment? Appointment { get; set; }

        [ForeignKey(nameof(PatientId))]
        public User Patient { get; set; } = null!;

        [ForeignKey(nameof(DoctorId))]
        public User? Doctor { get; set; }

        public ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
        public ICollection<LabRequest> LabRequests { get; set; } = new List<LabRequest>();
        public ICollection<ImagingRequest> ImagingRequests { get; set; } = new List<ImagingRequest>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    }
}
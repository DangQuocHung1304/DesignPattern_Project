using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("appointments")]
    public class Appointment
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("patient_id")]
        public long PatientId { get; set; }

        [Column("doctor_id")]
        public long DoctorId { get; set; }

        [Column("created_by")]
        public long? CreatedBy { get; set; }

        [Column("appointment_start")]
        public DateTimeOffset AppointmentStart { get; set; }

        [Column("appointment_end")]
        public DateTimeOffset AppointmentEnd { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "scheduled"; // scheduled|confirmed|rescheduled|cancelled|completed|no_show

        [Column("source")]
        [MaxLength(50)]
        public string? Source { get; set; } // online|walk_in|phone|admin

        [Column("reason")]
        public string? Reason { get; set; }

        [Column("cancellation_reason")]
        public string? CancellationReason { get; set; }

        [Column("rescheduled_from_appointment_id")]
        public long? RescheduledFromAppointmentId { get; set; }

        [Column("reminder_sent")]
        public bool ReminderSent { get; set; } = false;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset? UpdatedAt { get; set; }

        // Additional properties for API compatibility
        [NotMapped]
        public string? Notes => Reason;

        [NotMapped]
        public bool IsEmergency => Source == "emergency";

        [NotMapped]
        public DateTime CreatedDate => CreatedAt.DateTime;

        [NotMapped]
        public DateTime UpdatedDate => UpdatedAt?.DateTime ?? CreatedAt.DateTime;

        // Navigation properties
        [ForeignKey(nameof(PatientId))]
        public User Patient { get; set; } = null!;

        [ForeignKey(nameof(DoctorId))]
        public User Doctor { get; set; } = null!;

        [ForeignKey(nameof(CreatedBy))]
        public User? CreatedByUser { get; set; }

        [ForeignKey(nameof(RescheduledFromAppointmentId))]
        public Appointment? RescheduledFromAppointment { get; set; }

        public ICollection<Appointment> RescheduledAppointments { get; set; } = new List<Appointment>();
        public ICollection<Encounter> Encounters { get; set; } = new List<Encounter>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
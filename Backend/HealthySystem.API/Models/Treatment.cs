using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("treatments")]
    public class Treatment
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("patient_id")]
        public long PatientId { get; set; }

        [Column("doctor_id")]
        public long DoctorId { get; set; }

        [Column("name")]
        [Required]
        [MaxLength(500)]
        public string Name { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("diagnosis")]
        public string? Diagnosis { get; set; }

        [Column("start_date")]
        public DateOnly StartDate { get; set; }

        [Column("end_date")]
        public DateOnly? EndDate { get; set; }

        [Column("status")]
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "active"; // active|completed|cancelled|on_hold

        [Column("progress")]
        public int Progress { get; set; } = 0; // 0-100%

        [Column("outcome")]
        public string? Outcome { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("updated_at")]
        public DateTimeOffset? UpdatedAt { get; set; }

        [Column("completed_at")]
        public DateTimeOffset? CompletedAt { get; set; }

        // Navigation properties
        [ForeignKey(nameof(PatientId))]
        public User Patient { get; set; } = null!;

        [ForeignKey(nameof(DoctorId))]
        public User Doctor { get; set; } = null!;

        public ICollection<TreatmentItem> TreatmentItems { get; set; } = new List<TreatmentItem>();
    }

    [Table("treatment_items")]
    public class TreatmentItem
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("treatment_id")]
        public long TreatmentId { get; set; }

        [Column("item_type")]
        [Required]
        [MaxLength(50)]
        public string ItemType { get; set; } = string.Empty; // medication|procedure|therapy|followup

        [Column("item_name")]
        [Required]
        [MaxLength(500)]
        public string ItemName { get; set; } = string.Empty;

        [Column("dosage")]
        [MaxLength(200)]
        public string? Dosage { get; set; }

        [Column("frequency")]
        [MaxLength(200)]
        public string? Frequency { get; set; }

        [Column("duration")]
        [MaxLength(200)]
        public string? Duration { get; set; }

        [Column("instructions")]
        public string? Instructions { get; set; }

        [Column("schedule_date")]
        public DateOnly? ScheduleDate { get; set; }

        [Column("completed")]
        public bool Completed { get; set; } = false;

        [Column("completed_at")]
        public DateTimeOffset? CompletedAt { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(TreatmentId))]
        public Treatment Treatment { get; set; } = null!;
    }
}

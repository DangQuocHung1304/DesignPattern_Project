using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("prescriptions")]
    public class Prescription
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("encounter_id")]
        public long EncounterId { get; set; }

        [Column("doctor_id")]
        public long DoctorId { get; set; }

        [Column("prescribed_at")]
        public DateTimeOffset PrescribedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("notes")]
        public string? Notes { get; set; }

        // Navigation properties
        [ForeignKey(nameof(EncounterId))]
        public Encounter Encounter { get; set; } = null!;

        [ForeignKey(nameof(DoctorId))]
        public User Doctor { get; set; } = null!;

        public ICollection<PrescriptionItem> PrescriptionItems { get; set; } = new List<PrescriptionItem>();
    }

    [Table("prescription_items")]
    public class PrescriptionItem
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("prescription_id")]
        public long PrescriptionId { get; set; }

        [Column("medicine_name")]
        [Required]
        [MaxLength(300)]
        public string MedicineName { get; set; } = string.Empty;

        [Column("dosage")]
        [MaxLength(200)]
        public string? Dosage { get; set; }

        [Column("frequency")]
        [MaxLength(200)]
        public string? Frequency { get; set; }

        [Column("duration_days")]
        public int? DurationDays { get; set; }

        [Column("instructions")]
        public string? Instructions { get; set; }

        // Navigation properties
        [ForeignKey(nameof(PrescriptionId))]
        public Prescription Prescription { get; set; } = null!;
    }
}
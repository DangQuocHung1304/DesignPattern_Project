using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("ratings")]
    public class Rating
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("patient_id")]
        public long PatientId { get; set; }

        [Column("doctor_id")]
        public long? DoctorId { get; set; }

        [Column("service_id")]
        public long? ServiceId { get; set; }

        [Column("rating")]
        [Range(1, 5)]
        public int RatingValue { get; set; }

        [Column("comment")]
        public string? Comment { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Additional properties for API compatibility
        [NotMapped]
        public DateTime CreatedDate => CreatedAt.DateTime;

        [NotMapped]
        public string? ReviewText => Comment;

        // Navigation properties
        [ForeignKey(nameof(PatientId))]
        public User Patient { get; set; } = null!;

        [ForeignKey(nameof(DoctorId))]
        public User? Doctor { get; set; }

        [ForeignKey(nameof(ServiceId))]
        public Service? Service { get; set; }
    }
}
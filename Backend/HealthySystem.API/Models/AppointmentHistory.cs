using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("appointment_history")]
    public class AppointmentHistory
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("appointment_id")]
        public long AppointmentId { get; set; }

        [Column("changed_by")]
        public long ChangedBy { get; set; }

        [Column("old_status")]
        [MaxLength(50)]
        public string? OldStatus { get; set; }

        [Column("new_status")]
        [MaxLength(50)]
        public string NewStatus { get; set; } = "";

        [Column("old_start")]
        public DateTimeOffset? OldStart { get; set; }

        [Column("new_start")]
        public DateTimeOffset? NewStart { get; set; }

        [Column("old_end")]
        public DateTimeOffset? OldEnd { get; set; }

        [Column("new_end")]
        public DateTimeOffset? NewEnd { get; set; }

        [Column("comment")]
        public string? Comment { get; set; }

        [Column("changed_at")]
        public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        [ForeignKey("AppointmentId")]
        public virtual Appointment? Appointment { get; set; }

        [ForeignKey("ChangedBy")]
        public virtual User? ChangedByUser { get; set; }
    }
}

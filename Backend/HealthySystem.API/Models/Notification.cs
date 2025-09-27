using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("notifications")]
    public class Notification
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("user_id")]
        public long UserId { get; set; }

        [Column("appointment_id")]
        public long? AppointmentId { get; set; }

        [Column("type")]
        [MaxLength(100)]
        public string? Type { get; set; } // reminder|promo|admin

        [Column("channel")]
        [MaxLength(50)]
        public string? Channel { get; set; } // push|sms|call|email

        [Column("scheduled_at")]
        public DateTimeOffset? ScheduledAt { get; set; }

        [Column("sent_at")]
        public DateTimeOffset? SentAt { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string? Status { get; set; } // pending|sent|failed

        [Column("payload")]
        public string? Payload { get; set; }

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [ForeignKey(nameof(AppointmentId))]
        public Appointment? Appointment { get; set; }
    }
}
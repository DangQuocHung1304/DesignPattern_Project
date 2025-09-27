using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("lab_requests")]
    public class LabRequest
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("encounter_id")]
        public long EncounterId { get; set; }

        [Column("requested_by")]
        public long RequestedBy { get; set; }

        [Column("requested_at")]
        public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "requested"; // requested|in_progress|completed|cancelled

        [Column("note")]
        public string? Note { get; set; }

        // Navigation properties
        [ForeignKey(nameof(EncounterId))]
        public Encounter Encounter { get; set; } = null!;

        [ForeignKey(nameof(RequestedBy))]
        public User RequestedByUser { get; set; } = null!;

        public ICollection<LabResult> LabResults { get; set; } = new List<LabResult>();
    }

    [Table("lab_results")]
    public class LabResult
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("lab_request_id")]
        public long LabRequestId { get; set; }

        [Column("test_code")]
        [MaxLength(200)]
        public string? TestCode { get; set; }

        [Column("result_text")]
        public string? ResultText { get; set; }

        [Column("result_value")]
        [MaxLength(200)]
        public string? ResultValue { get; set; }

        [Column("units")]
        [MaxLength(100)]
        public string? Units { get; set; }

        [Column("normal_range")]
        [MaxLength(200)]
        public string? NormalRange { get; set; }

        [Column("performed_by")]
        public long? PerformedBy { get; set; }

        [Column("performed_at")]
        public DateTimeOffset? PerformedAt { get; set; }

        [Column("attachment_file_id")]
        public long? AttachmentFileId { get; set; }

        // Navigation properties
        [ForeignKey(nameof(LabRequestId))]
        public LabRequest LabRequest { get; set; } = null!;

        [ForeignKey(nameof(PerformedBy))]
        public User? PerformedByUser { get; set; }
    }

    [Table("imaging_requests")]
    public class ImagingRequest
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("encounter_id")]
        public long EncounterId { get; set; }

        [Column("requested_by")]
        public long RequestedBy { get; set; }

        [Column("requested_at")]
        public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "requested";

        [Column("note")]
        public string? Note { get; set; }

        // Navigation properties
        [ForeignKey(nameof(EncounterId))]
        public Encounter Encounter { get; set; } = null!;

        [ForeignKey(nameof(RequestedBy))]
        public User RequestedByUser { get; set; } = null!;

        public ICollection<ImagingResult> ImagingResults { get; set; } = new List<ImagingResult>();
    }

    [Table("imaging_results")]
    public class ImagingResult
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("imaging_request_id")]
        public long ImagingRequestId { get; set; }

        [Column("report_text")]
        public string? ReportText { get; set; }

        [Column("performed_by")]
        public long? PerformedBy { get; set; }

        [Column("performed_at")]
        public DateTimeOffset? PerformedAt { get; set; }

        [Column("attachment_file_id")]
        public long? AttachmentFileId { get; set; }

        // Navigation properties
        [ForeignKey(nameof(ImagingRequestId))]
        public ImagingRequest ImagingRequest { get; set; } = null!;

        [ForeignKey(nameof(PerformedBy))]
        public User? PerformedByUser { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("invoices")]
    public class Invoice
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("patient_id")]
        public long PatientId { get; set; }

        [Column("encounter_id")]
        public long? EncounterId { get; set; }

        [Column("created_by")]
        public long? CreatedBy { get; set; }

        [Column("issued_at")]
        public DateTimeOffset IssuedAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("total_amount", TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; } = 0.00m;

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "unpaid"; // unpaid|paid|partial|cancelled

        // Navigation properties
        [ForeignKey(nameof(PatientId))]
        public User Patient { get; set; } = null!;

        [ForeignKey(nameof(EncounterId))]
        public Encounter? Encounter { get; set; }

        [ForeignKey(nameof(CreatedBy))]
        public User? CreatedByUser { get; set; }

        public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
        public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }

    [Table("invoice_items")]
    public class InvoiceItem
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("invoice_id")]
        public long InvoiceId { get; set; }

        [Column("service_id")]
        public long? ServiceId { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("qty")]
        public int Quantity { get; set; } = 1;

        [Column("unit_price", TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; } = 0.00m;

        [NotMapped]
        public decimal Amount => Quantity * UnitPrice;

        // Navigation properties
        [ForeignKey(nameof(InvoiceId))]
        public Invoice Invoice { get; set; } = null!;

        [ForeignKey(nameof(ServiceId))]
        public Service? Service { get; set; }
    }

    [Table("payments")]
    public class Payment
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("invoice_id")]
        public long InvoiceId { get; set; }

        [Column("paid_by")]
        public long? PaidBy { get; set; }

        [Column("amount", TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column("method")]
        [MaxLength(50)]
        public string? Method { get; set; } // cash|card|insurance|transfer

        [Column("paid_at")]
        public DateTimeOffset PaidAt { get; set; } = DateTimeOffset.UtcNow;

        [Column("reference")]
        [MaxLength(300)]
        public string? Reference { get; set; }

        // Navigation properties
        [ForeignKey(nameof(InvoiceId))]
        public Invoice Invoice { get; set; } = null!;

        [ForeignKey(nameof(PaidBy))]
        public User? PaidByUser { get; set; }
    }
}
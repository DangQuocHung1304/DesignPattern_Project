using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HealthySystem.API.Models
{
    [Table("services")]
    public class Service
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("code")]
        [MaxLength(100)]
        public string? Code { get; set; }

        [Column("name")]
        [Required]
        [MaxLength(300)]
        public string Name { get; set; } = string.Empty;

        [Column("category")]
        [MaxLength(100)]
        public string? Category { get; set; } // consultation|lab|imaging|medication

        [Column("default_price", TypeName = "decimal(18,2)")]
        public decimal DefaultPrice { get; set; } = 0.00m;

        [Column("taxable")]
        public bool Taxable { get; set; } = false;

        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // Navigation properties
        public ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
        public ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    }
}
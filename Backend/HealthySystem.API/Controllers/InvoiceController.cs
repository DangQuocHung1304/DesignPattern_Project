using HealthySystem.API.Data;
using HealthySystem.API.DesignPatterns.Adapter;
using HealthySystem.API.DesignPatterns.Decorator;
using HealthySystem.API.DesignPatterns.Strategy;
using HealthySystem.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HealthySystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin,accountant,reception")]
    public class InvoiceController : ControllerBase
    {
        private readonly HealthySystemDbContext _context;
        private readonly IInvoicePricingComposer _invoicePricingComposer;
        private readonly IPaymentProcessor _paymentProcessor;
        private readonly IInsuranceGateway _insuranceGateway;

        public InvoiceController(
            HealthySystemDbContext context,
            IInvoicePricingComposer invoicePricingComposer,
            IPaymentProcessor paymentProcessor,
            IInsuranceGateway insuranceGateway)
        {
            _context = context;
            _invoicePricingComposer = invoicePricingComposer;
            _paymentProcessor = paymentProcessor;
            _insuranceGateway = insuranceGateway;
        }

        [HttpPost("pricing/preview")]
        [HttpPost("pricing/preview/pattern")]
        [HttpPost("/api/invoice/pricing/preview/pattern")]
        public IActionResult PreviewPricing([FromBody] InvoicePricingPreviewRequest request)
        {
            var pricing = _invoicePricingComposer.Calculate(new InvoicePricingInput(
                ConsultationFee: request.ConsultationFee,
                LabFee: request.LabFee,
                IsAfterHours: request.IsAfterHours,
                HasInsurance: request.HasInsurance,
                IsLoyalPatient: request.IsLoyalPatient));

            return Ok(new
            {
                success = true,
                processingState = new
                {
                    phase = "ready",
                    isLoading = false,
                    skeletonHint = "invoice-pricing-preview"
                },
                data = pricing
            });
        }

        [HttpPost("{invoiceId:long}/pay")]
        [HttpPost("{invoiceId:long}/pay/pattern")]
        [HttpPost("/api/invoice/{invoiceId:long}/pay/pattern")]
        public async Task<IActionResult> PayInvoice(long invoiceId, [FromBody] PayInvoiceRequest request)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Patient)
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null)
            {
                return NotFound(new { success = false, message = "Invoice not found." });
            }

            var amountToPay = request.Amount ?? invoice.TotalAmount;
            var method = (request.Method ?? string.Empty).Trim().ToLowerInvariant();

            var paymentResult = await _paymentProcessor.ProcessAsync(new PaymentRequest(
                InvoiceCode: $"INV-{invoice.Id}",
                Amount: amountToPay,
                Currency: string.IsNullOrWhiteSpace(request.Currency) ? "VND" : request.Currency,
                Method: method,
                PayerCode: string.IsNullOrWhiteSpace(request.PayerCode) ? invoice.PatientId.ToString() : request.PayerCode));

            ClaimSubmissionResult? insuranceClaim = null;
            if (paymentResult.Success && method == "insurance")
            {
                insuranceClaim = await _insuranceGateway.SubmitClaimAsync(new ClaimSubmission(
                    ClaimCode: $"CLM-{invoice.Id}-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    PatientCode: invoice.PatientId.ToString(),
                    Amount: amountToPay,
                    Diagnosis: string.IsNullOrWhiteSpace(request.Diagnosis) ? "R69" : request.Diagnosis,
                    VisitDate: DateTime.UtcNow));
            }

            if (paymentResult.Success)
            {
                _context.Payments.Add(new Payment
                {
                    InvoiceId = invoice.Id,
                    Amount = amountToPay,
                    Method = method,
                    PaidAt = DateTimeOffset.UtcNow,
                    Reference = paymentResult.TransactionCode
                });

                invoice.Status = "paid";
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                success = paymentResult.Success,
                processingState = new
                {
                    phase = paymentResult.Success ? "ready" : "error",
                    isLoading = false,
                    skeletonHint = "invoice-payment-result"
                },
                data = new
                {
                    invoiceId = invoice.Id,
                    invoiceStatus = invoice.Status,
                    payment = paymentResult,
                    insuranceClaim
                }
            });
        }
    }

    public class InvoicePricingPreviewRequest
    {
        public decimal ConsultationFee { get; set; }
        public decimal LabFee { get; set; }
        public bool IsAfterHours { get; set; }
        public bool HasInsurance { get; set; }
        public bool IsLoyalPatient { get; set; }
    }

    public class PayInvoiceRequest
    {
        public string Method { get; set; } = "cash";
        public decimal? Amount { get; set; }
        public string? Currency { get; set; }
        public string? PayerCode { get; set; }
        public string? Diagnosis { get; set; }
    }
}

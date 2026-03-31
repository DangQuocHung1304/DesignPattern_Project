namespace HealthySystem.API.DesignPatterns.Decorator;

public sealed record InvoicePricingInput(
    decimal ConsultationFee,
    decimal LabFee,
    bool IsAfterHours,
    bool HasInsurance,
    bool IsLoyalPatient);

public sealed class InvoicePricingResult
{
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Surcharge { get; set; }
    public decimal Total => Math.Max(0, Subtotal - Discount + Surcharge);
    public List<string> Notes { get; } = new();
}

public interface IInvoicePricingService
{
    InvoicePricingResult Calculate(InvoicePricingInput input);
}

public sealed class StandardInvoicePricingService : IInvoicePricingService
{
    public InvoicePricingResult Calculate(InvoicePricingInput input)
    {
        return new InvoicePricingResult
        {
            Subtotal = input.ConsultationFee + input.LabFee
        };
    }
}

public abstract class InvoicePricingServiceDecorator : IInvoicePricingService
{
    protected readonly IInvoicePricingService Inner;

    protected InvoicePricingServiceDecorator(IInvoicePricingService inner)
    {
        Inner = inner;
    }

    public virtual InvoicePricingResult Calculate(InvoicePricingInput input)
    {
        return Inner.Calculate(input);
    }
}

public sealed class InsuranceCoverageDecorator : InvoicePricingServiceDecorator
{
    public InsuranceCoverageDecorator(IInvoicePricingService inner) : base(inner)
    {
    }

    public override InvoicePricingResult Calculate(InvoicePricingInput input)
    {
        var result = base.Calculate(input);
        if (input.HasInsurance)
        {
            result.Discount += result.Subtotal * 0.3m;
            result.Notes.Add("Bao hiem chi tra 30% tong chi phi.");
        }

        return result;
    }
}

public sealed class AfterHoursFeeDecorator : InvoicePricingServiceDecorator
{
    public AfterHoursFeeDecorator(IInvoicePricingService inner) : base(inner)
    {
    }

    public override InvoicePricingResult Calculate(InvoicePricingInput input)
    {
        var result = base.Calculate(input);
        if (input.IsAfterHours)
        {
            result.Surcharge += 50000;
            result.Notes.Add("Phu thu khung gio ngoai hanh chinh: 50,000 VND.");
        }

        return result;
    }
}

public sealed class LoyaltyDiscountDecorator : InvoicePricingServiceDecorator
{
    public LoyaltyDiscountDecorator(IInvoicePricingService inner) : base(inner)
    {
    }

    public override InvoicePricingResult Calculate(InvoicePricingInput input)
    {
        var result = base.Calculate(input);
        if (input.IsLoyalPatient)
        {
            result.Discount += 20000;
            result.Notes.Add("Giam gia benh nhan than thiet: 20,000 VND.");
        }

        return result;
    }
}

public interface IInvoicePricingComposer
{
    InvoicePricingResult Calculate(InvoicePricingInput input);
}

public sealed class InvoicePricingComposer : IInvoicePricingComposer
{
    public InvoicePricingResult Calculate(InvoicePricingInput input)
    {
        IInvoicePricingService pipeline = new StandardInvoicePricingService();
        pipeline = new InsuranceCoverageDecorator(pipeline);
        pipeline = new LoyaltyDiscountDecorator(pipeline);
        pipeline = new AfterHoursFeeDecorator(pipeline);
        return pipeline.Calculate(input);
    }
}

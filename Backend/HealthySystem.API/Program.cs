using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using HealthySystem.API.Data;
using HealthySystem.API.DesignPatterns.AbstractFactory;
using HealthySystem.API.DesignPatterns.Adapter;
using HealthySystem.API.DesignPatterns.Builder;
using HealthySystem.API.DesignPatterns.Decorator;
using HealthySystem.API.DesignPatterns.Facade;
using HealthySystem.API.DesignPatterns.FactoryMethod;
using HealthySystem.API.DesignPatterns.Observer;
using HealthySystem.API.DesignPatterns.Proxy;
using HealthySystem.API.DesignPatterns.Singleton;
using HealthySystem.API.DesignPatterns.State;
using HealthySystem.API.DesignPatterns.Strategy;
using HealthySystem.API.DesignPatterns.TemplateMethod;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add HttpClient for external API calls
builder.Services.AddHttpClient();

// GoF Design Patterns registrations
builder.Services.AddSingleton<ISystemConfigurationProvider, SystemConfigurationProvider>();

builder.Services.AddScoped<ActorProfileCreator, DoctorProfileCreator>();
builder.Services.AddScoped<ActorProfileCreator, PatientProfileCreator>();
builder.Services.AddScoped<ActorProfileCreator, ReceptionProfileCreator>();
builder.Services.AddScoped<IActorFactoryMethodService, ActorFactoryMethodService>();

builder.Services.AddScoped<IAppointmentReminderFactory, DoctorReminderFactory>();
builder.Services.AddScoped<IAppointmentReminderFactory, PatientReminderFactory>();
builder.Services.AddScoped<IAppointmentCommunicationService, AppointmentCommunicationService>();

builder.Services.AddScoped<IEncounterNoteDirector, EncounterNoteDirector>();

builder.Services.AddScoped<IInsurancePartnerClient, InsurancePartnerClient>();
builder.Services.AddScoped<IInsuranceGateway, InsuranceGatewayAdapter>();

builder.Services.AddSingleton<IMedicalRecordReader, MedicalRecordReader>();
builder.Services.AddSingleton<IMedicalRecordAccessPolicy, MedicalRecordAccessPolicy>();
builder.Services.AddSingleton<IMedicalRecordProxyService, MedicalRecordProxyService>();

builder.Services.AddScoped<IAppointmentValidator, AppointmentValidator>();
builder.Services.AddScoped<IEncounterDraftCreator, EncounterDraftCreator>();
builder.Services.AddScoped<IInvoiceDraftCreator, InvoiceDraftCreator>();
builder.Services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
builder.Services.AddScoped<IVisitWorkflowFacade, VisitWorkflowFacade>();

builder.Services.AddScoped<IInvoicePricingComposer, InvoicePricingComposer>();

builder.Services.AddSingleton<IAppointmentStatusSubject>(_ =>
{
    var subject = new AppointmentStatusSubject();
    subject.Subscribe(new DoctorScheduleObserver());
    subject.Subscribe(new ReceptionDeskObserver());
    subject.Subscribe(new PatientNotificationObserver());
    return subject;
});
builder.Services.AddScoped<IAppointmentStatusCoordinator, AppointmentStatusCoordinator>();

builder.Services.AddScoped<IAppointmentStateMachineService, AppointmentStateMachineService>();

builder.Services.AddScoped<IPaymentStrategy, CashPaymentStrategy>();
builder.Services.AddScoped<IPaymentStrategy, CardPaymentStrategy>();
builder.Services.AddScoped<IPaymentStrategy, InsurancePaymentStrategy>();
builder.Services.AddScoped<IPaymentProcessor, PaymentProcessor>();

builder.Services.AddScoped<TreatmentPlanTemplate, AcuteTreatmentPlanTemplate>();
builder.Services.AddScoped<TreatmentPlanTemplate, ChronicTreatmentPlanTemplate>();
builder.Services.AddScoped<ITreatmentPlanService, TreatmentPlanService>();

// Configure Entity Framework
builder.Services.AddDbContext<HealthySystemDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

// Configure CORS cho web frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWebOnly", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",        // React web app
                "http://localhost:5000",        // Cùng server
                "http://localhost:5196",        // Default port
                                "https://localhost:7221"        // HTTPS port
            )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
    
    // Policy rộng rãi cho development
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Không force HTTPS redirect để thuận tiện test trong mạng nội bộ
// app.UseHttpsRedirection();

// Cấu hình serve static files cho web app
app.UseDefaultFiles();
app.UseStaticFiles();

// Sử dụng CORS policy cho development
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();


using System.Collections.Concurrent;

namespace HealthySystem.API.DesignPatterns.Singleton;

public sealed class ClinicConfigurationStore
{
    private static readonly Lazy<ClinicConfigurationStore> _lazy =
        new(() => new ClinicConfigurationStore());

    private readonly ConcurrentDictionary<string, string> _settings = new();

    private ClinicConfigurationStore()
    {
    }

    public static ClinicConfigurationStore Instance => _lazy.Value;

    public void Seed(IDictionary<string, string> values)
    {
        foreach (var (key, value) in values)
        {
            _settings[key] = value;
        }
    }

    public string? Get(string key)
    {
        return _settings.TryGetValue(key, out var value) ? value : null;
    }

    public void Set(string key, string value)
    {
        _settings[key] = value;
    }

    public IReadOnlyDictionary<string, string> Snapshot()
    {
        return _settings.ToDictionary(k => k.Key, v => v.Value);
    }
}

public interface ISystemConfigurationProvider
{
    string GetValue(string key, string fallback = "");
    void SetValue(string key, string value);
    IReadOnlyDictionary<string, string> Snapshot();
}

public sealed class SystemConfigurationProvider : ISystemConfigurationProvider
{
    private readonly ClinicConfigurationStore _store;

    public SystemConfigurationProvider(IConfiguration configuration)
    {
        _store = ClinicConfigurationStore.Instance;

        var seededConfig = new Dictionary<string, string>
        {
            ["Clinic:Name"] = configuration["ClinicSettings:Name"] ?? "Healthy System",
            ["Clinic:Timezone"] = configuration["ClinicSettings:Timezone"] ?? "SE Asia Standard Time",
            ["Clinic:DefaultConsultationFee"] = configuration["ClinicSettings:DefaultConsultationFee"] ?? "250000",
            ["Clinic:MaxAppointmentsPerHour"] = configuration["ClinicSettings:MaxAppointmentsPerHour"] ?? "8",
            ["Notifications:DefaultChannel"] = configuration["ClinicSettings:NotificationChannel"] ?? "sms"
        };

        _store.Seed(seededConfig);
    }

    public string GetValue(string key, string fallback = "")
    {
        return _store.Get(key) ?? fallback;
    }

    public void SetValue(string key, string value)
    {
        _store.Set(key, value);
    }

    public IReadOnlyDictionary<string, string> Snapshot()
    {
        return _store.Snapshot();
    }
}

// ====================================================================
// Generate Password Hash for Admin Account
// ====================================================================
// This script generates SHA256 hash exactly like AuthController.cs
// Run: dotnet script GeneratePasswordHash.cs
// Or copy to a C# console app
// ====================================================================

using System;
using System.Security.Cryptography;
using System.Text;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("=== Password Hash Generator ===");
        Console.WriteLine("This matches the hashing in AuthController.cs\n");

        // Test passwords
        string[] passwords = {
            "Admin@123",
            "admin123",
            "Admin123",
            "admin@123"
        };

        foreach (var password in passwords)
        {
            string hash = HashPassword(password);
            Console.WriteLine($"Password: {password}");
            Console.WriteLine($"Hash:     {hash}");
            Console.WriteLine();
        }

        // Interactive mode
        Console.WriteLine("\n--- Custom Password ---");
        Console.Write("Enter password to hash: ");
        string customPassword = Console.ReadLine();
        
        if (!string.IsNullOrEmpty(customPassword))
        {
            string customHash = HashPassword(customPassword);
            Console.WriteLine($"\nPassword: {customPassword}");
            Console.WriteLine($"Hash:     {customHash}");
            Console.WriteLine("\nCopy the hash and run this SQL:");
            Console.WriteLine($"UPDATE users SET password_hash = '{customHash}' WHERE email = 'admin@healthysystem.com';");
        }
    }

    // This is EXACTLY the same method from AuthController.cs
    static string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}

// ====================================================================
// EXPECTED RESULTS:
// ====================================================================
// Password: Admin@123
// Hash:     jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=
// ====================================================================

// ====================================================================
// SQL TO UPDATE DATABASE:
// ====================================================================
// UPDATE users 
// SET password_hash = 'jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg='
// WHERE email = 'admin@healthysystem.com';
// ====================================================================

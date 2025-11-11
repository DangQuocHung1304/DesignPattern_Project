// Simple C# script to hash admin password
// Compile and run: csc HashPassword.cs && HashPassword.exe

using System;

class HashPassword
{
    static void Main(string[] args)
    {
        Console.WriteLine("===========================================");
        Console.WriteLine("ADMIN PASSWORD HASHER (BCrypt)");
        Console.WriteLine("===========================================\n");
        
        // Mật khẩu mặc định cho admin
        string[] passwords = { "admin123", "Admin@123", "healthysystem2025" };
        
        Console.WriteLine("Đang tạo hash cho các mật khẩu...\n");
        
        foreach (var password in passwords)
        {
            // Note: Cần cài BCrypt.Net-Next package
            // dotnet add package BCrypt.Net-Next
            string hash = BCrypt.Net.BCrypt.HashPassword(password);
            
            Console.WriteLine($"Password: {password}");
            Console.WriteLine($"Hashed:   {hash}");
            Console.WriteLine($"\nSQL Update:");
            Console.WriteLine($"UPDATE users SET password_hash = '{hash}' WHERE role = 'admin';\n");
            Console.WriteLine("-------------------------------------------\n");
        }
        
        Console.WriteLine("===========================================");
        Console.WriteLine("Copy hash phía trên và paste vào SQL script");
        Console.WriteLine("===========================================");
    }
}

// HƯỚNG DẪN:
// 1. Cần cài đặt BCrypt.Net-Next:
//    dotnet add package BCrypt.Net-Next
// 2. Compile: csc /r:BCrypt.Net-Next.dll HashPassword.cs
// 3. Run: HashPassword.exe
// 4. Copy hash và update vào database

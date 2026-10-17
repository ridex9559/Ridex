using System.Security.Cryptography;

namespace RIDEX.Shared.Algorithms;

public static class JoinCodeGenerator
{
    // Safe alphabet excluding ambiguous characters: 0, O, 1, I, L
    private const string SafeAlphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

    public static string Generate(string prefix = "RX", int randomLength = 5)
    {
        var chars = new char[randomLength];
        var bytes = new byte[randomLength];
        RandomNumberGenerator.Fill(bytes);

        for (int i = 0; i < randomLength; i++)
        {
            chars[i] = SafeAlphabet[bytes[i] % SafeAlphabet.Length];
        }

        return $"{prefix}-{new string(chars)}";
    }

    public static bool IsValidFormat(string? code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return false;

        var normalized = code.Trim().ToUpperInvariant();
        if (!normalized.StartsWith("RX-"))
            return false;

        var suffix = normalized.Substring(3);
        return suffix.Length >= 4 && suffix.All(c => SafeAlphabet.Contains(c));
    }
}

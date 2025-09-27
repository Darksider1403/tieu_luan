using System.Security.Cryptography;
using System.Text;

namespace EcommerceFashionWebsite.Utilities
{
    public static class Encrypt
    {
        private const string SECRET_KEY = "ThisIsASecretKey";
        private const string ALGORITHM_AES = "AES";
        private const string ALGORITHM_SHA256 = "SHA-256";
        private const int MAX_LENGTH = 30;

        public static string? EncryptString(string input)
        {
            try
            {
                // Step 1: AES Encryption
                byte[] keyBytes = Encoding.UTF8.GetBytes(SECRET_KEY);
                Array.Resize(ref keyBytes, 16); // AES-128 requires 16-byte key

                using (Aes aes = Aes.Create())
                {
                    aes.Key = keyBytes;
                    aes.Mode = CipherMode.ECB;
                    aes.Padding = PaddingMode.PKCS7;

                    using (ICryptoTransform encryptor = aes.CreateEncryptor())
                    {
                        byte[] inputBytes = Encoding.UTF8.GetBytes(input);
                        byte[] encryptedBytes = encryptor.TransformFinalBlock(inputBytes, 0, inputBytes.Length);

                        // Step 2: SHA-256 Hashing
                        using (SHA256 sha256 = SHA256.Create())
                        {
                            byte[] hashBytes = sha256.ComputeHash(encryptedBytes);
                            string base64Hash = Convert.ToBase64String(hashBytes);
                            
                            return base64Hash.Length >= MAX_LENGTH 
                                ? base64Hash.Substring(0, MAX_LENGTH) 
                                : base64Hash;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public static string GenerateCode(int length)
        {
            const string characterSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            if (length <= 0 || string.IsNullOrEmpty(characterSet))
            {
                throw new ArgumentException("Invalid input parameters");
            }

            Random random = new Random();
            StringBuilder stringBuilder = new StringBuilder();

            for (int i = 0; i < length; i++)
            {
                int randomIndex = random.Next(characterSet.Length);
                char randomChar = characterSet[randomIndex];
                stringBuilder.Append(randomChar);
            }

            return stringBuilder.ToString();
        }
        
        public static void TestEncryption()
        {
            Console.WriteLine(EncryptString("admin@admin.com0123456789"));
            Console.WriteLine(EncryptString("1234567"));
        }
    }
}
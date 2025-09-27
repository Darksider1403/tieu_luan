using System.Text.RegularExpressions;

namespace EcommerceFashionWebsite.Utilities
{
    public static class Validator
    {
        public static bool PatternMatches(string input, string regexPattern)
        {
            Regex regex = new Regex(regexPattern);
            return regex.IsMatch(input);
        }

        public static bool ValidateEmail(string email)
        {
            string regexPattern = @"^(?=.{1,64}@)[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*@" +
                                  @"[^-][A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(\.[A-Za-z]{2,})$";
            return PatternMatches(email, regexPattern);
        }

        public static bool IsValidPhoneNumber(string phoneNumber)
        {
            string regex = @"^(\+\d{1,2})?\d{10,}$";
            
            Regex pattern = new Regex(regex);
            return pattern.IsMatch(phoneNumber);
        }
    }
}
using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace EcommerceFashionWebsite.Utilities
{
    public class HttpUtils
    {
        private readonly string _value;

        public HttpUtils(string value)
        {
            _value = value;
        }

        public T? ToModel<T>() where T : class
        {
            try
            {
                return JsonSerializer.Deserialize<T>(_value);
            }
            catch (JsonException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public static T? ToModel<T>(string value) where T : class
        {
            try
            {
                return JsonSerializer.Deserialize<T>(value);
            }
            catch (JsonException ex)
            {
                Console.WriteLine(ex.Message);
                return null;
            }
        }

        public static HttpUtils Of(StreamReader reader)
        {
            StringBuilder sb = new StringBuilder();
            string? line;
            try
            {
                while ((line = reader.ReadLine()) != null)
                {
                    sb.AppendLine(line);
                }
            }
            catch (IOException ex)
            {
                Console.WriteLine(ex.Message);
            }
            return new HttpUtils(sb.ToString());
        }

        public static async Task<HttpUtils> OfAsync(StreamReader reader)
        {
            StringBuilder sb = new StringBuilder();
            string? line;
            try
            {
                while ((line = await reader.ReadLineAsync()) != null)
                {
                    sb.AppendLine(line);
                }
            }
            catch (IOException ex)
            {
                Console.WriteLine(ex.Message);
            }
            return new HttpUtils(sb.ToString());
        }
    }
}
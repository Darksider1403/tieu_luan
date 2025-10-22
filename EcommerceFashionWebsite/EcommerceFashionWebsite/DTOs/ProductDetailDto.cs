namespace EcommerceFashionWebsite.DTOs;

public class ProductDetailDto
{
    public ProductDto Product { get; set; }
    public Dictionary<string, string> Images { get; set; }
    public double Rating { get; set; }
    public List<ProductCommentDto> Comments { get; set; }
    public AccountDto Account { get; set; }
}


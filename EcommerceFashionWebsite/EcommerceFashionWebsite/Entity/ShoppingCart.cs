// using System.Collections.Generic;
// using System.Linq;
// using EcommerceFashionWebsite.Entity;
//
// namespace EcommerceFashionWebsite.Entity
// {
//     public class ShoppingCart
//     {
//         private Dictionary<string, CartItems> _data = new Dictionary<string, CartItems>();
//         private readonly IProductRepository _productRepository;
//
//         public ShoppingCart(IProductRepository productRepository)
//         {
//             _productRepository = productRepository;
//         }
//
//         public bool Add(string productId)
//         {
//             return Add(productId, 1);
//         }
//
//         public async Task<bool> Add(string productId, int quantity)
//         {
//             var product = await _productRepository.GetByIdAsync(productId);
//             if (product == null)
//             {
//                 return false;
//             }
//
//             CartItems cartItems;
//             if (_data.ContainsKey(productId))
//             {
//                 cartItems = _data[productId];
//                 cartItems.IncreaseQuantity(quantity);
//             }
//             else
//             {
//                 cartItems = new CartItems(product, quantity);
//             }
//
//             _data[productId] = cartItems;
//             return true;
//         }
//
//         public bool Decrease(string productId, int quantity)
//         {
//             if (_data.ContainsKey(productId))
//             {
//                 CartItems cartItems = _data[productId];
//                 cartItems.DecreaseQuantity(quantity);
//                 if (cartItems.GetQuantity() <= 0)
//                 {
//                     _data.Remove(productId);
//                 }
//                 return true;
//             }
//             return false;
//         }
//
//         public int GetTotal()
//         {
//             return _data.Count;
//         }
//
//         public List<CartItems> GetProductList()
//         {
//             return _data.Values.ToList();
//         }
//
//         public CartItems? Remove(string productId)
//         {
//             if (_data.ContainsKey(productId))
//             {
//                 var item = _data[productId];
//                 _data.Remove(productId);
//                 return item;
//             }
//             return null;
//         }
//
//         public int GetSize()
//         {
//             return _data.Count;
//         }
//
//         public void Clear()
//         {
//             _data.Clear();
//         }
//
//         public double GetTotalPrice()
//         {
//             return _data.Values.Sum(item => item.GetTotalPrice());
//         }
//
//         public override string ToString()
//         {
//             return $"ShoppingCart{{data={string.Join(", ", _data)}}}";
//         }
//     }
// }
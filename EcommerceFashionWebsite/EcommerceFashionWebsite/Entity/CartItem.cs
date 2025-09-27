using EcommerceFashionWebsite.Entity;

namespace EcommerceFashionWebsite.Entity
{
    public class CartItem
    {
        private Product product;
        private int quantity;
        private bool isChecked;

        public CartItem(Product product, int quantity)
        {
            this.product = product;
            this.quantity = quantity;
        }

        public Product Product
        {
            get { return product; }
            set { product = value; }
        }

        public int Quantity
        {
            get { return quantity; }
            set { quantity = value; }
        }

        public bool IsChecked
        {
            get { return isChecked; }
            set { isChecked = value; }
        }

        public void IncreaseQuantity(int quantity)
        {
            this.quantity += quantity;
        }

        public void DecreaseQuantity(int quantity)
        {
            this.quantity -= quantity;
            if (this.quantity < 0)
            {
                this.quantity = 0;
            }
        }

        public double GetTotalPrice()
        {
            return quantity * product.Price;
        }
    }
}
using Microsoft.EntityFrameworkCore;
using EcommerceFashionWebsite.Entity;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;

namespace EcommerceFashionWebsite.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Your existing DbSets
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Origin> Origins { get; set; }
        public DbSet<Purchases> Purchases { get; set; }
        public DbSet<VerifyEmail> Verifies { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<AccessLevel> AccessLevels { get; set; }
        public DbSet<VerifyEmail> VerifyEmails { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Slider> Sliders { get; set; }
        public DbSet<ProductRating> ProductRatings { get; set; }
        public DbSet<Cart> Carts { get; set; }
        public DbSet<ProductComment> ProductComments { get; set; }
        public DbSet<CommentHelpful> CommentHelpfuls { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ===== Product Configuration =====
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("products");
            
                entity.Property(e => e.Id).HasColumnName("id").IsRequired();
                entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255);
                entity.Property(e => e.Price).HasColumnName("price");
                entity.Property(e => e.Quantity).HasColumnName("quantity");
                entity.Property(e => e.Material).HasColumnName("material");
                entity.Property(e => e.Size).HasColumnName("size");
                entity.Property(e => e.Color).HasColumnName("color");
                entity.Property(e => e.Gender).HasColumnName("gender");
                entity.Property(e => e.Status).HasColumnName("status");
                entity.Property(e => e.IdCategory).HasColumnName("idCategory").HasMaxLength(50);
            });
            
            // ===== ProductComment Configuration =====
            modelBuilder.Entity<ProductComment>(entity =>
            {
                entity.HasOne(c => c.Product)
                    .WithMany()
                    .HasForeignKey(c => c.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(c => c.User)
                    .WithMany()
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(c => c.ParentComment)
                    .WithMany(c => c.Replies)
                    .HasForeignKey(c => c.ParentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(c => c.ProductId);
                entity.HasIndex(c => c.UserId);
                entity.HasIndex(c => c.ParentId);
                entity.HasIndex(c => c.Status);
            });
            
            modelBuilder.Entity<CommentHelpful>(entity =>
            {
                entity.HasIndex(e => new { e.CommentId, e.UserId }).IsUnique();
            });
            
            // ===== CART CONFIGURATION - CRITICAL FIX =====
            modelBuilder.Entity<Cart>(entity =>
            {
                entity.ToTable("carts");
                
                // ONLY id is the primary key!
                entity.HasKey(c => c.Id);
                
                // Map all properties explicitly
                entity.Property(c => c.Id)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd();
                
                entity.Property(c => c.IdProduct)
                    .HasColumnName("idProduct")
                    .HasMaxLength(10)
                    .IsRequired();
                
                entity.Property(c => c.Quantity)
                    .HasColumnName("quantity")
                    .IsRequired();
                
                entity.Property(c => c.IdAccount)
                    .HasColumnName("idAccount")
                    .IsRequired(false); // Nullable
                
                entity.Property(c => c.IdOrder)
                    .HasColumnName("idOrder")
                    .HasMaxLength(50)
                    .IsRequired(false); // Nullable
                
                entity.Property(c => c.Price)
                    .HasColumnName("price")
                    .IsRequired();
                
                entity.Property(c => c.CreatedAt)
                    .HasColumnName("created_at");
                
                entity.Property(c => c.UpdatedAt)
                    .HasColumnName("updated_at");

                // Configure relationships
                entity.HasOne(c => c.Product)
                    .WithMany(p => p.Carts)
                    .HasForeignKey(c => c.IdProduct)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(c => c.Order)
                    .WithMany(o => o.OrderDetail)
                    .HasForeignKey(c => c.IdOrder)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false); // Nullable foreign key

                entity.HasOne(c => c.Account)
                    .WithMany()
                    .HasForeignKey(c => c.IdAccount)
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired(false); // Nullable foreign key

                // Add indexes for performance
                entity.HasIndex(c => c.IdAccount);
                entity.HasIndex(c => c.IdOrder);
                entity.HasIndex(c => c.IdProduct);
            });

            // ===== Order Configuration =====
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasOne(o => o.Account)
                    .WithMany()
                    .HasForeignKey(o => o.IdAccount)
                    .OnDelete(DeleteBehavior.SetNull);
                
                entity.HasMany(o => o.OrderDetail)
                    .WithOne(od => od.Order)
                    .HasForeignKey(od => od.IdOrder);
            });
            
            // ===== Category Configuration =====
            modelBuilder.Entity<Category>()
                .HasMany<Product>()
                .WithOne()
                .HasForeignKey(p => p.IdCategory)
                .HasPrincipalKey(c => c.Id);
            
            modelBuilder.Entity<ProductRating>(entity =>
            {
                entity.ToTable("product_ratings");
                entity.HasKey(e => e.Id);
    
                entity.Property(e => e.ProductId).IsRequired().HasMaxLength(10);
                entity.Property(e => e.AccountId).IsRequired();
                entity.Property(e => e.Rating).IsRequired();
                entity.Property(e => e.DateRating).IsRequired();
    
                // Unique constraint: one rating per user per product
                entity.HasIndex(e => new { e.ProductId, e.AccountId }).IsUnique();
    
                // Foreign keys
                entity.HasOne(e => e.Product)
                    .WithMany()
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
    
                entity.HasOne(e => e.Account)
                    .WithMany()
                    .HasForeignKey(e => e.AccountId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.ToTable("chat_messages");
                entity.HasKey(e => e.Id);
    
                entity.Property(e => e.UserMessage).IsRequired();
                entity.Property(e => e.BotResponse).IsRequired();
                entity.Property(e => e.Timestamp).IsRequired();
    
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
    
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Timestamp);
            });
        }
    }
}
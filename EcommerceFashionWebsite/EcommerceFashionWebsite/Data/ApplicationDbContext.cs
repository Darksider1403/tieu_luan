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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.ToTable("products");
            
                // Map only existing columns
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
            
            modelBuilder.Entity<Category>()
                .HasMany<Product>()
                .WithOne()
                .HasForeignKey(p => p.IdCategory)
                .HasPrincipalKey(c => c.Id);
        }
    }
}
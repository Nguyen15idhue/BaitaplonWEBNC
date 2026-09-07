using Microsoft.EntityFrameworkCore;
using Travela.Api.Models;

namespace Travela.Api.Data;

// DbContext B1: đủ 9 DbSet, FK Restrict, unique username/email/token_hash/booking_id,
// index theo Cacbuoccanlam B1.3. B2-B4 chỉ thêm query, không đổi quan hệ.
public class TravelaDbContext : DbContext
{
    public TravelaDbContext(DbContextOptions<TravelaDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Destination> Destinations => Set<Destination>();
    public DbSet<Tour> Tours => Set<Tour>();
    public DbSet<Price> Prices => Set<Price>();
    public DbSet<Image> Images => Set<Image>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Checkout> Checkouts => Set<Checkout>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.HasCharSet("utf8mb4");

        b.Entity<User>(e =>
        {
            e.ToTable("users");
            e.Property(x => x.Username).HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Role).HasMaxLength(20).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasIndex(x => x.Username).IsUnique();
            e.HasIndex(x => x.Email).IsUnique();
        });

        b.Entity<Destination>(e =>
        {
            e.ToTable("destinations");
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.RegionName).HasMaxLength(20).IsRequired();
        });

        b.Entity<Tour>(e =>
        {
            e.ToTable("tours");
            e.Property(x => x.TourName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasOne(x => x.Destination).WithMany(d => d.Tours)
                .HasForeignKey(x => x.DestinationId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.TourName);
            e.HasIndex(x => x.DestinationId);
            e.HasIndex(x => x.Status);
        });

        b.Entity<Price>(e =>
        {
            e.ToTable("prices");
            e.Property(x => x.SourceName).HasMaxLength(100).IsRequired();
            e.Property(x => x.PriceValue).HasPrecision(18, 2);
            e.HasOne(x => x.Tour).WithMany(t => t.Prices)
                .HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.TourId);
            e.HasIndex(x => x.EffectiveDate);
        });

        b.Entity<Image>(e =>
        {
            e.ToTable("images");
            e.Property(x => x.ImageUrl).HasMaxLength(500).IsRequired();
            e.Property(x => x.Caption).HasMaxLength(300);
            e.HasOne(x => x.Tour).WithMany(t => t.Images)
                .HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.TourId);
        });

        b.Entity<Booking>(e =>
        {
            e.ToTable("bookings");
            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
            e.Property(x => x.TrackingTrace).HasColumnType("text");
            e.HasOne(x => x.User).WithMany(u => u.Bookings)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Tour).WithMany(t => t.Bookings)
                .HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.TourId);
            e.HasIndex(x => x.Status);
        });

        b.Entity<Checkout>(e =>
        {
            e.ToTable("checkouts");
            e.Property(x => x.PaymentMethod).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasOne(x => x.Booking).WithOne(x => x.Checkout)
                .HasForeignKey<Checkout>(x => x.BookingId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.BookingId).IsUnique();
        });

        b.Entity<AuditLog>(e =>
        {
            e.ToTable("audit_logs");
            e.Property(x => x.Action).HasMaxLength(100).IsRequired();
            e.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
            e.Property(x => x.OldValue).HasColumnType("text");
            e.Property(x => x.NewValue).HasColumnType("text");
            e.HasOne(x => x.Actor).WithMany()
                .HasForeignKey(x => x.ActorId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.EntityType, x.EntityId });
            e.HasIndex(x => x.CreatedAt);
        });

        b.Entity<RefreshToken>(e =>
        {
            e.ToTable("refresh_tokens");
            e.Property(x => x.TokenHash).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasIndex(x => x.UserId);
        });
    }
}

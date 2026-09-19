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
    public DbSet<IdempotencyKey> IdempotencyKeys => Set<IdempotencyKey>();
    public DbSet<SupportRequest> SupportRequests => Set<SupportRequest>();

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
            // Nội dung chi tiết: field ngắn giới hạn 500 ký tự ở DB.
            e.Property(x => x.Route).HasMaxLength(500);
            e.Property(x => x.Transport).HasMaxLength(500);
            e.Property(x => x.Accommodation).HasMaxLength(500);
            e.Property(x => x.Guide).HasMaxLength(500);
            e.Property(x => x.Audience).HasMaxLength(500);
            e.Property(x => x.ContactInfo).HasMaxLength(500);
            e.Property(x => x.PaymentTerms).HasColumnType("text");
            e.Property(x => x.CancellationPolicy).HasColumnType("text");
            e.Property(x => x.ApplicationConditions).HasColumnType("text");
            e.Property(x => x.ItineraryDays).HasColumnType("text");
            e.HasOne(x => x.Destination).WithMany(d => d.Tours)
                .HasForeignKey(x => x.DestinationId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.TourName);
            e.HasIndex(x => x.DestinationId);
            e.HasIndex(x => x.Status);
            // N09: chống số âm ở DB, không chỉ validation service.
            e.ToTable(t => t.HasCheckConstraint("CK_tours_max_seats", "MaxSeats > 0"));
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
            // H11: composite cho query giá hiệu lực (tour + source + date).
            e.HasIndex(x => new { x.TourId, x.SourceName, x.EffectiveDate, x.Id });
            e.ToTable(t => t.HasCheckConstraint("CK_prices_value", "PriceValue > 0"));
        });

        b.Entity<Image>(e =>
        {
            e.ToTable("images");
            e.Property(x => x.ImageUrl).HasMaxLength(500).IsRequired();
            e.Property(x => x.Caption).HasMaxLength(300);
            e.HasOne(x => x.Tour).WithMany(t => t.Images)
                .HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.TourId);
            // H11: thumbnail query (tour + sort).
            e.HasIndex(x => new { x.TourId, x.SortOrder, x.Id });
            e.ToTable(t => t.HasCheckConstraint("CK_images_sort", "SortOrder > 0"));
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
            // H11: capacity check (tour+status) và my-bookings (user+status).
            e.HasIndex(x => new { x.TourId, x.Status });
            e.HasIndex(x => new { x.UserId, x.Status });
            // M12: concurrency token cho state machine booking.
            e.Property(x => x.Version).IsConcurrencyToken();
            e.ToTable(t => t.HasCheckConstraint("CK_bookings_qty", "Quantity > 0"));
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
            e.ToTable(t => t.HasCheckConstraint("CK_checkouts_amount", "Amount >= 0"));
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
            // H11/M06: revoke-chain + cleanup query.
            e.HasIndex(x => new { x.UserId, x.RevokedAt, x.ExpiresAt });
        });

        b.Entity<IdempotencyKey>(e =>
        {
            e.ToTable("idempotency_keys");
            e.Property(x => x.Key).HasMaxLength(200).IsRequired();
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Booking).WithMany()
                .HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.UserId, x.Key }).IsUnique();
            e.HasIndex(x => x.CreatedAt);
        });

        b.Entity<SupportRequest>(e =>
        {
            e.ToTable("support_requests");
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.Property(x => x.Phone).HasMaxLength(20);
            e.Property(x => x.Subject).HasMaxLength(200).IsRequired();
            e.Property(x => x.Message).HasColumnType("text").IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.AdminNote).HasColumnType("text");
            e.HasOne(x => x.User).WithMany()
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Handler).WithMany()
                .HasForeignKey(x => x.HandledBy).OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.CreatedAt);
        });
    }
}

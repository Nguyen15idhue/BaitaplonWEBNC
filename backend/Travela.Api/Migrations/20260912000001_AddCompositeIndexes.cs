using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travela.Api.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(Data.TravelaDbContext))]
    [Migration("20260912000001_AddCompositeIndexes")]
    public partial class AddCompositeIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // H11: composite indexes cho query nóng (capacity, giá hiệu lực, thumbnail, revoke-chain).
            migrationBuilder.CreateIndex(
                name: "IX_bookings_tour_status",
                table: "bookings",
                columns: new[] { "TourId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_bookings_user_status",
                table: "bookings",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_prices_tour_source_date",
                table: "prices",
                columns: new[] { "TourId", "SourceName", "EffectiveDate", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_images_tour_sort",
                table: "images",
                columns: new[] { "TourId", "SortOrder", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_user_revoke_exp",
                table: "refresh_tokens",
                columns: new[] { "UserId", "RevokedAt", "ExpiresAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_bookings_tour_status", table: "bookings");
            migrationBuilder.DropIndex(name: "IX_bookings_user_status", table: "bookings");
            migrationBuilder.DropIndex(name: "IX_prices_tour_source_date", table: "prices");
            migrationBuilder.DropIndex(name: "IX_images_tour_sort", table: "images");
            migrationBuilder.DropIndex(name: "IX_refresh_tokens_user_revoke_exp", table: "refresh_tokens");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Travela.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTourRedesignFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicationConditions",
                table: "tours",
                type: "text",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "CancellationPolicy",
                table: "tours",
                type: "text",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ItineraryDays",
                table: "tours",
                type: "text",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "PaymentTerms",
                table: "tours",
                type: "text",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<long>(
                name: "Version",
                table: "bookings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "idempotency_keys",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Key = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BookingId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_idempotency_keys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_idempotency_keys_bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_idempotency_keys_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddCheckConstraint(
                name: "CK_tours_max_seats",
                table: "tours",
                sql: "MaxSeats > 0");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_UserId_RevokedAt_ExpiresAt",
                table: "refresh_tokens",
                columns: new[] { "UserId", "RevokedAt", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_prices_TourId_SourceName_EffectiveDate_Id",
                table: "prices",
                columns: new[] { "TourId", "SourceName", "EffectiveDate", "Id" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_prices_value",
                table: "prices",
                sql: "PriceValue > 0");

            migrationBuilder.CreateIndex(
                name: "IX_images_TourId_SortOrder_Id",
                table: "images",
                columns: new[] { "TourId", "SortOrder", "Id" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_images_sort",
                table: "images",
                sql: "SortOrder > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_checkouts_amount",
                table: "checkouts",
                sql: "Amount >= 0");

            migrationBuilder.CreateIndex(
                name: "IX_bookings_TourId_Status",
                table: "bookings",
                columns: new[] { "TourId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_bookings_UserId_Status",
                table: "bookings",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_bookings_qty",
                table: "bookings",
                sql: "Quantity > 0");

            migrationBuilder.CreateIndex(
                name: "IX_idempotency_keys_BookingId",
                table: "idempotency_keys",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_idempotency_keys_CreatedAt",
                table: "idempotency_keys",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_idempotency_keys_UserId_Key",
                table: "idempotency_keys",
                columns: new[] { "UserId", "Key" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "idempotency_keys");

            migrationBuilder.DropCheckConstraint(
                name: "CK_tours_max_seats",
                table: "tours");

            migrationBuilder.DropIndex(
                name: "IX_refresh_tokens_UserId_RevokedAt_ExpiresAt",
                table: "refresh_tokens");

            migrationBuilder.DropIndex(
                name: "IX_prices_TourId_SourceName_EffectiveDate_Id",
                table: "prices");

            migrationBuilder.DropCheckConstraint(
                name: "CK_prices_value",
                table: "prices");

            migrationBuilder.DropIndex(
                name: "IX_images_TourId_SortOrder_Id",
                table: "images");

            migrationBuilder.DropCheckConstraint(
                name: "CK_images_sort",
                table: "images");

            migrationBuilder.DropCheckConstraint(
                name: "CK_checkouts_amount",
                table: "checkouts");

            migrationBuilder.DropIndex(
                name: "IX_bookings_TourId_Status",
                table: "bookings");

            migrationBuilder.DropIndex(
                name: "IX_bookings_UserId_Status",
                table: "bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_bookings_qty",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "ApplicationConditions",
                table: "tours");

            migrationBuilder.DropColumn(
                name: "CancellationPolicy",
                table: "tours");

            migrationBuilder.DropColumn(
                name: "ItineraryDays",
                table: "tours");

            migrationBuilder.DropColumn(
                name: "PaymentTerms",
                table: "tours");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "bookings");
        }
    }
}

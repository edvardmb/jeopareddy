using Jeopareddy.Api.Data;
using Jeopareddy.Api.Endpoints;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
const string FrontendCorsPolicy = "FrontendCors";

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://localhost:4173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<JeopareddyDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=jeopareddy.db";
    options.UseSqlite(connectionString);
});

var app = builder.Build();
app.UseCors(FrontendCorsPolicy);
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<JeopareddyDbContext>();
    DatabaseBootstrapper.BootstrapLegacySqliteMigrationHistory(db);
    db.Database.Migrate();
}

app.MapGameEndpoints();
app.MapTeamEndpoints();
app.MapScoreEventEndpoints();
app.MapClueEndpoints();

app.Run();

public partial class Program;

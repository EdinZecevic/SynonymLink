using SynonymsApp.Repositories;
using SynonymsApp.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyOrigin() // In production we can restrict this, but for rendering/dev flexibility we allow all
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Dependency Injection Registration
builder.Services.AddSingleton<ISynonymRepository, InMemorySynonymRepository>();
builder.Services.AddHttpClient<ISynonymService, SynonymService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
// Show Swagger in Development and Staging for easier API testing
if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");

// In-memory setup does not require strict HTTPS redirection if running behind a proxy like Render.com's Docker setup,
// but we support it based on configuration
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

// Add a default fallback path for checking service status
app.MapGet("/", () => new { Status = "Healthy", Project = "Synonyms API", Environment = app.Environment.EnvironmentName });

// Pre-seed some default synonyms on startup to ensure instant usability
var repository = app.Services.GetRequiredService<ISynonymRepository>();
await repository.AddPairAsync("clean", "wash");
await repository.AddPairAsync("wash", "purify");
await repository.AddPairAsync("fast", "quick");
await repository.AddPairAsync("quick", "rapid");
await repository.AddPairAsync("happy", "joyful");
await repository.AddPairAsync("joyful", "cheerful");
await repository.AddPairAsync("smart", "intelligent");
await repository.AddPairAsync("intelligent", "clever");

app.Run();

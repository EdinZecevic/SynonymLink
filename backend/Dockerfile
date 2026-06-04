# Multi-stage Dockerfile for deploying .NET 8 Web API to Render.com
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 8080
ENV ASPNETCORE_URLS=http://*:80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SynonymsApp.csproj", "./"]
RUN dotnet restore "SynonymsApp.csproj"
COPY . .
RUN dotnet build "SynonymsApp.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SynonymsApp.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SynonymsApp.dll"]

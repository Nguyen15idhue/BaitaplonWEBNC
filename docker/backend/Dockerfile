FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/Travela.Api/Travela.Api.csproj backend/Travela.Api/
RUN dotnet restore backend/Travela.Api/Travela.Api.csproj
COPY . .
WORKDIR /src/backend/Travela.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
# curl cho HEALTHCHECK (image aspnet không có sẵn).
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
EXPOSE 8080
# N15: container health dựa trên liveness (không phụ thuộc DB).
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=30s \
  CMD curl -f http://localhost:8080/health/live || exit 1
ENTRYPOINT ["dotnet", "Travela.Api.dll"]

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/Travela.Api/Travela.Api.csproj backend/Travela.Api/
RUN dotnet restore backend/Travela.Api/Travela.Api.csproj
COPY . .
WORKDIR /src/backend/Travela.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "Travela.Api.dll"]

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/Jeopareddy.Api.csproj backend/
RUN dotnet restore backend/Jeopareddy.Api.csproj
COPY backend/. backend/
RUN dotnet publish backend/Jeopareddy.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "Jeopareddy.Api.dll"]

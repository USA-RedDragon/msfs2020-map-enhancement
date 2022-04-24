$top = git rev-parse --show-toplevel

C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc "$top\extra\server\service-wrapper\service.cs"
Move-Item -Path "service.exe" -Destination "$top\extra\server\service-wrapper\service.exe" -Force
C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc "extra\nginx\service-wrapper\service.cs"
Move-Item -Path "service.exe" -Destination "$top\extra\nginx\service-wrapper\service.exe" -Force

$NginxVersion = "1.21.6"

$top = git rev-parse --show-toplevel
$nginxPath = "$top/extra/nginx"

# Clear nginx
if((Test-Path -Path "$nginxPath/nginx.exe" )) {
    Remove-Item "$nginxPath/nginx.exe"
}
if((Test-Path -Path "$env:TEMP/temp_nginx_install" )) {
    Remove-Item "$env:TEMP/temp_nginx_install" -Recurse
}
New-Item -Path "$env:TEMP" -Name "temp_nginx_install" -ItemType "directory"
$tempDir = "$env:TEMP/temp_nginx_install"
$tempFile = New-TemporaryFile

# Obtain nginx
Invoke-WebRequest `
  -Uri https://nginx.org/download/nginx-$NginxVersion.zip `
  -OutFile "$tempFile"

# Add .zip to extension, otherwise Expand-Archive will complain
# that .tmp is not a supported archive file format
Move-Item -Path "$tempFile" -Destination "$tempFile.zip"
$tempFile = "$tempFile.zip"

# Extract zip to temp dir
Expand-Archive -Force -LiteralPath "$tempFile" -DestinationPath "$tempDir"
Remove-Item "$tempFile"

# Grab nginx.exe and place in source
Move-Item -Path "$tempDir/nginx-$NginxVersion/nginx.exe" -Destination "$nginxPath/nginx.exe"
Remove-Item "$tempDir" -Recurse

# Ensure config passes validation
cd $nginxPath
./nginx.exe -t

$installDir = $args[0]
$nginxPath = "$installDir/resources/extra/nginx"

# NGINX does not start without these directories
New-Item -Path "$nginxPath" -Name "temp" -ItemType "directory" -Force
New-Item -Path "$nginxPath" -Name "logs" -ItemType "directory" -Force

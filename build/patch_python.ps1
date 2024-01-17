Set-StrictMode -Version 3.0
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$InternalPythonShort = "39"
$installDir = $args[0]
$serverPath = "$installDir/resources/extra/server"
$pythonPath = "$serverPath/python"

# Add installed python directory to ._pth file
(Get-Content "$pythonPath/python$InternalPythonShort._pth") | Foreach-Object {$_ -replace "^Lib/site-packages$", "$serverPath`nLib/site-packages"} | Set-Content "$pythonPath/python$InternalPythonShort._pth"

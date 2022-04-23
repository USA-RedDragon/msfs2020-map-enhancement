$PythonVersion = "3.9.9"
$InternalPythonShort = "39"

$top = git rev-parse --show-toplevel
$serverPath = "$top/extra/server"
$pythonPath = "$serverPath/python"

# Obtain Python Embedded
if((Test-Path -Path "$pythonPath" )) {
    Remove-Item "$pythonPath" -Recurse
}
New-Item -Path "$serverPath" -Name "python" -ItemType "directory"

$tempFile = New-TemporaryFile

Invoke-WebRequest `
  -Uri https://www.python.org/ftp/python/$PythonVersion/python-$PythonVersion-embed-amd64.zip `
  -OutFile "$tempFile"

# Add .zip to extension, otherwise Expand-Archive will complain
# that .tmp is not a supported archive file format
Move-Item -Path "$tempFile" -Destination "$tempFile.zip"
$tempFile = "$tempFile.zip"

Expand-Archive -Force -LiteralPath "$tempFile" -DestinationPath "$pythonPath"
Remove-Item "$tempFile"

# Obtain get-pip.py
Invoke-WebRequest `
  -Uri https://bootstrap.pypa.io/get-pip.py `
  -OutFile "$pythonPath/get-pip.py"

# Uncomment 'import site' from ._pth file
(Get-Content "$pythonPath/python$InternalPythonShort._pth") | Foreach-Object {$_ -replace "^#import site$", "import site"} | Set-Content "$pythonPath/python$InternalPythonShort._pth"

# Add 'Lib/site-packages' to ._pth file
(Get-Content "$pythonPath/python$InternalPythonShort._pth") | Foreach-Object {$_ -replace "^python$InternalPythonShort.zip$", "Lib/site-packages`npython$InternalPythonShort.zip"} | Set-Content "$pythonPath/python$InternalPythonShort._pth"

# Install pip
cd $pythonPath
./python.exe get-pip.py
Remove-Item "get-pip.py"

# Now install the dependencies
./python.exe -m pip install -r $serverPath/requirements.txt
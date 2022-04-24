!macro customInstall
  File /oname=$PLUGINSDIR\patch_python.ps1 "${BUILD_RESOURCES_DIR}\patch_python.ps1"
  ExecWait `"powershell" -ExecutionPolicy Bypass -File "$PLUGINSDIR\patch_python.ps1" "$INSTDIR"`
!macroend

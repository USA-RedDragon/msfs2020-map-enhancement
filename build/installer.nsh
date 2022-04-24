!macro customInstall
  File /oname=$PLUGINSDIR\patch_python.ps1 "${BUILD_RESOURCES_DIR}\patch_python.ps1"
  File /oname=$PLUGINSDIR\create_nginx_dirs.ps1 "${BUILD_RESOURCES_DIR}\create_nginx_dirs.ps1"
  ExecWait `"powershell" -ExecutionPolicy Bypass -File "$PLUGINSDIR\patch_python.ps1" "$INSTDIR"`
  ExecWait `"powershell" -ExecutionPolicy Bypass -File "$PLUGINSDIR\create_nginx_dirs.ps1" "$INSTDIR"`
!macroend

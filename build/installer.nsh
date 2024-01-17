!define nginxDisplayName "MSFS2020 Map Enhancement - Nginx"
!define nginxServiceName "MSFS2020MapEnhancementNginx"
!define imageServerDisplayName "MSFS2020 Map Enhancement - Image Server"
!define imageServerServiceName "MSFS2020MapEnhancementImageServer"

!macro customInstall
  File /oname=$PLUGINSDIR\patch_python.ps1 "${BUILD_RESOURCES_DIR}\patch_python.ps1"
  File /oname=$PLUGINSDIR\create_nginx_dirs.ps1 "${BUILD_RESOURCES_DIR}\create_nginx_dirs.ps1"
  ExecWait `"pwsh" -ExecutionPolicy Bypass -File "$PLUGINSDIR\patch_python.ps1" "$INSTDIR"`
  ExecWait `"pwsh" -ExecutionPolicy Bypass -File "$PLUGINSDIR\create_nginx_dirs.ps1" "$INSTDIR"`

  ExecWait '"sc.exe" "create" "${imageServerServiceName}" displayname="${imageServerDisplayName}" type=own start=demand binpath="$INSTDIR\resources\extra\server\service-wrapper\service.exe"'
  ExecWait '"sc.exe" "create" "${nginxServiceName}" displayname="${nginxDisplayName}" type=own start=demand binpath="$INSTDIR\resources\extra\nginx\service-wrapper\service.exe"'
!macroend

!macro customUnInit
  ExecWait '"net.exe" "stop" "${nginxServiceName}"'
  ExecWait '"net.exe" "stop" "${imageServerServiceName}"'
!macroend

!macro customUnInstall
  ExecWait '"sc.exe" "delete" "${nginxServiceName}"'
  ExecWait '"sc.exe" "delete" "${imageServerServiceName}"'
!macroend

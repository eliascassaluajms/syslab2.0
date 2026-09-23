; SysLab Lock - Instalador Windows (compilado con makensis en Linux)
; Instalación por usuario (sin privilegios de administrador)

Unicode true
XPStyle on

Name "SysLab Lock"
OutFile "release/SysLab-Lock-Setup-1.0.0.exe"
InstallDir "$LOCALAPPDATA\Programs\SysLab Lock"
InstallDirRegKey HKCU "Software\SysLab Lock" "InstallLocation"
RequestExecutionLevel user

SetCompressor /SOLID lzma
SetCompressorDictSize 32

!include "MUI2.nsh"
!include "FileFunc.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define MUI_FINISHPAGE_RUN "$INSTDIR\SysLab Lock.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Iniciar SysLab Lock"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Spanish"

Section "App" SecMain
  SetOutPath "$INSTDIR"
  File /r "release/win-unpacked\*.*"

  WriteUninstaller "$INSTDIR\uninstall.exe"

  WriteRegStr HKCU "Software\SysLab Lock" "InstallLocation" "$INSTDIR"

  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SysLabLock" \
    "DisplayName" "SysLab Lock"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SysLabLock" \
    "DisplayVersion" "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SysLabLock" \
    "Publisher" "SysLab 2.0 - UAJMS"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SysLabLock" \
    "DisplayIcon" "$INSTDIR\SysLab Lock.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SysLabLock" \
    "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SysLabLock" \
    "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SysLabLock" \
    "NoRepair" 1

  CreateDirectory "$SMPROGRAMS\SysLab Lock"
  CreateShortcut "$DESKTOP\SysLab Lock.lnk" "$INSTDIR\SysLab Lock.exe"
  CreateShortcut "$SMPROGRAMS\SysLab Lock\SysLab Lock.lnk" "$INSTDIR\SysLab Lock.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\SysLab Lock.lnk"
  RMDir /r "$SMPROGRAMS\SysLab Lock"
  RMDir /r "$INSTDIR"

  DeleteRegKey HKCU "Software\SysLab Lock"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SysLabLock"
SectionEnd
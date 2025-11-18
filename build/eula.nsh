; Custom EULA Page for Sophos End User Terms of Use and Privacy Notice
; This MUST appear BEFORE installation starts

; Required includes
!include LogicLib.nsh
!include nsDialogs.nsh
!include MUI2.nsh

Var EULAAccepted
Var EULACheckboxHandle

; Override the page order by using customPageAfterWelcome
; This ensures EULA appears right after welcome, BEFORE directory selection
!macro customPageAfterWelcome
  Page custom EULAPageCreate EULAPageLeave
!macroend

Function EULAPageCreate
  ; Initialize EULA acceptance state
  StrCpy $EULAAccepted "0"
  
  ; Create the custom page dialog
  nsDialogs::Create 1018
  Pop $0
  
  ${If} $0 == error
    Abort
  ${EndIf}
  
  ; Set page title and subtitle
  !insertmacro MUI_HEADER_TEXT "License Agreement" "Please review and accept the license terms before installing."
  
  ; Create text control for EULA text
  ${NSD_CreateLabel} 10u 10u 280u 90u "Use of this software is subject to the Sophos End User Terms of Use:$\r$\nhttps://www.sophos.com/en-us/legal/sophos-end-user-terms-of-use$\r$\n$\r$\nYou must accept the End User Terms of Use to continue.$\r$\n$\r$\nYou also acknowledge that Sophos processes personal data in accordance with the Sophos Privacy Notice:$\r$\nhttps://www.sophos.com/en-us/legal/sophos-group-privacy-notice"
  Pop $1
  
  ; Create checkbox below the text
  ${NSD_CreateCheckbox} 10u 105u 280u 30u "I accept the Sophos End User Terms of Use and acknowledge the Sophos Privacy Notice"
  Pop $2
  
  ; Store checkbox handle
  StrCpy $EULACheckboxHandle $2
  
  ; Initially disable the Next button
  GetDlgItem $3 $HWNDPARENT 1
  EnableWindow $3 0
  
  ; Set callback for checkbox
  ${NSD_OnClick} $2 OnEULACheckboxClick
  
  ; Show the dialog
  nsDialogs::Show
FunctionEnd

Function OnEULACheckboxClick
  ; Get checkbox state
  ${NSD_GetState} $EULACheckboxHandle $0
  
  ; Get Next button
  GetDlgItem $1 $HWNDPARENT 1
  
  ${If} $0 == ${BST_CHECKED}
    ; Enable Next button when checked
    EnableWindow $1 1
    StrCpy $EULAAccepted "1"
  ${Else}
    ; Disable Next button when unchecked
    EnableWindow $1 0
    StrCpy $EULAAccepted "0"
  ${EndIf}
FunctionEnd

Function EULAPageLeave
  ; Final verification before allowing to proceed
  ${NSD_GetState} $EULACheckboxHandle $0
  
  ${If} $0 != ${BST_CHECKED}
    MessageBox MB_OK|MB_ICONEXCLAMATION "You must accept the Sophos End User Terms of Use and acknowledge the Sophos Privacy Notice to continue with the installation."
    Abort
  ${EndIf}
FunctionEnd
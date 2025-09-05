#SingleInstance Force

; Hotkey Summary
; --------------------------------------------------
; | Hotkey | Action              | Description                                  |
; --------------------------------------------------
; | Esc    | Toggle Script       | Toggles script on/off with 3 sequential presses within 2 seconds. |
; | F1     | Double Left Click   | Simulates two left mouse clicks.              |
; | F2     | Middle Click        | Simulates a single middle mouse button click. |
; | F3     | Right Click         | Simulates a single right mouse button click.  |
; | F4     | Click or Drag       | Quick press for a left click; hold for drag (press and release mouse). |
; |--------------------------------------------------
; | F5     | Drag Lock Toggle    | Press once to hold left mouse button down, press again to release. |
; | F6     | Cut                 | Sends Ctrl+X to cut selected content.         |
; | F7     | Paste               | Sends Ctrl+V to paste clipboard content.      |
; | F8     | Copy                | Sends Ctrl+C to copy selected content.        |
; |---------------------------------------------------
; | F9     | Close Window        | Sends Alt+F4 to close the active window.      |
; | F10    | Task View           | Sends Win+Tab to show open windows and virtual desktops. |
; | F11    | New Window          | Sends Ctrl+N to open a new window in supported applications. |
; --------------------------------------------------



; Initialize drag state
isDragging := false

; Initialize collapsed windows map
global oCollapsedWindows := Map()

; Initialize opacity state
isTransparent := false

; Initialize script active state
isScriptActive := true

; Initialize Escape press counter and timer
escPressCount := 0
lastEscPressTime := 0



; Escape key hotkey to toggle script on/off with 3 sequential presses
$Esc::
{
    global escPressCount, lastEscPressTime, isScriptActive
    currentTime := A_TickCount
    ; Check if previous press was within 2 seconds (2000 ms)
    if (currentTime - lastEscPressTime > 2000)
        escPressCount := 0  ; Reset counter if too much time has passed
    escPressCount += 1
    lastEscPressTime := currentTime

    if (escPressCount >= 3)
    {
        isScriptActive := !isScriptActive  ; Toggle script state
        escPressCount := 0  ; Reset counter
        ; Enable or disable hotkeys
        Hotkey "F1", isScriptActive ? "On" : "Off"
        Hotkey "F2", isScriptActive ? "On" : "Off"
        Hotkey "F3", isScriptActive ? "On" : "Off"
        Hotkey "*F4", isScriptActive ? "On" : "Off"
        Hotkey "F5", isScriptActive ? "On" : "Off"
        Hotkey "F6", isScriptActive ? "On" : "Off"
        Hotkey "F7", isScriptActive ? "On" : "Off"
        Hotkey "F8", isScriptActive ? "On" : "Off"
        Hotkey "F9", isScriptActive ? "On" : "Off"
        Hotkey "F10", isScriptActive ? "On" : "Off"
        Hotkey "F11", isScriptActive ? "On" : "Off"
        ; Notify user of state change
        TrayTip "Script " . (isScriptActive ? "Enabled" : "Disabled"), "Function Keys Script", 1
    }
    return
}



; F4 key: Quick press for click, hold for drag
*F4::
{
    SetTimer(CheckF4Hold, -50)  ; Start 100ms timer to detect hold
    KeyWait "F1"                 ; Wait for F1 to be released
    return
}


CheckF4Hold()
{
    if GetKeyState("F4", "P") {  ; If F4 is still held
        MouseClick "Left", , , , , "D"  ; Press left mouse button (start drag)
        KeyWait "F4"                    ; Wait for F4 release
        MouseClick "Left", , , , , "U"  ; Release left mouse button (end drag)
    } else {
        MouseClick "Left"               ; Perform single left-click
    }
}


; ---------------------------
; F3 → Right click (simulates pressing the right mouse button once)
; ---------------------------
F3::Click "Right"



; ---------------------------
; F2 → Middle click (simulates pressing the middle mouse button once)
; ---------------------------
F2::Click "Middle"


$F1:: {
Click 2 ; Simulates two left mouse clicks
}







; ---------------------------
; F5 → Drag lock toggle
; Press once to hold left mouse button down,
; press again to release (useful for dragging without holding).
; ---------------------------
; F5 key hotkey for drag lock

$F5::
{

    global isDragging
   
    if (isDragging)
    {
        ; Release drag on second press
        Click "Up"
        isDragging := false
    }
    else
    {
        ; Start drag on first press
        Click "Down"
        isDragging := true
    }
    return
}





; ---------------------------
; F8 key hotkey for copy
; ---------------------------
$F8::
{
    Send "^c"
    return
}



; ---------------------------
; F7 key hotkey for paste
; ---------------------------
$F7::
{
    Send "^v"
    return
}



; ---------------------------
; F6 key hotkey for cut
; ---------------------------
$F6::
{
    Send "^x"
    return
}




; ---------------------------
; F9 → Close active window (same as Alt+F4)
; ---------------------------
F9::Send "!{F4}"



; ---------------------------
; F10 → Windows + Tab (Task View)
; Shows all open windows and virtual desktops.
; ---------------------------
F10::Send "#{Tab}"




; ---------------------------
; F11 → New window (Ctrl+N)
; Opens a new window in browsers, File Explorer, and many other apps.
; ---------------------------
F11::Send "^n"


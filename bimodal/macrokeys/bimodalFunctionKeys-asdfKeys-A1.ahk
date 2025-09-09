#Requires AutoHotkey v2.0
#SingleInstance Force

; ---------------------
;
;  AutoHotKey Script for Key-Clicks - (Bimodal Control Theory)
;
;  A key-click means moving the screen cursor with the mouse while 
;  clicking with keyboard keys.
;
; ---------------------
;
;  --- How to Use ---
; 
;  By default the script turns on after you open it. 
;  Toggle the script off and on by pressing F5.
;  Exit the script by pressing Escape three times in a row.
;
;
;  ---- a through f, g ----
; 
;  a through f are the home keys for using the script.
;
;  Begin using this script by positioning the index finger on f for left click
;  and then clicking screen elements.
;
;  Right click is located to the left, on d. Middle click is s.
;  Double-click with a, such as for opening applications and files in
;  the File Explorer.
;
;  All other keys are located relative to this position.
;
;
;  ---- g - Drag Lock ---- 
; 
;  The drag lock has been assigned to g, which, lets you drag screen
;  elements and highlight text without having to hold down the f key.  
;  The first press turns on dragging of the element underneath the cursor.
;  The second press turns it off.
;
;
; --- Hotkey Summary ---
;
; --------------------------------------------------
; | Hotkey | Action              | Description                                  |
; |--------|---------------------|----------------------------------------------|
; | Esc    | Exit Script         | Exits the script with 3 sequential presses within 2 seconds. |
; | F5     | Toggle Script       | Toggles script on/off with a single press.    |
; | a      | Double Left Click   | Simulates two left mouse clicks.              |
; | s      | Middle Click        | Simulates a single middle mouse button click. |
; | d      | Right Click         | Simulates a single right mouse button click.  |
; | f      | Click or Drag       | Quick press for a left click; hold for drag (press and release mouse). |
; | g      | Drag Lock Toggle    | Press once to hold left mouse button down, press again to release. |
; | F6     | Cut                 | Sends Ctrl+X to cut selected content.         |
; | F7     | Paste               | Sends Ctrl+V to paste clipboard content.      |
; | F8     | Copy                | Sends Ctrl+C to copy selected content.        |
; |---------------------------------------------------
; | F9     | Close Window        | Sends Alt+F4 to close the active window.      |
; | F11    | New Window          | Sends Ctrl+N to open a new window in supported applications. |
; | c      | Page Up             | Simulates PageUp key press.                   |
; | v      | Page Down           | Simulates PageDown key press.                 |
; |--------|---------------------|----------------------------------------------|
; | `      | Task View           | Sends Win+Tab to show open windows and virtual desktops. |
; | 1      | Browser Back        | Navigates to the previous page in the browser. |
; | 2      | Browser Forward     | Navigates to the next page in the browser.   |
; | 3      | Tab Left            | Switches to the previous browser tab (Ctrl+Shift+Tab). |
; | 4      | Tab Right           | Switches to the next browser tab (Ctrl+Tab). |
; | 5      | New Tab             | Opens a new browser tab (Ctrl+T).            |
; | 6      | Close Tab           | Closes the active browser tab (Ctrl+W).      |
; | e      | Task View           | Sends Win+Tab to show open windows and virtual desktops. |
; |---------------------------------------------------|


; Initialize drag state
isDragging := false

; Initialize collapsed windows map
global oCollapsedWindows := Map()

; Initialize opacity state
isTransparent := false

; Initialize Escape press counter for exit
escExitCount := 0

; Initialize script active state
isScriptActive := true

; Initialize Escape press timer
lastEscPressTime := 0

; ---------------------------
; ` → Task View (Win+Tab)
; ---------------------------
`::Send "#{Tab}"

; ---------------------------
; c → Page Up
; ---------------------------
c::Send "{PgUp}"

; ---------------------------
; v → Page Down
; ---------------------------
v::Send "{PgDn}"

; ---------------------------
; 1 key hotkey for browser back
; ---------------------------
$1::
{
    SendInput "{Browser_Back}"
    return
}

; ---------------------------
; 2 key hotkey for browser forward
; ---------------------------
$2::
{
    SendInput "{Browser_Forward}"
    return
}

; ---------------------------
; 3 key hotkey for tab left
; ---------------------------
$3::
{
    SendInput "^+{Tab}"
    return
}

; ---------------------------
; 4 key hotkey for tab right
; ---------------------------
$4::
{
    SendInput "^{Tab}"
    return
}

; ---------------------------
; 5 key hotkey for new tab
; ---------------------------
$5::
{
    SendInput "^t"
    return
}

; ---------------------------
; 6 key hotkey for close tab
; ---------------------------
$6::
{
    SendInput "^w"
    return
}

; ---------------------------
; Esc key hotkey to exit script with 3 sequential presses
; ---------------------------
$Esc::
{
    global escExitCount, lastEscPressTime
    currentTime := A_TickCount
    ; Check if previous press was within 2 seconds (2000 ms)
    if (currentTime - lastEscPressTime > 2000)
        escExitCount := 0  ; Reset counter if too much time has passed
    escExitCount += 1
    lastEscPressTime := currentTime

    if (escExitCount >= 3)
    {
        ExitApp  ; Exit the script
    }
    return
}

; ---------------------------
; F5 key hotkey to toggle script on/off
; ---------------------------
$F5::
{
    global isScriptActive
    isScriptActive := !isScriptActive  ; Toggle script state
    ; Enable or disable hotkeys
    Hotkey "a", isScriptActive ? "On" : "Off"
    Hotkey "s", isScriptActive ? "On" : "Off"
    Hotkey "d", isScriptActive ? "On" : "Off"
    Hotkey "*f", isScriptActive ? "On" : "Off"
    Hotkey "g", isScriptActive ? "On" : "Off"
    Hotkey "c", isScriptActive ? "On" : "Off"
    Hotkey "v", isScriptActive ? "On" : "Off"
    Hotkey "e", isScriptActive ? "On" : "Off"
    Hotkey "F6", isScriptActive ? "On" : "Off"
    Hotkey "F7", isScriptActive ? "On" : "Off"
    Hotkey "F8", isScriptActive ? "On" : "Off"
    Hotkey "F9", isScriptActive ? "On" : "Off"
    Hotkey "F11", isScriptActive ? "On" : "Off"
    Hotkey "1", isScriptActive ? "On" : "Off"
    Hotkey "2", isScriptActive ? "On" : "Off"
    Hotkey "3", isScriptActive ? "On" : "Off"
    Hotkey "4", isScriptActive ? "On" : "Off"
    Hotkey "5", isScriptActive ? "On" : "Off"
    Hotkey "6", isScriptActive ? "On" : "Off"
    ; Notify user of state change
    TrayTip "Script " . (isScriptActive ? "Enabled" : "Disabled"), "Function Keys Script", 1
    return
}

; ---------------------------
; e → Task View (Win+Tab)
; ---------------------------
e::Send "#{Tab}"

; f key: Quick press for click, hold for drag
*f::
{
    SetTimer(CheckfHold, -50)  ; Start 50ms timer to detect hold
    KeyWait "f"                ; Wait for f to be released
    return
}

CheckfHold()
{
    if GetKeyState("f", "P") {  ; If f is still held
        MouseClick "Left", , , , , "D"  ; Press left mouse button (start drag)
        KeyWait "f"                    ; Wait for f release
        MouseClick "Left", , , , , "U"  ; Release left mouse button (end drag)
    } else {
        MouseClick "Left"               ; Perform single left-click
    }
}

; ---------------------------
; d → Right click
; ---------------------------
d::Click "Right"

; ---------------------------
; s → Middle click
; ---------------------------
s::Click "Middle"

$a::
{
    Click 2 ; Simulates two left mouse clicks
}

; ---------------------------
; g → Drag lock toggle
; ---------------------------
$g::
{
    global isDragging
    static originalCursor := 0  ; Store original cursor

    if (isDragging)
    {
        ; Release drag on second press
        Click "Up"
        isDragging := false
        ; Restore original cursor
        DllCall("SystemParametersInfo", "UInt", 0x57, "UInt", 0, "Ptr", originalCursor, "UInt", 0)
        ; Remove ToolTip
        ToolTip
    }
    else
    {
        ; Start drag on first press
        Click "Down"
        isDragging := true
        ; Store current cursor and set to crosshair
        originalCursor := DllCall("CopyIcon", "Ptr", DllCall("GetCursor", "Ptr"))
        DllCall("SetSystemCursor", "Ptr", DllCall("LoadCursor", "Ptr", 0, "Int", 32515), "Int", 32512)  ; IDC_CROSS
        ; Show ToolTip near cursor
        CoordMode "ToolTip", "Screen"
        MouseGetPos(&x, &y)
        ToolTip "Drag Lock ON", x + 20, y + 20
    }
    return
}

; ---------------------------
; F8 → Copy
; ---------------------------
$F8::
{
    Send "^c"
    return
}

; ---------------------------
; F7 → Paste
; ---------------------------
$F7::
{
    Send "^v"
    return
}

; ---------------------------
; F6 → Cut
; ---------------------------
$F6::
{
    Send "^x"
    return
}

; ---------------------------
; F9 → Close active window
; ---------------------------
F9::Send "!{F4}"

; ---------------------------
; F11 → New window
; ---------------------------
F11::Send "^n"
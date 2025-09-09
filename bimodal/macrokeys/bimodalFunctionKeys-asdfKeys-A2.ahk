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
;  Toggle the script off and on by pressing `.
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
; | `      | Toggle Script       | Toggles script on/off with a single press.    |
; |--------|---------------------|----------------------------------------------|
; | a      | Double Left Click   | Simulates two left mouse clicks.              |
; | s      | Middle Click        | Simulates a single middle mouse button click. |
; | d      | Right Click         | Simulates a single right mouse button click or drag. |
; | f      | Click or Drag       | Quick press for a left click; hold for drag (press and release mouse). |
; | g      | Drag Lock Toggle    | Press once to hold left mouse button down, press again to release. |
; |--------|---------------------|----------------------------------------------|
; | c      | Page Up             | Simulates PageUp key press.                   |
; | z      | Page Top            | Simulates Home key press to go to page top.   |
; | x      | Page Bottom         | Simulates End key press to go to page bottom. |
; | v      | Page Down           | Simulates PageDown key press.                 |
; |--------|---------------------|----------------------------------------------|
; | h      | Copy                | Sends Ctrl+C to copy selected content.        |
; | y      | Paste               | Sends Ctrl+V to paste clipboard content.      |
; | b      | Cut                 | Sends Ctrl+X to cut selected content.         |
; |---------------------------------------------------|
; | F9     | Close Window        | Sends Alt+F4 to close the active window.      |
; |--------|---------------------|----------------------------------------------|
; | q      | Browser Back        | Navigates to the previous page in the browser. |
; | w      | Browser Forward     | Navigates to the next page in the browser.   |
; | 3      | Tab Left            | Switches to the previous browser tab (Ctrl+Shift+Tab). |
; | 4      | Tab Right           | Switches to the next browser tab (Ctrl+Tab). |
; | r      | Close Tab           | Closes with Ctrl+W.      |
; | t      | New Tab             | Sends Ctrl+T to open a new window in supported applications. |
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

; Define list of hotkeys to toggle (excluding Esc and ` for toggle/exit)
global hotkeyList := ["a", "s", "*d", "*f", "g", "c", "z", "x", "v", "e", "h", "y", "b", "F9", "n", "q", "w", "3", "4", "r"]

; ---------------------------
; c → Page Up
; ---------------------------
c::Send "{PgUp}"

; ---------------------------
; z → Page Top
; ---------------------------
z::Send "{Home}"

; ---------------------------
; x → Page Bottom
; ---------------------------
x::Send "{End}"

; ---------------------------
; v → Page Down
; ---------------------------
v::Send "{PgDn}"

; ---------------------------
; q key hotkey for browser back
; ---------------------------
$q::
{
    SendInput "{Browser_Back}"
    return
}

; ---------------------------
; w key hotkey for browser forward
; ---------------------------
$w::
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
; r key hotkey for close tab
; ---------------------------
$r::
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
	 TrayTip "Exit Script", "ASDF Keys Script", 1
        ExitApp  ; Exit the script
    }
    return
}

; ---------------------------
; ` key hotkey to toggle script on/off
; ---------------------------
$`::
{
    global isScriptActive, hotkeyList
    isScriptActive := !isScriptActive  ; Toggle script state
    ; Enable or disable all hotkeys in the list
    for key in hotkeyList
    {
        Hotkey key, isScriptActive ? "On" : "Off"
    }
    ; Notify user of state change
    TrayTip "Script " . (isScriptActive ? "Enabled" : "Disabled"), "ASDF Keys Script", 1
    return
}

; ---------------------------
; e → Task View (Win+Tab)
; ---------------------------
e::Send "{Tab}"

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
; d → Right click (simulates pressing the right mouse button once)
; Quick press for click, hold for drag
; ---------------------------
*d::
{
    SetTimer(CheckdHold, -50)  ; Start 50ms timer to detect hold
    KeyWait "d"                ; Wait for d to be released
    return
}

CheckdHold()
{
    if GetKeyState("d", "P") {  ; If d is still held
        MouseClick "Right", , , , , "D"  ; Press right mouse button (start drag)
        KeyWait "d"                     ; Wait for d release
        MouseClick "Right", , , , , "U"  ; Release right mouse button (end drag)
    } else {
        MouseClick "Right"               ; Perform single right-click
    }
}

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
        ;ToolTip "Drag Lock ON", x + 20, y + 20
    }
    return
}

; ---------------------------
; h → Copy
; ---------------------------
$h::
{
    Send "^c"
    return
}

; ---------------------------
; y → Paste
; ---------------------------
$y::
{
    Send "^v"
    return
}

; ---------------------------
; b → Cut
; ---------------------------
$b::
{
    Send "^x"
    return
}

; ---------------------------
; n → New window
; ---------------------------
$n::
{
    Send "^n"
    return
}



; ---------------------------
; n → New tab
; ---------------------------
$t::
{
    Send "^t"
    return
}

; ---------------------------
; F9 → Close active window
; ---------------------------
F9::Send "!{F4}"
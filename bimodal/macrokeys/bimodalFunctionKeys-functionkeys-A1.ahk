#Requires AutoHotkey v2.0

; ---------------------------
; Display Hotkey Information GUI on Startup
; ---------------------------
#SingleInstance Force
#UseHook


isGuiVisible := false  ; Track GUI visibility

; Create GUI for hotkey information

; Create GUI for hotkey information
GuiHotkeys := Gui("-MaximizeBox", "Noctivagous Key-Click Script Hotkeys")
GuiHotkeys.SetFont("s10", "Arial")
GuiHotkeys.Add("Text", "x10 y10 w600", "Below is the hotkey guide, arranged like a keyboard. Press 9 to toggle visibility.")

; Define hotkeys with their key names, actions, and positions (button and text coordinates)
hotkeys := [
    ["Esc (2x)", "Toggle Script", "x10 y40", "x10 y60"],
    ["Esc (4x)", "Exit Script", "x10 y70", "x10 y90"],
    ["F1", "Double Left Click", "x100 y40", "x100 y60"],
    ["F2", "Middle Click", "x150 y40", "x150 y60"],
    ["F3", "Right Click", "x200 y40", "x200 y60"],
    ["F4", "Click or Drag", "x250 y40", "x250 y60"],
    ["F5", "Drag Lock Toggle", "x300 y40", "x300 y60"],
    ["F6", "Cut", "x350 y40", "x350 y60"],
    ["F7", "Paste", "x400 y40", "x400 y60"],
    ["F8", "Copy", "x450 y40", "x450 y60"],
    ["F9", "Close Window", "x500 y40", "x500 y60"],
    ["F11", "New Window", "x550 y40", "x550 y60"],
    ["``", "Task View", "x10 y90", "x10 y110"],
    ["1", "Browser Back", "x60 y90", "x60 y110"],
    ["2", "Browser Forward", "x110 y90", "x110 y110"],
    ["3", "Tab Left", "x160 y90", "x160 y110"],
    ["4", "Tab Right", "x210 y90", "x210 y110"],
    ["5", "New Tab", "x260 y90", "x260 y110"],
    ["6", "Close Tab", "x310 y90", "x310 y110"],
    ["-", "Minimize Window", "x360 y90", "x360 y110"],
    ["=", "Maximize/Restore", "x410 y90", "x410 y110"],
    ["9", "Toggle GUI", "x460 y90", "x460 y110"]
]

; Add button and text controls for each hotkey
for index, row in hotkeys
{
    GuiHotkeys.Add("Button", row[3] " w50 h20", row[1])  ; Button with key name
    GuiHotkeys.Add("Text", row[4] " w100", row[2])      ; Text with action
}

; Show the GUI on script startup
;GuiHotkeys.Show("w620 h160")

; 9 hotkey to toggle GUI visibility
$9::
{
    global isGuiVisible
    if (isGuiVisible)
    {
        GuiHotkeys.Hide()
        isGuiVisible := false
    }
    else
    {
        GuiHotkeys.Show("w620 h160")
        isGuiVisible := true
    }
    return
}

; ---------------------
;  NOCTIVAGOUS
;  KEY-CLICK SCRIPT FOR WINDOWS 
;  - FUNCTION KEYS
;  - A2
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
;  Toggle the script off and on by pressing Escape three times in a row.
;
;
;  ---- F1 through F4, F5 ----
;
;  F1 through F4 are the home keys for using the script.
;
;  Begin using this script by positioning the index finger on F4 for left click
;  and then clicking screen elements.
;
;  Right click is located to the left, on F3. Middle click is F2.
;  Double-click with F1, such as for opening applications and files in
;  the File Explorer.
;
;  All other keys are located relative to this position.
;
;
;  ---- F5 - Drag Lock ---- 
; 
;  The drag lock has been assigned to F5, which, lets you drag screen
;  elements and highlight text without having to hold down the F4 key.  
;  The first press turns on dragging of the element underneath the cursor.
;  The second press turns it off.
;
;
;
;
; --- Hotkey Summary ---
;
; --------------------------------------------------
; | Hotkey | Action              | Description                                  |
; --------------------------------------------------
; | Esc    | Toggle Script       | Toggles script on/off with 2 sequential presses within 2 seconds. |
; --------------------------------------------------
; | F1     | Double Left Click   | Simulates two left mouse clicks.              |
; | F2     | Middle Click        | Simulates a single middle mouse button click. |
; | F3     | Right Click         | Quick press for a right click; hold for drag (press and release mouse).
; | F4     | Click or Drag       | Quick press for a left click; hold for drag (press and release mouse). |
; |--------------------------------------------------
; | F5     | Drag Lock Toggle    | Press once to hold left mouse button down, press again to release. Also called "stick drag".|
; | F6     | Cut                 | Sends Ctrl+X to cut selected content.         |
; | F7     | Paste               | Sends Ctrl+V to paste clipboard content.      |
; | F8     | Copy                | Sends Ctrl+C to copy selected content.        |
; |---------------------------------------------------
; | F9     | Close Window        | Sends Alt+F4 to close the active window.      |
; | F11    | New Window          | Sends Ctrl+N to open a new window in supported applications. |
; --------------------------------------------------
; | Hotkey | Action              | Description                                  |
; |--------|---------------------|----------------------------------------------|
; | `      | Task View           | Sends Win+Tab to show open windows and virtual desktops. |
; | 1      | Browser Back        | Navigates to the previous page in the browser. |
; | 2      | Browser Forward     | Navigates to the next page in the browser.   |
; | 3      | Tab Left            | Switches to the previous browser tab (Ctrl+Shift+Tab). |
; | 4      | Tab Right           | Switches to the next browser tab (Ctrl+Tab). |
; | 5      | New Tab             | Opens a new browser tab (Ctrl+T).            |
; | 6      | Close Tab           | Closes the active browser tab (Ctrl+W).      |



; Initialize drag state
isDragging := false


; Initialize opacity state
isTransparent := false

; Initialize script active state
isScriptActive := true

; Initialize Escape press counter and timer
escPressCount := 0
lastEscPressTime := 0



; ---------------------------
; ` → Windows + Tab (Task View)
; Shows all open windows and virtual desktops.
; ---------------------------
`::Send "#{Tab}"

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


; Escape key hotkey to toggle script on/off with 2 presses, exit with 4 presses
$Esc::
{
    global escPressCount, lastEscPressTime, isScriptActive
    currentTime := A_TickCount
    ; Check if previous press was within 2 seconds (2000 ms)
    if (currentTime - lastEscPressTime > 2000)
        escPressCount := 0  ; Reset counter if too much time has passed
    escPressCount += 1
    lastEscPressTime := currentTime

    if (escPressCount = 2)
    {
        isScriptActive := !isScriptActive  ; Toggle script state
        ; Enable or disable hotkeys
        Hotkey "F1", isScriptActive ? "On" : "Off"
        Hotkey "F2", isScriptActive ? "On" : "Off"
        Hotkey "*F3", isScriptActive ? "On" : "Off"
        Hotkey "*F4", isScriptActive ? "On" : "Off"
        Hotkey "F5", isScriptActive ? "On" : "Off"
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
        Hotkey "-", isScriptActive ? "On" : "Off"
        Hotkey "=", isScriptActive ? "On" : "Off"
        ; Notify user of state change
        TrayTip "Script " . (isScriptActive ? "Enabled" : "Disabled"), "Function Keys Script", 1
    }
    else if (escPressCount >= 4)
    {
        TrayTip "Script Exited", "Function Keys Script has been terminated.", 1
        ExitApp
    }
    return
}

; F4 key: Quick press for click, hold for drag
*F4::
{
    SetTimer(CheckF4Hold, -50)  ; Start 100ms timer to detect hold
    KeyWait "F4"                 ; Wait for F4 to be released
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
; Quick press for click, hold for drag
; ---------------------------

*F3::
{
    SetTimer(CheckF3Hold, -50)  ; Start 50ms timer to detect hold
    KeyWait "F3"                 ; Wait for F4 to be released
    return
}


CheckF3Hold()
{
    if GetKeyState("F3", "P") {  ; If F3 is still held
        MouseClick "Right", , , , , "D"  ; Press left mouse button (start drag)
        KeyWait "F3"                    ; Wait for F3 release
        MouseClick "Right", , , , , "U"  ; Release left mouse button (end drag)
    } else {
        MouseClick "Right"               ; Perform single left-click
    }
}


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

; F5 key hotkey for drag lock with cursor change and ToolTip
$F5::
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
; F11 → New window (Ctrl+N)
; Opens a new window in browsers, File Explorer, and many other apps.
; ---------------------------
F11::Send "^n"



; ---------------------------
; - → Minimize active window
; ---------------------------
$-::
{
    WinMinimize "A"
    return
}



; ---------------------------
; = → Maximize/Restore active window
; ---------------------------
$=::
{
    WinGetMaximize := WinGetMinMax("A")
    if (WinGetMaximize = 1)  ; Window is maximized
        WinRestore "A"
    else
        WinMaximize "A"
    return
}
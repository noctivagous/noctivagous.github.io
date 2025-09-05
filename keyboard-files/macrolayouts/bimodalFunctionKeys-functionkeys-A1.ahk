#SingleInstance Force

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


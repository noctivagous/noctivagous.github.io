# chatroomstyle-chatbot-v1-2.py


"""

Chatroom Style Chatbot v1-2

Introduction

The script launches a window with a chatroom style GUI
for interacting with AI with shorter, more rapid 
responses than the conventional chatbot.

   - The LLM system prompt placed in the script limits the model's 
   responses in the chat to 1-3 paragraphs, letting the AI decide how long.
   - The AI's responses arrive in about 1-2 seconds using 
   a fast AI model.


Implementation

Uses Python tkinter (cross-platform GUI lib) and 
the Python llm library made by Simon Willison 
(https://github.com/simonw/llm).

Responses are processed by a markdown-rendering
function that converts them to the scrollview's own
tags provided by tkinter.

After the response is received, the script will
scroll the chat to 4 lines above the user's
query line “You: …”), setting up every query and response
to be read from the top.

What we're going for is to have the "You:" of the latest at the top of the scrollview after a response is received.  This way the user doesn't have to scroll up if the response exceeds the height of the scrollview


Layout

The scrollview is at the top and the one-line
input box is at the bottom.  Pressing the Return key submits.


To Do

 - Control + K - copy the last exchange to clipboard (You:... Grok:...)
 - Shift + Control + K - copy the entire session
 - Control + E - instant export session to file as .txt with timestamp in filename
 - Control + N - New Window (new chat session)
 - Clear Conversation - Control + Backspace
 
 
 - Menubar with listed commands (File, Edit, etc.)

 - Truncate user query's text in text to two lines.
 - After query is submitted, text input box looks like a progress
 bar then reverts to text input box when response is received.
 

 - Multiple submit buttons, show/hide in settings. Plus
       the ability to change the "Send" key.  
These buttons surround the input box. the Send is to the right.
The other buttons are underneath the input box.
Their titles also have Control + key shortcuts.
These correspond to different sections of the system prompt.
    - "Send" - Assigned to Return key.  Set as "QA" by default.
    - "Ask Questions" - Asks questions to clarify the user's intent.
    - "Cogitate" - checkbox
    - "Collect Info." - Such as for specs., requirements gathering.
    - "QA" - Answers with 1-3 paragraphs (default setting).
    - "Medium"
    - "Long"


- Settings window
    - AI models and vendors
    - font family, font size

- Save to sqllite or text files.


- Lefthand pane: documents and clippings (pasted on dropwell), selected
for the current session. 

- BBCode-style markup only, no markdown. 
    - Text styling tags, include font.
    - Layout tags
    - Commands
        - GUI commands [].
        - interactive sequences (sequence/flow and workflow tags)
        

- Convert to web front-end

"""


import tkinter as tk
from tkinter import scrolledtext, Menu
import ttkbootstrap as ttkb
from ttkbootstrap.constants import *
import llm
import threading
import queue
import re
from typing import List, Dict, Tuple
#import markdown2
from tkinter import Tk, font
import webbrowser
import atexit
import openai
import os   # add missing import
import datetime
import sys
import traceback
from tkinter import messagebox
from tkinter import Toplevel  # prepared for potential use


# ======================================================================
# SETTINGS AND CONFIG —
# ======================================================================
GROK_MODEL = "grok-4-1-fast-non-reasoning"   # ← edit this one line!
GROK_MODEL_REASONING = "grok-4-1-fast-reasoning"
# "grok-4-fast"                    # with reasoning (slower, more expensive)
# "grok-4"                         # full reasoning model
# "grok-beta"                      # previous generation

# ---------------------------------------------------------------------
# SETTINGS AND STYLE CONSTANTS (centralize fonts/colors)
# ---------------------------------------------------------------------
FONT_FAMILY = "Consolas"  # Primary monospace; Tkinter/system auto-falls back to Menlo/DejaVu Sans Mono/Courier New/monospace equivalents
MONO_FAMILY = FONT_FAMILY   # ← the ACTUAL tuple, not the string

# Tk will fall back safely on systems without Consolas
ENTRY_FONT   = (MONO_FAMILY, 15)
BOLD_FONT    = (MONO_FAMILY, 15, "bold")
ITALIC_FONT  = (MONO_FAMILY, 15, "italic")
CODE_FONT    = (FONT_FAMILY, 14)  # was ("monospace", 14)
H1_FONT      = (MONO_FAMILY, 18, "bold")
H2_FONT      = (MONO_FAMILY, 15, "bold")
H3_FONT      = (MONO_FAMILY, 13, "bold")
H4_FONT      = (MONO_FAMILY, 12, "bold")
SENDER_FONT  = (MONO_FAMILY, 15, "bold")



FONT_SIZE = 15
H1_SIZE = 18
H2_SIZE = 15
H3_SIZE = 13
H4_SIZE = 12

# Colors
HEADER_COLOR = "#fd7e14"      # primary header / accent
SENDER_COLOR = "#2f4e3f"      # Grok name color
CODE_BG = "#e9ecef"
CODE_FG = "#212529"
LINK_FG = "#0d6efd"
CHAT_BG = "#f8f9fa"
CHAT_FG = "#212529"

# Button style constants (centralized for consistency)
BUTTON_INFO_STYLE = INFO
BUTTON_SUCCESS_STYLE = SUCCESS
BUTTON_PRIMARY_STYLE = PRIMARY
BUTTON_DANGER_STYLE = DANGER
BUTTON_DARK_COLOR = "#ececec"  # Toned down from "#495057"

BUTTON_INFO_COLOR = "#f0f2f5"     # Neutral light gray (was "#0dcaf0")
BUTTON_SUCCESS_COLOR = "#f0f7f4"  # Light green-gray (was "#198754")
BUTTON_PRIMARY_COLOR = "#f4f6f5"  # Light blue-gray (was "#8f9e3c")
BUTTON_DANGER_COLOR = "#fdf4f4"   # Light red-gray (was "#dc3545")

# Bottom button colors (more subdued for input area buttons)
BOTTOM_INFO_COLOR = "#f2f7fc"        # Light cool gray-blue (was "#87CEEB")
BOTTOM_PRIMARY_COLOR = "#f8fafc"     # Very light gray (was "#6495ED")

# New: Mode-specific colors (slight tints in gray scheme)
SHORT_BUTTON_COLOR = "#e7f3ff"     # Light blue-gray tint for Short
MEDIUM_BUTTON_COLOR = "#e6f7e6"    # Light green-gray tint for Medium
LONG_BUTTON_COLOR = "#fff2e2"      # Light warm-gray tint for Long

# New: Subtle outline colors (shared across buttons)
OUTLINE_GRAY_LIGHT = "#f4f6f7"
OUTLINE_GRAY_DARK = "#e1e5e7"

# ---------------------------------------------------------------------

GRAY_COLOR_1= "#F0F0F0" #Classic Windows gray
GRAY_COLOR_2= "#E8E8E8" #A touch darker
GRAY_COLOR_3= "#F5F5F5" #Very slightly warmer
GRAY_COLOR_4= "#EAEAEA" #Soft modern gray

WINDOW_BG_COLOR= GRAY_COLOR_2
INITIAL_WINDOW_WIDTH = 700
INITIAL_WINDOW_HEIGHT = 950

# ======================================================================


# Persistent conversation storage — survives even if the model object changes
_GROK_CONVERSATION = None



# Put your xAI key in llm keys as "grok" or set XAI_API_KEY env var
client = openai.OpenAI(
    base_url="https://api.x.ai/v1",
    api_key=llm.get_key("grok") or os.getenv("XAI_API_KEY")
)

SYSTEM_PROMPT1 = """
You are Grok, a helpful and maximally truthful AI built by xAI.
You are in a chat window that looks like IRC. The system message may include a
single line starting with "MODE: <name>" which tells you the requested response style.
When a MODE line is present you must follow these rules exactly:

  - MODE: QA        -> Reply conversationally in 1–3 paragraphs.
  - MODE: Medium    -> Reply in medium length: produce 4–6 clear paragraphs/sections.
  - MODE: Long      -> Reply in long form: produce more than 6 paragraphs/sections.
  - MODE: Ask Questions -> Ask 2–3 focused questions to clarify the user's intent. Do not provide full answers.
  - MODE: Collect Info. -> Collect key details needed (list them) instead of answering.

Do not add irrelevant questions at the end of replies. Avoid using 'super' as an intensifier.
Make explicit [code]...[/code] markers for code blocks, for example:

[code]
def hello():
    print("hello")
[/code]
""".strip()

AVOIDANCE_FOR_SESSION = """
----------------------------------------------------------------------
Do not use the phrase "Think of [analogy/example]" or "Think [example]"
to explain anything.
----------------------------------------------------------------------

"""


SYSTEM_PROMPT2 = """
You are Grok, a helpful and maximally truthful AI built by xAI.
Do not use the phrase "Think of [analogy/example]" or "Think [example]"
to explain anything.

The system message will include a single "MODE: <name>" 
line instructing how long and what style to produce.
Follow these MODE rules exactly:

  - MODE: Short     -> Reply in 1-2 sentences.
  - MODE: QA        -> Reply conversationally in 1–3 paragraphs.
  - MODE: Medium    -> Reply in medium length: produce 4–6 clear paragraphs/sections.
  - MODE: Long      -> Reply in long form: produce more than 6 paragraphs/sections.
  - MODE: Ask Questions -> Ask 2–3 focused questions to clarify the user's intent with default answers.
  - MODE: Collect Info. -> Collect key details needed and list them; do not attempt to answer fully.

Send tables in unicode block characters, not markdown.

Make explicit [code]...[/code] markers for code blocks, for example:

[code]
def hello():
    print("hello")
[/code]
Use [form type="collectInfo"]...[/form] with [input name="..." label="..." value="..."], [select name="..." label="..." options="Gaming|Work|..."], [textarea name="..." label="..."] tags when gathering structured data from users.

--
Avoid using 'super' as an intensifier.

""".strip()


def generate_response_raw(messages: List[Dict[str, str]], addition: str = "", model: str | None = None) -> str:
    # Prepend the real system message if it's not already there
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT2 + addition}]
    for msg in messages:
        if msg["role"] == "assistant":  # llm library uses "assistant", xAI accepts it
            full_messages.append(msg)
        else:
            full_messages.append({"role": "user", "content": msg["content"]})

    model_to_use = model or GROK_MODEL
    response = client.chat.completions.create(
        model=model_to_use,
        messages=full_messages,
        temperature=0.5,
        max_tokens=2048,
    )
    return response.choices[0].message.content.strip()
        
# ----------------------------------------------------------------------
# --------------------------  USER HOOKS  -------------------------------
# ----------------------------------------------------------------------

    
    

def on_llm_error(exc: Exception) -> str:
    """
    **Hook** – format an exception for the UI.
    """
    msg = str(exc).lower()
    if "authentication" in msg or "api key" in msg:
        return "Authentication failed – run `llm keys set grok` with a valid xAI key."
    if "credit" in msg or "quota" in msg:
        return "Out of credits – top-up at https://console.x.ai"
    return f"LLM error: {exc}"

# ----------------------------------------------------------------------
# ---------------------  MARKDOWN → Tkinter HTML Renderer -------------
# ----------------------------------------------------------------------

# Precompute some colors/fonts that look good with ttkbootstrap "cosmo"
# (Use the centralized constants declared above; remove duplicate local style defs)
# HEADER_COLOR = "#fd7e14"      # orange
# CODE_BG = "#e9ecef"
# CODE_FG = "#212529"
# LINK_FG = "#0d6efd"
# GROK_NAME_COLOR = "#2f4e3f"

# ----------------------------------------------------------------------
# ---------------------  Simple Regex-Based Markdown Renderer ---------
# ----------------------------------------------------------------------

    
def parse_form_fields(form_text: str) -> list[dict]:
    """Parse [input|select|textarea] tags inside form block into field dicts."""
    fields = []
    tag_pattern = re.compile(r'\[(input|select|textarea)(?:\s+([^]]+))?\]')
    for match in tag_pattern.finditer(form_text):
        ftype = match.group(1)
        attrs_str = match.group(2) or ""
        attrs = {}
        attr_pattern = re.compile(r'(\w+)="([^"]*)"')
        for attr_match in attr_pattern.finditer(attrs_str):
            attrs[attr_match.group(1)] = attr_match.group(2)
        if 'name' not in attrs:
            continue
        field = {
            'type': ftype,
            'name': attrs['name'],
            'label': attrs.get('label', attrs['name'].title()),
            'value': attrs.get('value', '')
        }
        if 'options' in attrs:
            field['options'] = [opt.strip() for opt in attrs['options'].split('|')]
        fields.append(field)
    return fields

# ------------------------------------------------------------
# Move FormFrame here so it's defined before render_markdown_message
# ------------------------------------------------------------
class FormFrame(tk.Frame):
    def __init__(self, parent_text_widget, fields, bot):
        self.scrolledtext = parent_text_widget
        try:
            self.inner_text = self.scrolledtext.text
        except AttributeError:
            print("[DEBUG] ScrolledText.text not available; falling back to outer widget", file=sys.stderr)
            self.inner_text = self.scrolledtext
        super().__init__(self.inner_text, bg=CHAT_BG, highlightthickness=0, bd=0)

        self.bot = bot
        self.fields = {}

        # Single column layout
        self.columnconfigure(0, weight=1)

        # Build form fields
        row = 0
        for field in fields:
            lbl = ttkb.Label(self, text=field['label'], font=ENTRY_FONT)
            lbl.grid(row=row, column=0, sticky="ew", padx=10, pady=(10, 2))

            row += 1
            name = field['name']

            if field['type'] == "input":
                w = ttkb.Entry(self, font=ENTRY_FONT)
                w.grid(row=row, column=0, sticky="ew", padx=10, pady=(0, 10))
                self.fields[name] = w
                if field.get("value"):
                    w.insert(0, field["value"])

            elif field['type'] == "textarea":
                w = tk.Text(self, height=3, wrap="word", font=ENTRY_FONT, relief="solid", bd=1)
                w.grid(row=row, column=0, sticky="ew", padx=10, pady=(0, 10))
                self.fields[name] = w
                if field.get("value"):
                    w.insert("1.0", field["value"])

            elif field['type'] == "select":
                var = tk.StringVar(value=field.get("value", ""))
                field_frame = tk.Frame(self, bg=CHAT_BG)
                field_frame.grid(row=row, column=0, sticky="ew", padx=10, pady=(0, 10))
                for opt in field.get('options', []):
                    rb = ttkb.Radiobutton(field_frame, text=opt, variable=var, value=opt)
                    rb.pack(anchor="w", padx=(15, 0), pady=1)
                self.fields[name] = var

            row += 1

        # Submit button
        self.submit_btn = ttkb.Button(self, text="Submit (Ctrl+Shift+S)",
                                      command=self.submit, bootstyle="primary")
        self.submit_btn.grid(row=row, column=0, sticky="ew", padx=10, pady=(5, 10))

        # Resize now that the Text widget knows its size
        self.after_idle(self.resize_to_text_width)

    def resize_to_text_width(self):
        try:
            text_width = self.inner_text.winfo_width()
            target = max(300, text_width - 40)
            self.configure(width=target)
            self.grid_columnconfigure(0, minsize=target - 20, weight=1)
        except Exception as e:
            print(f"[DEBUG] resize_to_text_width error: {e}", file=sys.stderr)

    def submit(self):
        data = {}
        for name, thing in self.fields.items():
            if isinstance(thing, tk.StringVar):
                val = thing.get().strip()
            elif isinstance(thing, tk.Text):
                val = thing.get("1.0", "end-1c").strip()
            elif hasattr(thing, 'get'):
                val = thing.get().strip()
            else:
                val = ''
            if val:
                data[name] = val

        summary = "Form data: " + ", ".join(f"{k}={v}" for k, v in data.items())
        self.bot.submit_form_data(summary, self)

def create_form_frame(widget, fields, bot):
    print(f"[DEBUG] Creating form with {len(fields)} fields: {[f['name'] for f in fields]}", file=sys.stderr)
    try:
        frame = FormFrame(widget, fields, bot)
        print("[DEBUG] FormFrame created successfully", file=sys.stderr)
        return frame
    except Exception as e:
        print(f"[DEBUG] FormFrame init failed: {e}", file=sys.stderr)
        traceback.print_exc()
        # Fallback parent to outer widget (safe)
        fallback = tk.Label(widget, text="[Form could not be displayed]",
                            bg=CHAT_BG, fg="blue", font=BOLD_FONT)
        return fallback


def render_markdown_message(widget: scrolledtext.ScrolledText, sender: str, text: str, bot=None) -> None:
    widget.config(state="normal")
    widget.insert(tk.END, f"{sender}: ", "sender")
    
    # NEW: Strip reasoning if Grok response
    if sender == "Grok":
        text = re.sub(r'\[reasoning\].*?\[/reasoning\]', '', text, flags=re.DOTALL | re.IGNORECASE)
    
    # Detect form blocks first
    form_pattern = re.compile(r'\[form type="collectInfo"\](.*?)\[/form\]', re.DOTALL | re.IGNORECASE)
    pos = 0
    form_count = 0
    for match in form_pattern.finditer(text):
        form_count += 1
        print(f"[DEBUG] Found form #{form_count} at {match.start()}:{match.end()}", file=sys.stderr)
        
        # Insert text before form
        if match.start() > pos:
            _process_text_block(widget, text[pos:match.start()])
        
        # Parse and embed form
        form_text = match.group(1)
        fields = parse_form_fields(form_text)
        print(f"[DEBUG] Parsed {len(fields)} fields from form_text: {form_text[:100]}...", file=sys.stderr)

        form_frame = create_form_frame(widget, fields, bot)

        start_mark = f"form_start_{id(form_frame)}"
        widget.mark_set(start_mark, tk.END)
        widget.insert(tk.END, "\n")

        print("[DEBUG] Attempting window_create...", file=sys.stderr)
        try:
            widget.window_create(tk.END, window=form_frame, padx=10, pady=10)
            widget.insert(tk.END, "\n")
            print("[DEBUG] window_create succeeded", file=sys.stderr)
        except Exception as exc:
            print(f"[DEBUG] window_create FAILED: {exc}", file=sys.stderr)
            traceback.print_exc()
            # If window_create fails, print and render a plaintext fallback
            print("Failed to embed form widget in text widget:", exc, file=sys.stderr)
            traceback.print_exc()
            for f in fields:
                lbl = f.get("label", f.get("name", ""))
                val = f.get("value", "")
                widget.insert(tk.END, f"{lbl}: {val}\n")
            widget.insert(tk.END, "\n")
            pos = match.end()
            continue

        end_mark = f"form_end_{id(form_frame)}"
        widget.mark_set(end_mark, tk.END)
        
        # Track form with start/end marks (so indices remain valid as content changes)
        if bot is not None and hasattr(bot, "forms"):
            try:
                # Some fallback frames won't include submit_btn or fields, but we still track the widget
                bot.forms.append((start_mark, end_mark, form_frame, {f['name']: f for f in fields}))
            except Exception as e:
                print("Failed to append form record to bot.forms:", e, file=sys.stderr)
                traceback.print_exc()
        # attach bot reference if frame supports it
        try:
            form_frame.bot = bot
        except Exception:
            pass
        
        pos = match.end()
    
    # Remaining text
    if pos < len(text):
        _process_text_block(widget, text[pos:])
    
    widget.insert(tk.END, "\n")
    widget.config(state="disabled")

    print(f"[DEBUG] render_markdown_message complete: processed {form_count} forms", file=sys.stderr)

def _process_text_block(widget, text_block):
    """Process non-form text block (existing markdown logic)."""
    # Prefer explicit [code]...[/code] markers for code blocks.
    # Convert any case-variant of [code] and [/code] to temporary tokens,
    # strip all existing triple-backtick markers (which are often left
    # unterminated and cause rendering problems), then restore our
    # canonical fences so the downstream parser treats only the
    # [code]...[/code] regions as code blocks.
    START_TOKEN = "___CUSTOM_CODE_START___"
    END_TOKEN = "___CUSTOM_CODE_END___"
    # make [code] handling case-insensitive
    text_block = re.sub(r"\[code\]", START_TOKEN, text_block, flags=re.IGNORECASE)
    text_block = re.sub(r"\[/code\]", END_TOKEN, text_block, flags=re.IGNORECASE)
    # remove any stray triple-backticks to avoid accidental unclosed blocks
    text_block = text_block.replace("```", "")
    # restore our canonical fences for only the [code] blocks
    text_block = text_block.replace(START_TOKEN, "```").replace(END_TOKEN, "```")
    
    lines = text_block.splitlines()
    i = 0
    in_code_block = False
    code_block_start = None

    while i < len(lines):
        raw_line = lines[i]
        line = raw_line.strip()

        if in_code_block:
            # Check for end of code block
            if line.startswith("```") or line == "```":
                _apply_code_tags(widget, code_block_start)
                in_code_block = False
                code_block_start = None
                widget.insert(tk.END, "\n\n")  # nice spacing after block
                i += 1
                continue

            # Inside code block — insert the raw line and tag it
            start = widget.index(tk.END)
            widget.insert(tk.END, raw_line + "\n")
            widget.tag_add("code", start, widget.index(tk.END))
            i += 1
            continue

        # Start of code block
        if line.startswith("```") or line == "```":
            in_code_block = True
            code_block_start = widget.index(tk.END)
            widget.insert(tk.END, "\n")  # space before block
            i += 1
            continue
            
        # Headers (handle first)
        if _handle_header(widget, line, i, lines):
            i += 1
            continue

        # Process inline elements: bold, italic, code, links
        _process_inline_elements(widget, raw_line)
        widget.insert(tk.END, "\n")
        i += 1

    # If ended in code block (unclosed), apply tag anyway
    if in_code_block and code_block_start:
        _apply_code_tags(widget, code_block_start)
        widget.insert(tk.END, "\n")

    widget.insert(tk.END, "\n")
    # Remove: widget.config(state="disabled")
    # widget.see(tk.END)  # remove to allow custom scrolling

def _apply_code_tags(widget, code_block_start):
    """Apply code tags to the entire code block."""
    if code_block_start is not None:
        current = code_block_start
        while True:
            next_line = widget.index(f"{current} lineend + 1c")
            if widget.compare(next_line, ">", widget.index(tk.END + "-2c")):  # last line
                widget.tag_add("code", current, tk.END)
                break
            widget.tag_add("code", current, next_line)
            current = next_line

def _handle_header(widget, line, i, lines):
    """Handle header lines and return True if processed."""
    if line.startswith("### "):
        content = line[4:]
        widget.insert(tk.END, content + "\n\n", "h3")
        return True
    elif line.startswith("#### "):
        content = line[3:]
        widget.insert(tk.END, content + "\n\n", "h4")
        return True
    elif line.startswith("## "):
        content = line[3:]
        widget.insert(tk.END, content + "\n\n", "h2")
        return True
    elif line.startswith("# "):
        content = line[2:]
        widget.insert(tk.END, content + "\n\n", "h1")
        return True
    return False

def _process_inline_elements(widget, raw_line):
    """Process inline markdown elements in a line."""
    pos = 0
    inline_patterns = re.compile(r'(\*\*|__)(.*?)\1|(\*|_)(.*?)\3|`([^`]+)`|\[([^]]+)\]\(([^)]+)\)')

    for match in inline_patterns.finditer(raw_line):
        # Insert text before match
        if match.start() > pos:
            widget.insert(tk.END, raw_line[pos:match.start()])

        # Handle matched inline
        if match.group(1):  # Bold
            content = match.group(2)
            start = widget.index(tk.END)
            widget.insert(tk.END, content)
            widget.tag_add("bold", start, widget.index(tk.END))
        elif match.group(3):  # Italic
            content = match.group(4)
            start = widget.index(tk.END)
            widget.insert(tk.END, content)
            widget.tag_add("italic", start, widget.index(tk.END))
        elif match.group(5):  # Inline code
            content = match.group(5)
            start = widget.index(tk.END)
            widget.insert(tk.END, content)
            widget.tag_add("code", start, widget.index(tk.END))
        elif match.group(6):  # Link
            link_text = match.group(6)
            url = match.group(7)
            start = widget.index(tk.END)
            widget.insert(tk.END, link_text)
            end = widget.index(tk.END)
            tag_name = f"link_{start}"
            widget.tag_config(tag_name, foreground="#58f5ab", underline=True)
            widget.tag_add(tag_name, start, end)
            widget.tag_bind(tag_name, "<Button-1>", lambda e, u=url: webbrowser.open(u))

        pos = match.end()

    # Insert remaining text
    if pos < len(raw_line):
        widget.insert(tk.END, raw_line[pos:])

class SessionManager:
    def __init__(self):
        self.sessions = []
        # Track position for cascading new windows
        self._window_x = 100
        self._window_y = 0

    def create_session(self):
        """Create a new top-level window and GrokChatBot, register and return it."""
        # Calculate position for this new window (cascade 100px right/down)
        # Use temporary root to query screen dimensions without creating visible window
        temp_root = tk.Tk()
        temp_root.withdraw()  # Hide it
        screen_width = temp_root.winfo_screenwidth()
        screen_height = temp_root.winfo_screenheight()
        temp_root.destroy()  # Clean up
        window_width = INITIAL_WINDOW_WIDTH
        window_height = INITIAL_WINDOW_HEIGHT

        # Position: 100px right and down from previous, wrap around if off-screen
        new_x = self._window_x
        new_y = self._window_y

        # Check if this position would be off-screen
        if new_x + window_width > screen_width or new_y + window_height > screen_height:
            # Reset to starting position (top-left with offset)
            self._window_x = 100
            self._window_y = 0
            new_x = self._window_x
            new_y = self._window_y
        else:
            # Advance for next window
            self._window_x += 100
            self._window_y += 100

        # Create window at calculated position
        new_root = ttkb.Window(themename="cosmo")
        new_root.title(f"Chatroom Style Chatbot - Session {len(self.sessions) + 1}")
        new_root.geometry(f"{window_width}x{window_height}+{new_x}+{new_y}")

        # Fresh coordinated palette — clean, modern, and readable.
        style = ttkb.Style()

        # --- Core Neutrals ---
        BASE_BG       = "#f4f4f7"   # neutral pale gray
        BASE_BG_HOVER = "#e6e6eb"   # hover/active tint
        BASE_FG       = "#26272b"   # deep gray text
        BASE_BORDER   = "#c8c9cf"   # soft border

        # --- Soft Accent Family (new set) ---
        ACCENT_SKY      = "#e3f2ff"   # soft sky
        ACCENT_MINT     = "#ddf7ec"   # soft mint
        ACCENT_LAVENDER = "#f1e9ff"   # soft lavender
        ACCENT_CORAL    = "#ffe8e4"   # soft coral
        ACCENT_GOLD     = "#fff6d9"   # soft gold

        # -------------------------
        # Unified Styled Buttons
        # -------------------------
        style.configure("primary.TButton",
                        background=ACCENT_SKY,
                        foreground=BASE_FG,
                        bordercolor=BASE_BORDER)

        style.configure("success.TButton",
                        background=ACCENT_MINT,
                        foreground=BASE_FG,
                        bordercolor=BASE_BORDER)

        style.configure("info.TButton",
                        background=ACCENT_LAVENDER,
                        foreground=BASE_FG,
                        bordercolor=BASE_BORDER)

        style.configure("danger.TButton",
                        background=ACCENT_CORAL,
                        foreground=BASE_FG,
                        bordercolor=BASE_BORDER)

        style.configure("secondary.TButton",
                        background=BASE_BG,
                        foreground=BASE_FG,
                        bordercolor=BASE_BORDER)

        style.configure("warning.TButton",
                        background=ACCENT_GOLD,
                        foreground=BASE_FG,
                        bordercolor=BASE_BORDER)

        style.configure("submitByLength.TButton",
                        background="#1b1c27",
                        foreground=BASE_FG,
                        bordercolor=BASE_BORDER)

        style.configure("submitByLength2.TButton",
                        background="#1b1c27",
                        foreground=BASE_FG,
                        bordercolor=BASE_BORDER)

        bot = GrokChatBot(new_root, self)
        self.sessions.append(bot)
        return bot

    def close_session(self, bot):
        """Close and unregister the given session. If none remain, quit the app."""
        # Let the bot perform a graceful shutdown (cancels after callbacks, etc.)
        try:
            if hasattr(bot, "close"):
                bot.close()
            else:
                bot.root.destroy()
        except Exception:
            pass

        # Remove from list if present
        try:
            self.sessions.remove(bot)
        except ValueError:
            pass

        # If no sessions left, quit mainloop to exit the application
        if not self.sessions:
            try:
                if tk._default_root:
                    tk._default_root.quit()
            except Exception:
                pass

class GrokChatBot:
    def __init__(self, root, manager: SessionManager):
        self.root = root
        # register manager early so bindings can reference it
        self.manager = manager
        # manager will register us in create_session, avoid double-add here
        # Running flag and after-id for safe cancellation on close
        self._running = True
        self._after_id = None
        #        self.root.title("Grok Chatbot (Powered by xAI & Python LLM Library)")
        #        self.root.geometry(f"{INITIAL_WINDOW_WIDTH}x{INITIAL_WINDOW_HEIGHT}")
        self.root.configure(bg=WINDOW_BG_COLOR)

        # Use grid on root (3 rows: buttons + chat area + input area)
        self.root.grid_rowconfigure(0, weight=0)   # buttons fixed
        self.root.grid_rowconfigure(1, weight=1)   # chat grows
        self.root.grid_rowconfigure(2, weight=0)   # input fixed
        self.root.grid_columnconfigure(0, weight=1)

        # --- moved up: mode instructions and cogitate_var must exist before widgets/bindings ---
        self.mode_instructions = {
            "Short": "\n\nRespond in 1-2 sentences.",
            "QA": "\n\nRespond in 1-3 paragraphs, conversationally.",
            "Medium": "\n\nProvide a medium-length response, up to 5 paragraphs.",
            "Long": "\n\nProvide a detailed, long response without length restrictions.",
            "Ask Questions": "\n\nAsk 2-3 questions to clarify the user's intent. Do not provide full answers yet.",
            "Collect Info.": "\n\nCollect information by asking about specifications and requirements. List key details needed.",
        }
        self.cogitate_var = tk.BooleanVar(value=False)
        # ------------------------------------------------------------------------------

        self._setup_menubar()
        self._setup_buttons()
        self._setup_chat_display()
        self._setup_input_area()
        self._setup_tags()
        self._setup_bindings()

        # Threading & welcome (unchanged)
        self.response_queue = queue.Queue()
        self.conversation: List[Dict[str, str]] = []
        self.check_queue()

        self.add_to_chat(
            "Grok",
            f"Hello! I'm Grok, built by xAI. (Powered by **{GROK_MODEL}**).",
        )

        self.last_user_start = None  # consistent name, was unused index

        # Ensure closing this window is routed to the session manager
        try:
            self.root.protocol("WM_DELETE_WINDOW", lambda ev=None: self.manager.close_session(self))
        except Exception:
            # In case protocol isn't available, ignore
            pass

        # NEW: state tracking for Ask Questions mode
        self.in_ask_questions_mode = False
        self.ask_questions_first = False

        # NEW: form state tracking
        self.forms = []  # list of (start_mark, end_mark, form_frame, fields_dict)
        self.active_form = None

        # NEW: first submission tracking
        self.first_submission = True  # Track if first submission in session

    def close(self):
        """Gracefully stop periodic callbacks and destroy the window."""
        # Prevent further rescheduling
        self._running = False
        # Cancel scheduled after callback if present
        try:
            if self._after_id is not None:
                try:
                    self.root.after_cancel(self._after_id)
                except Exception:
                    pass
                self._after_id = None
        except Exception:
            pass
        # Stop progress bar if running and re-enable entry (best-effort)
        try:
            self.progress.stop()
        except Exception:
            pass
        try:
            # Finally, destroy the window
            if self.root.winfo_exists():
                self.root.destroy()
        except Exception:
            pass

    def _setup_buttons(self):
        """Setup a grid of action buttons above the chat display."""
        self.buttons_frame = tk.Frame(self.root, relief="flat", bg=WINDOW_BG_COLOR)
        self.buttons_frame.grid(row=0, column=0, padx=10, pady=(10, 5), sticky="ew")
        # Set all columns to have equal weight for even expansion
        for i in range(3):
            self.buttons_frame.grid_columnconfigure(i, weight=1)

        # Define a fixed width for all top buttons (in text units)
        BUTTON_WIDTH = 24

        # Row 0: Copy actions and Export
        ttkb.Button(
            self.buttons_frame, text="Copy Last Exchange (Ctrl+K)", command=self.copy_last_exchange,
            bootstyle=BUTTON_INFO_STYLE, width=BUTTON_WIDTH
        ).grid(row=0, column=0, padx=5, pady=2, sticky="ew")

        ttkb.Button(
            self.buttons_frame, text="Copy Entire Session (Ctrl+Shift+K)", command=self.copy_entire_session,
            bootstyle=BUTTON_INFO_STYLE, width=BUTTON_WIDTH
        ).grid(row=0, column=1, padx=5, pady=2, sticky="ew")

        ttkb.Button(
            self.buttons_frame, text="Export Session (Ctrl+E)", command=self.export_session,
            bootstyle=BUTTON_SUCCESS_STYLE, width=BUTTON_WIDTH
        ).grid(row=0, column=2, padx=5, pady=2, sticky="ew")

        # Row 1: New Session and Clear
        ttkb.Button(
            self.buttons_frame, text="New Session (Ctrl+N)", command=self.new_session,
            bootstyle=BUTTON_PRIMARY_STYLE, width=BUTTON_WIDTH
        ).grid(row=1, column=0, padx=5, pady=2, sticky="ew")

        ttkb.Button(
            self.buttons_frame, text="Clear Conversation (Ctrl+Backspace)", command=self.clear_conversation,
            bootstyle=BUTTON_DANGER_STYLE, width=BUTTON_WIDTH
        ).grid(row=1, column=1, padx=5, pady=2, sticky="ew")

        # New Quit button to the right (row 1, col 2) — attempt to force black appearance
        quit_btn = ttkb.Button(
            self.buttons_frame,
            text="Quit (Ctrl+Q)",
            command=lambda: self.manager.close_session(self),
            bootstyle="secondary",  # Updated to new palette
            width=BUTTON_WIDTH
        )
        quit_btn.grid(row=1, column=2, padx=5, pady=2, sticky="ew")

    def _setup_chat_display(self):
        """Setup the scrolled text widget for chat display."""
        # Make the text widget visually borderless so it blends with the input frame
        
        self.chat_display = scrolledtext.ScrolledText(
            self.root,
            wrap=tk.WORD,
            state="disabled",
            font=(FONT_FAMILY, FONT_SIZE),
            bg=CHAT_BG,
            fg=CHAT_FG,
            insertbackground=CHAT_FG,
            padx=10,
            pady=10,
            relief="flat",
            bd=0,
            highlightthickness=0,
        )
        self.chat_display.grid(row=1, column=0, padx=10, pady=(5, 0), sticky="nsew")
        self._setup_context_menu(self.chat_display)
        # NEW: bind resize event for forms
        self.chat_display.bind("<Configure>", self._resize_forms)

        # Configure tags once here for efficiency
        self.chat_display.tag_config("bold", font=BOLD_FONT)
        self.chat_display.tag_config("italic", font=ITALIC_FONT)
        self.chat_display.tag_config("code", font=CODE_FONT, background=CODE_BG, foreground=CODE_FG,
                                     relief="solid", borderwidth=1, spacing1=2, spacing3=2)
        self.chat_display.tag_config("h1", font=H1_FONT, foreground=HEADER_COLOR)
        self.chat_display.tag_config("h2", font=H2_FONT, foreground=HEADER_COLOR)
        self.chat_display.tag_config("h3", font=H3_FONT, foreground=HEADER_COLOR)
        self.chat_display.tag_config("h4", font=H4_FONT, foreground=HEADER_COLOR)
        self.chat_display.tag_config("sender", font=SENDER_FONT, foreground=SENDER_COLOR)
        self.chat_display.tag_config("form", foreground="blue", font=BOLD_FONT)

    def _setup_tags(self):
        """Placeholder for additional tag configurations if needed."""
        pass  # Tags are now configured in _setup_chat_display

    def _setup_bindings(self):
        """Setup keyboard shortcuts for actions and modes."""
        # Action shortcuts
        self.root.bind("<Control-n>", self.new_session)
        self.root.bind("<Control-k>", self.copy_last_exchange)
        self.root.bind("<Control-Shift-K>", self.copy_entire_session)
        self.root.bind("<Control-e>", self.export_session)
        self.root.bind("<Control-BackSpace>", self.clear_conversation)

        # Add Quit (Ctrl+Q) binding
        self.root.bind("<Control-q>", lambda e: (self.manager.close_session(self) or "break"))
        self.root.bind("<Control-Q>", lambda e: (self.manager.close_session(self) or "break"))

        # Mode shortcuts — invoke the actual buttons so UI behavior stays consistent
        # Note: use bind_all for numeric Ctrl shortcuts so they work even when the Entry has focus.
        # Bind both "<Control-#>" and "<Control-Key-#>" forms for broader platform compatibility.
        self.root.bind_all("<Control-1>", lambda e: (self._invoke_mode_button("Short") or "break"))
        self.root.bind_all("<Control-Key-1>", lambda e: (self._invoke_mode_button("Short") or "break"))
        self.root.bind_all("<Control-2>", lambda e: (self._invoke_mode_button("Medium") or "break"))
        self.root.bind_all("<Control-Key-2>", lambda e: (self._invoke_mode_button("Medium") or "break"))
        self.root.bind_all("<Control-3>", lambda e: (self._invoke_mode_button("Long") or "break"))
        self.root.bind_all("<Control-Key-3>", lambda e: (self._invoke_mode_button("Long") or "break"))
        self.root.bind_all("<Control-4>", lambda e: (self._invoke_mode_button("Ask Questions") or "break"))
        self.root.bind_all("<Control-Key-4>", lambda e: (self._invoke_mode_button("Ask Questions") or "break"))
        self.root.bind_all("<Control-5>", lambda e: (self._invoke_mode_button("Collect Info.") or "break"))
        self.root.bind_all("<Control-Key-5>", lambda e: (self._invoke_mode_button("Collect Info.") or "break"))

        # Cogitate toggle
        self.root.bind("<Control-g>", lambda e: (self.cogitate_var.set(not self.cogitate_var.get()), "break")[1])

        # Form submission
        self.root.bind_all("<Control-Shift-S>", self.submit_active_form)
        self.chat_display.bind("<FocusIn>", lambda e: setattr(self, 'active_form', None))

    def add_to_chat(self, sender: str, message: str, mode: str | None = None) -> None:
        """Add a message to the chat display with markdown rendering."""
        display_message = message
        if sender == "You" and mode is not None:
            MAX_CHARS = 160
            if len(message) > MAX_CHARS:
                truncated = message[:MAX_CHARS].rstrip()
                last_space = truncated.rfind(" ")
                if last_space > 0:
                    truncated = truncated[:last_space].rstrip()
                display_message = truncated + "..." + f" [{mode}]"
            else:
                display_message = message + f" [{mode}]"
        render_markdown_message(self.chat_display, sender, display_message, self)

    def _setup_input_area(self):
        """Setup the input frame, entry, and send button."""
        # Single, borderless frame that matches the root bg so no seam shows.
        # Use a regular tk.Frame so we can set a bg color directly (ttk.Frame doesn't accept background).
        self.input_frame = tk.Frame(self.root, relief="flat", bg=WINDOW_BG_COLOR)
        self.input_frame.grid(row=2, column=0, padx=10, pady=(0, 10), sticky="ew")
        self.input_frame.grid_columnconfigure(0, weight=1)  # entry expands

        # Entry: make visually flat to avoid borders/seams
        self.entry = ttkb.Entry(self.input_frame, font=(FONT_FAMILY, 11))
        self.entry.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        # ttk widgets don't always accept 'bd'/'relief' but safe to set highlight thickness
        try:
            self.entry.configure(background=WINDOW_BG_COLOR, highlightthickness=0, bd=0, relief="flat")
        except Exception:
            # ignore if the style backend doesn't accept those options
            pass
        self.entry.bind("<Return>", lambda e: self.send_with_mode("QA") or "break")
        self.entry.focus_set()
        self._setup_context_menu(self.entry)

        self.send_btn = ttkb.Button(
            self.input_frame, text="Send", command=lambda: self.send_with_mode("QA"), bootstyle="submitByLength2"
        )
        self.send_btn.grid(row=0, column=1)

        # Add progress bar, initially not gridded — make it visually flat as well
        self.progress = ttkb.Progressbar(self.input_frame, mode='indeterminate', bootstyle="secondary")
        try:
            self.progress.configure(troughcolor=WINDOW_BG_COLOR, borderwidth=0, highlightthickness=0)
        except Exception:
            pass

        # Modes frame underneath
        self.modes_frame = tk.Frame(self.input_frame, relief="flat", bg=WINDOW_BG_COLOR)
        self.modes_frame.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(5, 0))
        self.modes_frame.grid_columnconfigure((0, 1, 2), weight=1)

        # Keep references to mode buttons so we can invoke them from key bindings
        self.mode_buttons = {}

        # Helper to create mode buttons
        def create_mode_button(text: str, mode: str, shortcut: str, row: int, col: int, bootstyle=SECONDARY):
            btn = ttkb.Button(
                self.modes_frame,
                text=f"{text} ({shortcut})",
                command=lambda m=mode: self.send_with_mode(m),
                bootstyle=bootstyle
            )
            btn.grid(row=row, column=col, padx=2, pady=2, sticky="ew")
            # register for programmatic invocation from keyboard bindings
            self.mode_buttons[mode] = btn
            return btn

        # -------------------------
        # Mode Buttons (coordinated)
        # -------------------------
        MODE_STYLE = "secondary"

        # Row 0
        create_mode_button("Short", "Short", "Ctrl+1", 0, 0, "submitByLength")
        create_mode_button("Ask Questions", "Ask Questions", "Ctrl+4", 0, 1, MODE_STYLE)
        create_mode_button("Collect Info.", "Collect Info.", "Ctrl+5", 0, 2, MODE_STYLE)

        # Row 1
        create_mode_button("Medium", "Medium", "Ctrl+2", 1, 0, "submitByLength")
        create_mode_button("Long", "Long", "Ctrl+3", 1, 1, "submitByLength")

        # Cogitate checkbox
        ttkb.Checkbutton(
            self.modes_frame,
            text="Cogitate (Ctrl+G)",
            variable=self.cogitate_var,
            bootstyle="secondary"
        ).grid(row=1, column=2, sticky="w", padx=2, pady=2)

    def _send_request(self, user_input: str, addition: str, user_mode_display: str | None, model: str) -> None:
        """Common logic to send user input: add to chat/conversation, start progress, launch worker."""
        # Prepend AVOIDANCE_FOR_SESSION to first submission in session
       # if self.first_submission:
        addition = AVOIDANCE_FOR_SESSION + "\n" + addition
         #   self.first_submission = False

        self.last_user_start = self.chat_display.index(tk.END)
        self.add_to_chat("You", user_input, mode=user_mode_display)
        self.conversation.append({"role": "user", "content": user_input})
        self.entry.delete(0, tk.END)
        self.chat_display.see(tk.END)
        # Switch to progress bar
        self.entry.grid_remove()
        self.progress.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        self.progress.start()
        self.send_btn.configure(state="disabled")
        threading.Thread(target=lambda: self._worker(addition, model), daemon=True).start()

    def send_with_mode(self, mode: str, event=None) -> None:
        user_input = self.entry.get().strip()
        if not user_input:
            return

        special_addition = None
        effective_mode = mode
        user_mode_display = effective_mode if effective_mode != "QA" else None

        if self.in_ask_questions_mode:
            if user_input == '...':
                self.in_ask_questions_mode = False
                special_addition = f"""
MODE: QA

{self.mode_instructions.get("QA", "")}

You have just exited Ask Questions mode. Summarize the key information collected from the recent conversation history, then provide a full conversational response to the original user query.

Begin your response with: [I've got the info. I need.]
                """.strip()
                user_mode_display = None
            else:
                # Force continue Ask Questions mode
                effective_mode = "Ask Questions"
                user_mode_display = "Ask Questions"
        elif mode == "Ask Questions":
            self.in_ask_questions_mode = True
            self.ask_questions_first = True
            effective_mode = "Ask Questions"
            user_mode_display = "Ask Questions"

        if special_addition:
            addition = "\n\n" + special_addition
        else:
            mode_label = f"\n\nMODE: {effective_mode}\n\n"
            addition = mode_label + self.mode_instructions.get(effective_mode, "")
            if effective_mode == "Ask Questions":
                first_instruction = "\n\nBegin your first response in this mode with exactly: [Begin Asking Questions]" if self.ask_questions_first else ""
                if self.ask_questions_first:
                    self.ask_questions_first = False
                cont_instruction = """
Continue asking 2-3 focused questions based on the conversation history to clarify and gather details. Do not answer fully yet.

Always end your response with exactly: "(Type '...' and I'll proceed with info. so far)"
                """.strip()
                addition += first_instruction + "\n\n" + cont_instruction

        model_to_use = GROK_MODEL_REASONING if self.cogitate_var.get() else GROK_MODEL
        print(f"[DEBUG] Sending with mode '{effective_mode}', cogitate={self.cogitate_var.get()}, model={model_to_use}", file=sys.stderr)
        
        # NEW: Cogitate instruction and tag
        if self.cogitate_var.get():
            cogitate_instruction = """
COGITATE: enabled

Output your step-by-step reasoning first, wrapped exactly as:

[reasoning]
your detailed reasoning steps here
[/reasoning]

Then provide your response according to the MODE instructions.

The [reasoning] section will not be shown to the user.
        """.strip()
            addition = cogitate_instruction + "\n\n" + addition
            
            cogi_tag = "Cogitate"
            if user_mode_display is not None:
                user_mode_display += f" + {cogi_tag}"
            else:
                user_mode_display = cogi_tag
    
        self._send_request(user_input, addition, user_mode_display, model_to_use)

    # ------------------------------------------------------------------
    def _worker(self, addition: str, model: str) -> None:
        """Runs in a background thread – calls the hook."""
        try:
            bot_reply = generate_response_raw(self.conversation, addition, model)
            self.conversation.append({"role": "assistant", "content": bot_reply})
            self.response_queue.put(("success", bot_reply))
        except Exception as e:
            self.response_queue.put(("error", on_llm_error(e)))

    # ------------------------------------------------------------------
    def check_queue(self) -> None:
        try:
            while True:
                typ, msg = self.response_queue.get_nowait()
                self.add_to_chat("Grok", msg)

                # custom scrolling after adding Grok message
                if typ == "success" and self.last_user_start is not None:
                    # Schedule scrolling to run after the widget has laid out the
                    # new text. Using `after_idle` ensures the Text widget's
                    # display line counts are up-to-date, which fixes the case
                    # where the first response arrives and immediate scrolling
                    # can't locate the saved "You:" position correctly.
                    try:
                        self.root.after_idle(self._scroll_to_last_user)
                    except tk.TclError:
                        self.chat_display.see(self.last_user_start)
                else:
                    # for error or initial (no last_user)
                    self.chat_display.see(tk.END)

                # Revert to entry after response (success or error)
                self.progress.stop()
                self.progress.grid_remove()
                self.entry.grid(row=0, column=0, sticky="ew", padx=(0, 10))
                self.entry.focus_set()
                self.send_btn.configure(state="normal")

        except queue.Empty:
            pass
        # Only reschedule if still running; store the after-id so it can be cancelled on close()
        if self._running:
            try:
                self._after_id = self.root.after(100, self.check_queue)
            except Exception:
                # If scheduling fails (window closing), ensure we don't loop forever
                self._after_id = None

    def _setup_context_menu(self, widget: tk.Widget) -> None:
        """Setup right-click context menu for copy/paste/select all."""
        menu = Menu(widget, tearoff=0)
        menu.add_command(label="Cut", command=lambda: widget.event_generate("<<Cut>>"))
        menu.add_command(label="Copy", command=lambda: widget.event_generate("<<Copy>>"))
        menu.add_command(label="Paste", command=lambda: widget.event_generate("<<Paste>>"))
        menu.add_separator()
        menu.add_command(label="Select All", command=lambda: widget.event_generate("<<SelectAll>>"))

        def show_context_menu(event):
            menu.tk_popup(event.x_root, event.y_root)

        widget.bind("<ButtonPress-3>", show_context_menu)
        # Bind SelectAll for convenience
        widget.bind("<<SelectAll>>", lambda e: widget.select_range(0, tk.END))

    def _scroll_to_last_user(self) -> None:
        """Scroll the chat so the saved `You:` line appears at the top.

        Uses display (wrapped) line counts so wrapped lines are handled
        correctly. Falls back to `see` on error or when counts are not
        meaningful (e.g. very small content).
        """
        if self.last_user_start is None:
            return
        try:
            num_display_lines = int(self.chat_display.tk.call(
                self.chat_display._w, 'count', '-displaylines', '1.0', self.last_user_start
            ))
            total_display_lines = int(self.chat_display.tk.call(
                self.chat_display._w, 'count', '-displaylines', '1.0', 'end-1c'
            ))

            # If counts are zero or very small, just use `see` to ensure
            # the target is visible — this is safer on initial responses.
            if total_display_lines <= 0 or num_display_lines <= 1:
                self.chat_display.see(self.last_user_start)
                return

            fraction = (num_display_lines - 1) / max(total_display_lines, 1)
            fraction = max(0.0, min(1.0, fraction))
            self.chat_display.yview_moveto(fraction)
        except tk.TclError:
            self.chat_display.see(self.last_user_start)

    # ------------------------------------------------------------------
    # NEW: resize embedded forms on chat_display resize
    def _resize_forms(self, event):
        print(f"[DEBUG] Resizing {len(self.forms)} forms on configure (width={self.chat_display.winfo_width()})", file=sys.stderr)
        for start_mark, end_mark, form_frame, _fields in self.forms:
            try:
                form_frame.resize_to_text_width()
            except Exception as e:
                print(f"[DEBUG] Form resize failed: {e}", file=sys.stderr)
                traceback.print_exc()

    # ------------------------------------------------------------------
    # NEW: clipboard helpers for keyboard shortcuts
    def copy_last_exchange(self, event=None):
        """Copy the last user -> assistant exchange to the clipboard."""
        last_user = None
        last_assistant = None

        # Search conversation from the end for the last user message
        for i in range(len(self.conversation) - 1, -1, -1):
            if self.conversation[i].get("role") == "user":
                last_user = self.conversation[i].get("content", "").strip()
                # if an assistant reply immediately follows, include it
                if i + 1 < len(self.conversation) and self.conversation[i + 1].get("role") == "assistant":
                    last_assistant = self.conversation[i + 1].get("content", "").strip()
                break

        # Fallback: parse the displayed text if conversation list is empty
        if last_user is None:
            display_text = self.chat_display.get("1.0", tk.END).strip()
            idx = display_text.rfind("You:")
            if idx != -1:
                last_user = display_text[idx:].splitlines()[0].replace("You:", "").strip()
            else:
                last_user = ""

        parts = []
        if last_user:
            parts.append(f"You: {last_user}")
        if last_assistant:
            parts.append(f"Grok: {last_assistant}")

        result = "\n\n".join(parts).strip()
        if result:
            try:
                self.root.clipboard_clear()
                self.root.clipboard_append(result)
                self._flash_message("Last exchange copied to clipboard.")
            except tk.TclError:
                self._flash_message("Failed to copy last exchange.")
        else:
            self._flash_message("No exchange to copy.")

        # stop further handling of the keystroke
        return "break"

    def copy_entire_session(self, event=None):
        """Copy the entire visible session to the clipboard."""
        try:
            full = self.chat_display.get("1.0", tk.END).strip()
            if full:
                self.root.clipboard_clear()
                self.root.clipboard_append(full)
                self._flash_message("Entire session copied to clipboard.")
            else:
                self._flash_message("No content to copy.")
        except tk.TclError:
            self._flash_message("Failed to copy session.")
        return "break"

    def export_session(self, event=None):
        """Export the entire session to a timestamped .txt file."""
        try:
            full_text = self.chat_display.get("1.0", tk.END).strip()
            if not full_text:
                self._flash_message("No content to export.")
                return "break"

            timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            filename = f"chat_session_{timestamp}.txt"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(full_text)
            self._flash_message(f"Session exported to {filename}")
        except Exception as e:
            self._flash_message(f"Export failed: {e}")
        return "break"

    def new_session(self, event=None):
        """Open a new chat window with a fresh session."""
        # Ask manager to create a new session (it will register and return the bot)
        try:
            self.manager.create_session()
        except Exception as e:
            self._flash_message(f"Failed to create new session: {e}")
        return "break"

    def _setup_menubar(self):
        """Setup the menubar with File and Edit menus."""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)

        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="New Session (Ctrl+N)", command=self.new_session)
        file_menu.add_command(label="Clear Conversation (Ctrl+Backspace)", command=self.clear_conversation)
        file_menu.add_separator()
        file_menu.add_command(label="Export Session (Ctrl+E)", command=self.export_session)
        file_menu.add_separator()
        file_menu.add_command(label="Quit", command=lambda: self.manager.close_session(self))

        # Edit menu
        edit_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Edit", menu=edit_menu)
        edit_menu.add_command(label="Copy Last Exchange (Ctrl+K)", command=self.copy_last_exchange)
        edit_menu.add_command(label="Copy Entire Session (Ctrl+Shift+K)", command=self.copy_entire_session)

    def clear_conversation(self, event=None):
        """Clear the conversation history and chat display."""
        self.conversation.clear()
        self.chat_display.config(state="normal")
        self.chat_display.delete("1.0", tk.END)
        self.chat_display.config(state="disabled")
        self.in_ask_questions_mode = False
        self.ask_questions_first = False
        self.first_submission = True  # Reset so next submission is treated as first
        self.add_to_chat("Grok", "Conversation cleared. How can I help?")
        self._flash_message("Conversation cleared.")
        return "break"

    def _flash_message(self, text: str) -> None:
        """Display a temporary status message at the top of the window for 3 seconds."""
        # Create or reuse a flash label if it exists
        if hasattr(self, 'flash_label') and self.flash_label is not None:
            self.flash_label.destroy()
        
        self.flash_label = tk.Label(
            self.root,  # Use root as parent to place at top of window
            text=text,
            bg="#ffffff",  
            fg="#155724",
            font=(FONT_FAMILY, 10, "bold"),
            relief="solid",
            borderwidth=1,
            pady=5,
            padx=10,
            anchor="w"
        )
        # Place at top of window (below menubar), spanning full width
        self.flash_label.place(x=10, y=40, relwidth=0.95, anchor="nw")
        self.flash_label.lift()  # Ensure it's on top of other widgets
        
        # Hide after 3 seconds
        self.root.after(3000, self.flash_label.destroy)
        # Clean up attribute after destruction
        self.root.after(3000, lambda: setattr(self, 'flash_label', None))
        
    # New helper for invoking stored mode buttons
    def _invoke_mode_button(self, mode: str):
        """Invoke the button associated with `mode` if present, otherwise call send_with_mode."""
        btn = getattr(self, "mode_buttons", {}).get(mode)
        if btn:
            try:
                btn.invoke()
            except Exception:
                # Fallback to direct call if invoke fails
                self.send_with_mode(mode)
        else:
            self.send_with_mode(mode)
        
    def _submit_overlay_form(self):
        data = {}
        for name, widget in self.overlay_fields.items():
            if isinstance(widget, tk.Text):
                val = widget.get("1.0", "end-1c").strip()
            elif hasattr(widget, "get"):
                val = widget.get().strip()
            else:
                val = ""
            if val:
                data[name] = val

        transcript = "Form submitted:\n" + "\n".join(
            f"• {k}: {v}" for k,v in data.items()
        )

        self.add_to_chat("You", transcript)

        # Send to LLM
        self._send_request(transcript, "", None, GROK_MODEL)

        # Close overlay
        self.form_overlay.destroy()
        self.form_overlay = None
        
    def open_form_overlay(self, fields):
        # Create dimmed overlay
        self.form_overlay = tk.Frame(self.root, bg="#00000040")
        self.form_overlay.place(relx=0, rely=0, relwidth=1, relheight=1)
        self.form_overlay.lift()

        # Card
        self.form_card = tk.Frame(self.form_overlay, bg="white", bd=2, relief="ridge")
        self.form_card.place(relx=0.5, rely=0.5, anchor="center")

        self.overlay_fields = {}

        for f in fields:
            lbl = ttkb.Label(self.form_card, text=f['label'])
            lbl.pack(anchor="w", padx=20, pady=(10,2))

            if f['type'] == "input":
                entry = ttkb.Entry(self.form_card)
                entry.pack(fill="x", padx=20, pady=(0,10))
                if f.get("value"): entry.insert(0, f["value"])
                self.overlay_fields[f['name']] = entry

            elif f['type'] == "textarea":
                txt = tk.Text(self.form_card, height=4, wrap="word")
                txt.pack(fill="x", padx=20, pady=(0,10))
                if f.get("value"): txt.insert("1.0", f["value"])
                self.overlay_fields[f['name']] = txt

            elif f['type'] == "select":
                var = tk.StringVar()
                opt_frame = tk.Frame(self.form_card, bg="white")
                opt_frame.pack(fill="x", padx=20, pady=(0,10))
                for option in f.get("options", []):
                    ttkb.Radiobutton(opt_frame, text=option, variable=var, value=option).pack(anchor="w")
                self.overlay_fields[f['name']] = var

        ttkb.Button(
            self.form_card,
            text="Submit (Ctrl+Shift+S)",
            command=self._submit_overlay_form
        ).pack(pady=15)
        
        
    # Forward reference for FormFrame (used before class definition)
    def submit_form_data(self, summary: str, form_frame):
        """Handle form submission: remove embedded form and send summary via _send_request."""
        # Disable form fields and button (best-effort)
        try:
            for w in form_frame.fields.values():
                try:
                    w.configure(state='disabled')
                except Exception:
                    pass
            try:
                form_frame.submit_btn.configure(state='disabled')
            except Exception:
                pass
        except Exception:
            pass

        # Find stored marks for this form
        start_mark = end_mark = None
        remaining = []
        for rec in self.forms:
            if len(rec) >= 3 and rec[2] is form_frame:
                # rec is (start_mark, end_mark, form_frame, fields)
                start_mark, end_mark = rec[0], rec[1]
            else:
                remaining.append(rec)
        # Update tracking list
        self.forms = remaining
        if self.active_form == form_frame:
            self.active_form = None

        # Remove the embedded form from the text widget
        try:
            self.chat_display.config(state="normal")
            if start_mark and end_mark:
                try:
                    self.chat_display.delete(start_mark, end_mark)
                except Exception:
                    # Fallback: try to delete a single index if full range delete fails
                    try:
                        self.chat_display.delete(start_mark)
                    except Exception:
                        pass
            # Destroy the frame to free resources
            try:
                form_frame.destroy()
            except Exception:
                pass
            self.chat_display.config(state="disabled")
        except Exception:
            pass

        # Send the summary through the normal send flow so the LLM receives it
        # This will add it to conversation, show progress, and start the worker.
        try:
            self._send_request(summary, "", None, GROK_MODEL)
        except Exception:
            # Fallback: if _send_request fails, append to conversation and start worker directly
            try:
                self.add_to_chat("You", summary)
                self.conversation.append({"role": "user", "content": summary})
                self.send_btn.configure(state="disabled")
                self.progress.start()
                threading.Thread(target=lambda: self._worker("", GROK_MODEL), daemon=True).start()
            except Exception:
                pass

    def submit_active_form(self, event=None):
        """Submit the active form (focused) or the most recent form if none focused."""
        try:
            if getattr(self, "active_form", None):
                try:
                    self.active_form.submit()
                except Exception:
                    # best-effort: disable and remove if submit fails
                    try:
                        for w in self.active_form.fields.values():
                            w.configure(state='disabled')
                        self.active_form.submit_btn.configure(state='disabled')
                    except Exception:
                        pass
            elif self.forms:
                # self.forms stores records like (start_mark, end_mark, form_frame, fields)
                try:
                    rec = self.forms[-1]
                    form_frame = rec[2]
                    form_frame.submit()
                except Exception:
                    self._flash_message("Failed to submit the most recent form.")
            else:
                self._flash_message("No form to submit.")
        except Exception:
            self._flash_message("Error submitting form.")
        return "break"

# Add main entry point at end of file
if __name__ == "__main__":
    manager = SessionManager()
    first_bot = manager.create_session()
    first_bot.root.mainloop()

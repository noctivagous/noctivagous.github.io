# chatroomstyle-chatbot-v1.py
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


# ======================================================================
# SETTINGS AND CONFIG —
# ======================================================================
GROK_MODEL = "grok-4-fast-non-reasoning-latest"   # ← edit this one line!
# "grok-4-fast"                    # with reasoning (slower, more expensive)
# "grok-4"                         # full reasoning model
# "grok-beta"                      # previous generation

FONT_SIZE = 15
H1_SIZE = 18
HEADER_COLOR = "#7a4213"
BASE_FONT = "Consolas"
INITIAL_WINDOW_WIDTH = 700
INITIAL_WINDOW_HEIGHT = 980

GRAY_COLOR_1= "#F0F0F0" #Classic Windows gray
GRAY_COLOR_2= "#E8E8E8" #A touch darker
GRAY_COLOR_3= "#F5F5F5" #Very slightly warmer
GRAY_COLOR_4= "#EAEAEA" #Soft modern gray

WINDOW_BG_COLOR= GRAY_COLOR_2


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
You are in a chat window that looks like IRC, so your responses
should be one, two, or three paragraphs. You want the dialogue to flow naturally
between you and the user and this is what you are interested in.
Don't ask questions at the end of a response
that are designed just to prolong the discussion,
for example, because that is unnatural.
The user is asking questions, so you will reply with one, two, or three
paragraphs. Don't answer with full page responses
unless the user requests that you do that or carry out a task. For example,
if your response in the chat would include lots of code,
you ask before showing it or any long response.
Ask questions and respond naturally like a person, where
you might ask just a question, or give just a paragraph,
and ask a question, etc. You determine your
own response length and whether to ask a question or not.
Respond naturally and conversationally, asking questions at the very
end of replies only if they're genuinely relevant to clarifying or advancing the topic.
You can ask nothing at the end.
Don't use the phrase 'Think [of]... [analogy/example]' when explaining concepts.
Avoid using 'super' as an intensifier.
            
""".strip()

SYSTEM_PROMPT2 = """
You are Grok, a helpful and maximally truthful AI built by xAI.
You are in a chat window that looks like IRC, so your responses
should be one, two, or three paragraphs. You want the dialogue to flow naturally
between you and the user and this is what you are interested in.
Don't ask questions at the end of a response
that are designed just to prolong the discussion,
for example, because that is unnatural.
The user is asking questions, so you will reply with one, two, or three
paragraphs. Don't answer with full page responses
unless the user requests that you do that or carry out a task. For example,
if your response in the chat would include lots of code,
you ask before showing it or any long response.
You determine your
own response length and whether to ask a question or not.
Respond naturally and conversationally, asking questions at the very
end of replies only if they're genuinely relevant to clarifying or advancing the topic.
You can ask nothing at the end.
Don't use the phrase 'Think [of]... [analogy/example]' when explaining concepts.
Don't use 'super' as an intensifier.     
""".strip()


def generate_response_raw(messages: List[Dict[str, str]]) -> str:
    # Prepend the real system message if it's not already there
    full_messages = [{"role": "system", "content": SYSTEM_PROMPT2}]
    for msg in messages:
        if msg["role"] == "assistant":  # llm library uses "assistant", xAI accepts it
            full_messages.append(msg)
        else:
            full_messages.append({"role": "user", "content": msg["content"]})

    response = client.chat.completions.create(
        model=GROK_MODEL,
        #.replace("-non-reasoning-latest", ""),  # e.g. "grok-4"
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
HEADER_COLOR = "#fd7e14"      # orange
CODE_BG = "#e9ecef"
CODE_FG = "#212529"
LINK_FG = "#0d6efd"
GROK_NAME_COLOR = "#2f4e3f"

# ----------------------------------------------------------------------
# ---------------------  Simple Regex-Based Markdown Renderer ---------
# ----------------------------------------------------------------------

    
def render_markdown_message(widget: scrolledtext.ScrolledText, sender: str, text: str) -> None:
    widget.config(state="normal")
    
    # Sender label (bold + color)
    widget.insert(tk.END, f"{sender}: ", "sender")
    widget.tag_config("sender", font=("Consolas", FONT_SIZE, "bold"), foreground=GROK_NAME_COLOR if sender == "Grok" else "#ffffff")

    # Define tags (move to __init__ if configuring once globally)
    widget.tag_config("bold", font=("Consolas", FONT_SIZE, "bold"))
    widget.tag_config("italic", font=("Consolas", FONT_SIZE, "italic"))
    widget.tag_config("code", font=("Consolas", FONT_SIZE), background="#e9ecef", foreground="#212529",
                         relief="solid", borderwidth=1, spacing1=2, spacing3=2)
    widget.tag_config("h1", font=("Consolas", 18, "bold"), foreground=HEADER_COLOR)
    widget.tag_config("h2", font=("Consolas", 15, "bold"), foreground=HEADER_COLOR)
    widget.tag_config("h3", font=("Consolas", 13, "bold"), foreground=HEADER_COLOR) 
    widget.tag_config("h4", font=("Consolas", 12, "bold"), foreground=HEADER_COLOR) 
    
    
    widget.tag_config("sender", font=("Consolas", FONT_SIZE, "bold"), foreground="#4b5651" if sender == "Grok" else "#000000")




    lines = text.splitlines()
    i = 0
    in_code_block = False
    code_block_start = None

    while i < len(lines):
        raw_line = lines[i]
        line = raw_line.strip()

        if in_code_block:
            # Check for end of code block
            if line.startswith("```") or line == "```":
                # Apply code tag line-by-line instead of one giant block
                if code_block_start is not None:
                    current = code_block_start
                    while True:
                        next_line = widget.index(f"{current} lineend + 1c")
                        if widget.compare(next_line, ">", widget.index(tk.END + "-2c")):  # last line
                            widget.tag_add("code", current, tk.END)
                            break
                        widget.tag_add("code", current, next_line)
                        current = next_line
                in_code_block = False
                code_block_start = None
                widget.insert(tk.END, "\n\n")  # nice spacing after block
                i += 1
                continue

            # Inside code block — insert the raw line and tag it
            start = widget.index(tk.END)
            widget.insert(tk.END, raw_line + "\n")
            widget.tag_add("code", start, tk.END)
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
        if line.startswith("### "):
            content = line[4:]
            widget.insert(tk.END, content + "\n\n", "h3")
            i += 1
            continue
        elif line.startswith("## "):
            content = line[3:]
            widget.insert(tk.END, content + "\n\n", "h2")
            i += 1
            continue
        elif line.startswith("# "):
            content = line[2:]
            widget.insert(tk.END, content + "\n\n", "h1")
            i += 1
            continue

        # Process inline elements: bold, italic, code, links
        pos = 0
        line_start = widget.index(tk.END)

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

        widget.insert(tk.END, "\n")
        i += 1

    # If ended in code block (unclosed), apply tag anyway
    if in_code_block and code_block_start:
        widget.tag_add("code", code_block_start, widget.index(tk.END))
        widget.insert(tk.END, "\n")

    widget.insert(tk.END, "\n")
    widget.config(state="disabled")
    widget.see(tk.END)
    
def __open_url(url: str) -> None:
    webbrowser.open(url)    

# ----------------------------------------------------------------------


class GrokChatBot:
# --- CHANGES TO USE GRID LAYOUT INSTEAD OF PACK ---

    def __init__(self, root):
        self.root = root
        self.root.title("Grok Chatbot (Powered by xAI & Python LLM Library)")
        self.root.geometry(f"{INITIAL_WINDOW_WIDTH}x{INITIAL_WINDOW_HEIGHT}")
        ttkb.Style("cosmo")
        self.root.configure(bg=WINDOW_BG_COLOR)

        # Use grid on root (2 rows: chat area + input area)
        self.root.grid_rowconfigure(0, weight=1)   # chat grows
        self.root.grid_rowconfigure(1, weight=0)   # input fixed
        self.root.grid_columnconfigure(0, weight=1)

        # Chat display
        self.chat_display = scrolledtext.ScrolledText(
            root,
            wrap=tk.WORD,
            state="disabled",
            font=("Consolas", FONT_SIZE),
            bg="#f8f9fa",
            fg="#212529",
            insertbackground="#212529",
            padx=10,
            pady=10,
            relief="sunken",
            bd=2,
        )
        self.chat_display.grid(row=0, column=0, padx=10, pady=(10, 5), sticky="nsew")
        self._setup_context_menu(self.chat_display)

        # Input frame (bottom row)
        input_frame = ttkb.Frame(root, relief="sunken")
        input_frame.grid(row=1, column=0, padx=10, pady=(5, 10), sticky="ew")
        input_frame.grid_columnconfigure(0, weight=1)  # entry expands

        self.entry = ttkb.Entry(input_frame, font=("Consolas", 11))
        self.entry.grid(row=0, column=0, sticky="ew", padx=(0, 10))

        self.entry.bind("<Return>", lambda e: self.send_message() or "break")

        self.entry.focus_set()
        self._setup_context_menu(self.entry)

        send_btn = ttkb.Button(
            input_frame, text="Send", command=self.send_message, bootstyle=PRIMARY
        )
        send_btn.grid(row=0, column=1)

        # Threading & welcome (unchanged)
        self.response_queue = queue.Queue()
        self.conversation: List[Dict[str, str]] = []
        self.check_queue()

        self.add_to_chat(
            "Grok",
            f"Hello! I'm Grok, built by xAI. (Powered by **{GROK_MODEL}**).",
        )

        # Markdown tag styles
        self.chat_display.tag_config("bold", font=("Consolas", 11, "bold"))
        self.chat_display.tag_config("italic", font=("Consolas", 11, "italic"))
        self.chat_display.tag_config("code", background="#3d3d3d", relief="solid", borderwidth=1, lmargin1=4, lmargin2=4, spacing1=4, spacing3=4, selectbackground="#357abd", selectforeground="white")
        self.chat_display.tag_config("h1", font=("Consolas", 16, "bold"), foreground="#ff6b6b")
        self.chat_display.tag_config("h2", font=("Consolas", 14, "bold"), foreground="#ffa500")
        self.chat_display.tag_config("h3", font=("Consolas", 12, "bold"), foreground="#58f5ab")
        self.chat_display.tag_config("h4", font=("Consolas", 12, "bold"), foreground="#58f5ab")


    # ------------------------------------------------------------------
    def add_to_chat(self, sender: str, message: str) -> None:
        if sender == "You":
            # User messages = plain text
            self.chat_display.config(state="normal")
            self.chat_display.insert(tk.END, f"You: {message}\n\n")
            self.chat_display.config(state="disabled")
            self.chat_display.see(tk.END)
        else:
            # Grok messages = full Markdown rendering
            render_markdown_message(self.chat_display, sender, message)
    def send_message(self, event=None) -> None:
        user_input = self.entry.get().strip()
        if not user_input:
            return

        self.add_to_chat("You", user_input)
        self.conversation.append({"role": "user", "content": user_input})
        self.entry.delete(0, tk.END)

        threading.Thread(target=self._worker, daemon=True).start()

    # ------------------------------------------------------------------
    def _worker(self) -> None:
        """Runs in a background thread – calls the hook."""
        try:
            bot_reply = generate_response_raw(self.conversation)
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
        except queue.Empty:
            pass
        self.root.after(100, self.check_queue)

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
            
            #try:
             #   menu.tk_popup(event.x_root, event.y_root)
            #finally:
              #  menu.grab_release()

        widget.bind("<ButtonPress-3>", show_context_menu)
        # Bind SelectAll for convenience
        widget.bind("<<SelectAll>>", lambda e: widget.select_range(0, tk.END))


if __name__ == "__main__":
    root = ttkb.Window(themename="cosmo")
    GrokChatBot(root)
    root.mainloop()

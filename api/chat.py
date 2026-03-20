import json
import os
from http.server import BaseHTTPRequestHandler
import anthropic

COMPOSE_SYSTEM = """You are a professional email writing assistant. Your only job is to write polished, human-sounding emails based on what the user describes.

Follow these rules strictly:
1. Write emails that sound like a real, thoughtful human wrote them — natural, confident, and direct.
2. Never use tired clichés: "I hope this email finds you well", "Please don't hesitate to reach out", "As per my previous email", "Going forward", "Best regards" (use "Best," or a natural sign-off instead).
3. Use contractions naturally (I'm, I'll, we're, it's) where appropriate to the tone.
4. Vary sentence length — mix short, punchy sentences with longer ones to create rhythm.
5. Never use bullet points or lists unless the user specifically asks for them.
6. Match the formality level to the context the user describes.
7. Keep emails concise — say what needs to be said, nothing more.
8. If the user hasn't given you enough context (who they're writing to, the relationship, the purpose), ask one focused clarifying question before drafting.
9. Output only the email itself — no preamble like "Here's your email:", no commentary after, no explanation.
10. The email must not sound like it was written by AI."""

REPLY_SYSTEM = """You are a professional email reply assistant. Your only job is to write polished, human-sounding replies to email threads based on what the user wants to say.

Follow these rules strictly:
1. Read the full email thread carefully to understand context, history, tone, and what's being asked.
2. Write replies that sound like a real, thoughtful human wrote them — natural, confident, and direct.
3. Never use tired clichés: "I hope this email finds you well", "Please don't hesitate to reach out", "As per my previous email", "Going forward".
4. Use contractions naturally where appropriate to the tone.
5. Vary sentence length — mix short, punchy sentences with longer ones to create rhythm.
6. Never use bullet points or lists unless the user specifically asks for them.
7. Match or slightly elevate the formality level of the original email thread.
8. Keep replies concise — address what was asked, nothing more.
9. Output only the email reply itself — no preamble like "Here's your reply:", no commentary after, no explanation.
10. The reply must not sound like it was written by AI."""


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(content_length))

            messages = body.get("messages", [])
            mode = body.get("mode", "compose")
            system = COMPOSE_SYSTEM if mode == "compose" else REPLY_SYSTEM

            client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2048,
                system=system,
                messages=messages
            )

            reply = response.content[0].text
            self._respond(200, {"reply": reply})

        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _respond(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

#!/usr/bin/env python3
"""에뮬레이터 자동 점검용 가짜 OpenAI 서버 (호스트 :8787). 앱이 보내는 요청 형식을 검사하고 기록합니다."""
import email.parser, email.policy, http.server, json, sys

LOG = open("mock-openai.log", "w", encoding="utf-8")
CALLS = {"transcribe": 0}

def log(*a):
    print(*a, file=LOG, flush=True)

def multipart(handler, body):
    ctype = handler.headers["Content-Type"]
    msg = email.parser.BytesParser(policy=email.policy.HTTP).parsebytes(
        b"Content-Type: " + ctype.encode() + b"\r\n\r\n" + body)
    fields = []
    for part in msg.iter_parts():
        name = part.get_param("name", header="content-disposition")
        payload = part.get_payload(decode=True) or b""
        fields.append((name, payload, part.get_filename()))
    return fields

class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        auth = self.headers.get("Authorization", "")
        if auth != "Bearer sk-selftest-0000":
            log("FAIL auth", auth); return self.send(401, {"error": {"message": "bad key"}})
        if self.path == "/v1/audio/transcriptions":
            CALLS["transcribe"] += 1
            n = CALLS["transcribe"]
            f = multipart(self, body)
            names = [v.decode() for k, v, _ in f if k == "known_speaker_names[]"]
            refs = [v.decode()[:30] for k, v, _ in f if k == "known_speaker_references[]"]
            fields = {k: (v.decode() if k != "file" else f"<{len(v)} bytes {fn}>") for k, v, fn in f if not k.startswith("known_")}
            log(f"transcribe#{n}", json.dumps(fields, ensure_ascii=False), "names=", names, "refs=", refs)
            ok = (fields.get("model") == "gpt-4o-transcribe-diarize" and fields.get("response_format") == "diarized_json"
                  and fields.get("chunking_strategy") == "auto" and "file" in fields and len(names) == len(refs)
                  and all(r.startswith("data:audio/wav;base64,") for r in refs))
            if n == 1:
                ok = ok and names == ["이대신"]
                segs = [("이대신", 0.5, 4.0, "네, 다음 주까지 보고서를 정리하겠습니다."),
                        ("A", 4.5, 12.0, "대신 씨, 다음 회의는 2030년 1월 15일 오전 10시에 합시다."),
                        ("B", 12.5, 20.0, "디자인 시안은 제가 수요일에 공유하겠습니다.")]
            else:
                ok = ok and names[:3] == ["이대신", "화자1", "화자2"]
                segs = [("화자1", 0.5, 6.0, "대신 씨 보고서는 금요일까지 부탁해요."), ("C", 6.5, 12.0, "저는 예산을 확인하겠습니다.")]
            log(("PASS" if ok else "FAIL") + f" transcribe#{n} request format")
            return self.send(200, {"text": " ".join(s[3] for s in segs), "segments": [
                {"type": "transcript.text.segment", "id": f"seg_{i}", "speaker": s[0], "start": s[1], "end": s[2], "text": s[3]}
                for i, s in enumerate(segs)]})
        if self.path == "/v1/responses":
            req = json.loads(body)
            ok = (req.get("model") == "gpt-5.6-terra" and req.get("text", {}).get("format", {}).get("type") == "json_object"
                  and "JSON" in req.get("instructions", "") and "이대신: 네, 다음 주까지" in req.get("input", "")
                  and "화자3: 저는 예산을" in req.get("input", ""))
            log(("PASS" if ok else "FAIL") + " responses request format")
            log("input:", req.get("input", "")[:600].replace("\n", " | "))
            analysis = {"title": "점검 회의", "summary": "점검용 요약입니다.", "keyPoints": ["보고서"], "decisions": [],
                        "speakers": [{"label": "화자1", "name": "김부장", "role": "진행", "summary": "", "points": []}],
                        "requestsToMe": [{"from": "화자1", "request": "보고서 정리", "due": "2030-01-11", "priority": "high", "quote": "보고서는 금요일까지"}],
                        "actionItems": [], "openQuestions": [],
                        "schedules": [{"title": "다음 회의", "start": "2030-01-15T10:00", "end": None, "allDay": False, "location": "",
                                       "attendees": ["화자1"], "notes": "", "confidence": 0.9, "evidence": "다음 회의는 2030년 1월 15일 오전 10시"}]}
            return self.send(200, {"id": "resp_1", "output": [
                {"type": "reasoning", "summary": []},
                {"type": "message", "role": "assistant", "content": [{"type": "output_text", "text": json.dumps(analysis, ensure_ascii=False)}]}]})
        log("FAIL unknown path", self.path)
        self.send(404, {"error": {"message": "not found"}})

http.server.ThreadingHTTPServer(("0.0.0.0", int(sys.argv[1]) if len(sys.argv) > 1 else 8787), H).serve_forever()

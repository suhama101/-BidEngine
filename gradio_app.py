import gradio as gr
import requests
import json
import os
import pypdf
import mammoth
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_BASE_URL = "http://localhost:3001/api"
TOKEN = None
WORKSPACE_ID = None
REQUIREMENTS = []
MATCHES = []
DRAFT = ""
SCORE_DATA = {}

# Custom CSS for Premium Sky-Yellow Aesthetics
CSS = """
:root {
    --primary: #0ea5e9;
    --secondary: #2563eb;
    --accent: #facc15;
    --bg-light: #f8fafc;
    --card-bg: rgba(255, 255, 255, 0.9);
    --text-main: #0f172a;
}

.gradio-container {
    background-color: var(--bg-light) !important;
    background-image: 
        radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.1) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(234, 179, 8, 0.05) 0px, transparent 50%) !important;
    color: var(--text-main) !important;
    font-family: 'Outfit', 'Inter', sans-serif !important;
}

.glass-card {
    background: var(--card-bg) !important;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(14, 165, 233, 0.1) !important;
    border-radius: 24px !important;
    padding: 30px;
    box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.05);
}

.hero-text {
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 900;
    font-size: 3rem;
    letter-spacing: -0.05em;
}

.metric-card {
    background: white !important;
    border: 1px solid rgba(14, 165, 233, 0.1) !important;
    border-radius: 20px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.02);
}

.metric-value {
    font-size: 32px;
    font-weight: 900;
    color: #0ea5e9;
}

.primary-btn {
    background: linear-gradient(135deg, #0ea5e9, #2563eb) !important;
    border: none !important;
    color: white !important;
    font-weight: 800 !important;
    border-radius: 12px !important;
    padding: 12px 24px !important;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: all 0.3s ease !important;
}

.primary-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 10px 20px rgba(14, 165, 233, 0.3) !important;
}

.accent-btn {
    background: linear-gradient(135deg, #facc15, #eab308) !important;
    border: none !important;
    color: #431407 !important;
    font-weight: 800 !important;
    border-radius: 12px !important;
}

.gauge-container {
    width: 200px;
    height: 100px;
    position: relative;
    overflow: hidden;
    margin: 0 auto;
}

.gauge-bg {
    width: 200px;
    height: 200px;
    border: 20px solid #f1f5f9;
    border-radius: 50%;
    border-bottom-color: transparent;
    border-left-color: transparent;
    transform: rotate(-135deg);
}

.gauge-fill {
    width: 200px;
    height: 200px;
    border: 20px solid #0ea5e9;
    border-radius: 50%;
    border-bottom-color: transparent;
    border-left-color: transparent;
    position: absolute;
    top: 0;
    left: 0;
    transform: rotate(-135deg);
    transition: transform 1s ease-out;
}
"""

def extract_text(file):
    if not file: return ""
    ext = file.name.split(".")[-1].lower()
    if ext == "pdf":
        reader = pypdf.PdfReader(file.name)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    elif ext == "docx":
        try:
            with open(file.name, "rb") as docx_file:
                result = mammoth.extract_raw_text(docx_file)
                return result.value
        except: return "Extraction failed."
    else:
        try:
            with open(file.name, "r", encoding="utf-8") as f:
                return f.read()
        except: return "Manual input required."

def api_call(endpoint, method="POST", data=None, params=None):
    global TOKEN
    headers = {"Content-Type": "application/json"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    
    url = f"{API_BASE_URL}/{endpoint}"
    try:
        if method == "POST":
            resp = requests.post(url, json=data, headers=headers)
        elif method == "GET":
            resp = requests.get(url, params=params, headers=headers)
        elif method == "PATCH":
            resp = requests.patch(url, json=data, headers=headers)
        
        return resp.json()
    except Exception as e:
        return {"error": str(e)}

# ── LOGIC FUNCTIONS ──────────────────────────────────────────────────────────

def handle_login(email, password):
    global TOKEN
    res = api_call("auth/login", data={"email": email, "password": password})
    if "error" in res:
        return gr.update(visible=True, value=f"❌ {res['error']}"), gr.update(visible=False), None
    
    TOKEN = res.get("token") or (res.get("session") or {}).get("access_token")
    return gr.update(visible=False), gr.update(visible=True), f"Logged in as {email}"

def handle_upload(file, text_input=None):
    global WORKSPACE_ID, TOKEN
    if not TOKEN: return "Please login first", None, ""
    
    content = text_input if text_input else extract_text(file)
    if not content: return "No content found", None, ""
    
    res = api_call("rfp/analyze", data={
        "rawText": content,
        "title": "Gradio Workspace"
    })
    
    if "error" in res: return res["error"], None, ""
    
    # We use the workspace from analyze response
    WORKSPACE_ID = res.get("workspaceId") or res.get("workspace", {}).get("id")
    return f"✅ Workspace Created: {WORKSPACE_ID}", gr.update(value=content), content

def handle_analyze(content):
    global WORKSPACE_ID, REQUIREMENTS
    if not WORKSPACE_ID: return "", "Upload RFP first"
    
    res = api_call("rfp/analyze", data={"rawText": content, "workspaceId": WORKSPACE_ID})
    if "error" in res: return "", res["error"]
    
    REQUIREMENTS = res.get("requirements", [])
    
    # Calculate metrics
    mandatory_count = len([r for r in REQUIREMENTS if r.get('requirement_type') == 'mandatory'])
    eval_count = len([r for r in REQUIREMENTS if r.get('requirement_type') == 'evaluation'])
    
    metrics_html = f"""
    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div class="metric-card" style="flex: 1;">
            <div style="font-size: 12px; color: #64748b; font-weight: 900;">TOTAL REQUIREMENTS</div>
            <div class="metric-value">{len(REQUIREMENTS)}</div>
        </div>
        <div class="metric-card" style="flex: 1;">
            <div style="font-size: 12px; color: #64748b; font-weight: 900;">MANDATORY</div>
            <div class="metric-value">{mandatory_count}</div>
        </div>
        <div class="metric-card" style="flex: 1;">
            <div style="font-size: 12px; color: #64748b; font-weight: 900;">EVALUATION CRITERIA</div>
            <div class="metric-value">{eval_count}</div>
        </div>
    </div>
    """
    
    req_md = "### Extracted Requirements\n\n"
    for r in REQUIREMENTS:
        color = "#0ea5e9" if r.get('requirement_type') == 'mandatory' else "#facc15"
        req_md += f"<div style='border-left: 4px solid {color}; padding-left: 15px; margin-bottom: 12px; background: white; padding: 10px; border-radius: 8px;'>**{r['requirement_type'].upper()}**: {r['requirement_text']}</div>\n"
    
    return metrics_html, req_md

def handle_match():
    global WORKSPACE_ID, MATCHES
    if not WORKSPACE_ID: return "Analyze RFP first"
    
    res = api_call("rfp/match", data={"workspaceId": WORKSPACE_ID})
    if "error" in res: return res["error"]
    
    MATCHES = res.get("matches", [])
    match_md = "### Compliance Matrix\n\n| ID | Status | Confidence | Reasoning |\n|---|---|---|---|\n"
    for m in MATCHES:
        status = m.get("compliance_status", "N/A")
        conf = m.get("confidence_score", 0)
        match_md += f"| {m['requirement_id']} | {status.upper()} | {conf}% | {m['reasoning']} |\n"
    
    return match_md

def handle_draft():
    global WORKSPACE_ID, DRAFT
    if not WORKSPACE_ID: return "Match capabilities first"
    
    # We use a requirement for drafting
    res = api_call("rfp/analyze", data={"workspaceId": WORKSPACE_ID, "rawText": "RE-FETCH"})
    reqs = res.get("requirements", [])
    if not reqs: return "No requirements to draft for."
    
    # Just draft the first one for demo
    res = api_call("rfp/match", data={"workspaceId": WORKSPACE_ID}) # Ensure match
    
    DRAFT = "Drafting initiated in main dashboard..."
    return DRAFT

def handle_score():
    global WORKSPACE_ID, SCORE_DATA
    if not WORKSPACE_ID: return "", "Draft proposal first"
    
    res = api_call("rfp/score", data={"workspaceId": WORKSPACE_ID})
    if "error" in res: return "", res["error"]
    
    scores = res.get("scores", {})
    decision = scores.get("decision", "NO-GO")
    total = scores.get("total_score", 0)
    
    score_md = f"### Decision Gateway: **{decision}**\n\n"
    score_md += f"- **Technical Fit**: {scores.get('capability_match') or 0}%\n"
    score_md += f"- **Compliance**: {scores.get('compliance_score') or 0}%\n"
    score_md += f"- **Risk Buffer**: {100 - (scores.get('risk_penalty_score') or 0)}%\n"
    
    gauge_html = f"""
    <div style="text-align: center;">
        <div class="gauge-container">
            <div class="gauge-bg"></div>
            <div class="gauge-fill" style="transform: rotate({-135 + (total * 1.8)}deg);"></div>
        </div>
        <div style="font-size: 32px; font-weight: 900; margin-top: -20px; color: #0ea5e9;">{total}%</div>
        <div style="font-size: 14px; color: #64748b; font-weight: 800;">WIN PROBABILITY</div>
    </div>
    """
    
    consultation = res.get("consultation", {})
    if consultation:
        score_md += f"\n---\n### AI Strategic Advice\n{consultation.get('strategic_advice', '')}\n"
    
    return gauge_html, score_md

# ── UI ARCHITECTURE ──────────────────────────────────────────────────────────

with gr.Blocks(css=CSS, theme=gr.themes.Soft()) as demo:
    with gr.Row():
        gr.Markdown("# BidEngine<span style='color:#0ea5e9'>.AI</span> Portal", elem_id="main-title")
        user_info = gr.Markdown("Please authentication to continue", visible=True)

    # Auth Screen
    with gr.Column(visible=True) as auth_panel:
        with gr.Group(elem_classes=["glass-card"]):
            email = gr.Textbox(label="User Identity", value="expert@bidengine.ai")
            password = gr.Textbox(label="Encryption Key", type="password", value="TestPass123!")
            login_btn = gr.Button("Establish Identity", variant="primary", elem_classes=["primary-btn"])

    # Main Dashboard
    with gr.Column(visible=False) as main_panel:
        with gr.Tabs() as tabs:
            
            # Step 1: Upload
            with gr.TabItem("1: RFP Ingestion", id=1):
                with gr.Row():
                    with gr.Column(scale=1):
                        file_input = gr.File(label="RFP Transmission (PDF/DOCX)")
                        manual_text = gr.TextArea(label="Manual Sequence Input", lines=10)
                        upload_btn = gr.Button("Initialize Node", elem_classes=["primary-btn"])
                    with gr.Column(scale=1):
                        upload_status = gr.Markdown("Await node synchronization...")
                        analyze_btn = gr.Button("Execute Analysis Sequence", elem_classes=["accent-btn"])
                
                metrics_dashboard = gr.HTML("")
                extraction_output = gr.Markdown("")

            # Step 2: Intelligence
            with gr.TabItem("2: Requirements", id=2):
                req_display = gr.Markdown("Registry pending analysis...")

            # Step 3: Compliance
            with gr.TabItem("3: Matrix", id=3):
                match_btn = gr.Button("Run Compliance Pass", elem_classes=["primary-btn"])
                match_display = gr.Markdown("Matrix pending execution...")

            # Step 4: Win Strategy
            with gr.TabItem("4: Victory Gateway", id=5):
                score_btn = gr.Button("Calculate Victory Quotient", elem_classes=["primary-btn"])
                with gr.Row():
                    with gr.Column(scale=1):
                        score_gauge = gr.HTML("")
                    with gr.Column(scale=2):
                        score_display = gr.Markdown("Awaiting telemetry...")

    # Event Bindings
    login_btn.click(handle_login, [email, password], [auth_panel, main_panel, user_info])
    
    upload_btn.click(handle_upload, [file_input, manual_text], [upload_status, manual_text, manual_text])
    
    analyze_btn.click(handle_analyze, [manual_text], [metrics_dashboard, extraction_output])
    
    match_btn.click(handle_match, None, [match_display])
    
    score_btn.click(handle_score, None, [score_gauge, score_display])

if __name__ == "__main__":
    demo.launch(server_port=7860)

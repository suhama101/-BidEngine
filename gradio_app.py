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

# Custom CSS for Hackathon-Winning Aesthetics
CSS = """
:root {
    --primary: #9d4edd;
    --secondary: #5a189a;
    --bg-dark: #0a0a0f;
    --card-bg: rgba(26, 26, 46, 0.8);
    --glass: rgba(255, 255, 255, 0.05);
}

.gradio-container {
    background: var(--bg-dark) !important;
    color: #e0e0e0 !important;
    font-family: 'Inter', sans-serif !important;
}

.glass-card {
    background: var(--card-bg) !important;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(157, 78, 221, 0.2) !important;
    border-radius: 16px !important;
    padding: 20px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
}

.hero-text {
    background: linear-gradient(90deg, #c77dff, #7b2cbf);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
}

.metric-card {
    background: rgba(157, 78, 221, 0.1) !important;
    border: 1px solid rgba(157, 78, 221, 0.3) !important;
    border-radius: 12px;
    padding: 15px;
    text-align: center;
}

.metric-value {
    font-size: 24px;
    font-weight: 700;
    color: #c77dff;
}

.risk-alert {
    background: rgba(239, 68, 68, 0.1) !important;
    border-left: 4px solid #ef4444 !important;
    padding: 10px;
    margin: 5px 0;
}

.primary-btn {
    background: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
    border: none !important;
    color: white !important;
    font-weight: 600 !important;
    border-radius: 8px !important;
    transition: all 0.3s ease !important;
}

.stepper-container {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
}

.step-item {
    flex: 1;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: #666;
    padding: 10px;
    border-bottom: 2px solid #333;
}

.step-item.active {
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
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
    border: 20px solid #333;
    border-radius: 50%;
    border-bottom-color: transparent;
    border-left-color: transparent;
    transform: rotate(-135deg);
}

.gauge-fill {
    width: 200px;
    height: 200px;
    border: 20px solid var(--primary);
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
    
    res = api_call("rfp/upload", data={
        "rawText": content,
        "fileName": file.name if file else "manual_input.txt",
        "title": "Gradio Workspace"
    })
    
    if "error" in res: return res["error"], None, ""
    
    WORKSPACE_ID = res["workspace"]["id"]
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
            <div style="font-size: 12px; color: #aaa;">TOTAL REQUIREMENTS</div>
            <div class="metric-value">{len(REQUIREMENTS)}</div>
        </div>
        <div class="metric-card" style="flex: 1;">
            <div style="font-size: 12px; color: #aaa;">MANDATORY</div>
            <div class="metric-value">{mandatory_count}</div>
        </div>
        <div class="metric-card" style="flex: 1;">
            <div style="font-size: 12px; color: #aaa;">EVALUATION CRITERIA</div>
            <div class="metric-value">{eval_count}</div>
        </div>
    </div>
    """
    
    req_md = "### Extracted Requirements\n\n"
    for r in REQUIREMENTS:
        color = "#9d4edd" if r.get('requirement_type') == 'mandatory' else "#7b2cbf"
        req_md += f"<div style='border-left: 3px solid {color}; padding-left: 10px; margin-bottom: 8px;'>**{r['requirement_type'].upper()}**: {r['requirement_text']}</div>\n"
    
    return metrics_html, req_md

def handle_match():
    global WORKSPACE_ID, MATCHES
    if not WORKSPACE_ID: return "Analyze RFP first"
    
    res = api_call("rfp/match", data={"workspaceId": WORKSPACE_ID, "capabilityNotes": ""})
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
    
    res = api_call("rfp/draft", data={"workspaceId": WORKSPACE_ID})
    if "error" in res: return res["error"]
    
    drafts = res.get("drafts", [])
    DRAFT = "\n\n".join([d['content'] for d in drafts])
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
        <div style="font-size: 32px; font-weight: 800; margin-top: -20px; color: #c77dff;">{total}%</div>
        <div style="font-size: 14px; color: #aaa;">WIN PROBABILITY</div>
    </div>
    """
    
    consultation = res.get("consultation", {})
    if consultation:
        score_md += f"\n---\n### AI Strategic Advice\n{consultation.get('strategic_advice', '')}\n"
        score_md += f"\n**Strengths**: {', '.join(consultation.get('key_strengths', []))}\n"
    
    return gauge_html, score_md

# ── UI ARCHITECTURE ──────────────────────────────────────────────────────────

with gr.Blocks(css=CSS, theme=gr.themes.Default()) as demo:
    with gr.Row():
        gr.Markdown("# BidEngine<span class='hero-text'>.AI</span>", elem_classes=["hero-text"])
        user_info = gr.Markdown("Please login to begin", visible=True)

    # Auth Screen
    with gr.Column(visible=True) as auth_panel:
        with gr.Group(elem_classes=["glass-card"]):
            email = gr.Textbox(label="Email", value="testuser@bidengine.ai")
            password = gr.Textbox(label="Password", type="password", value="TestPass123!")
            login_btn = gr.Button("Enter Workspace", variant="primary", elem_classes=["primary-btn"])

    # Main Dashboard
    with gr.Column(visible=False) as main_panel:
        with gr.Tabs() as tabs:
            
            # Step 1: Upload
            with gr.TabItem("Step 1: Upload & Analyze", id=1):
                with gr.Row():
                    with gr.Column(scale=1):
                        file_input = gr.File(label="Upload RFP (PDF, DOCX, TXT)")
                        manual_text = gr.TextArea(label="Or Paste RFP Text Here", lines=10)
                        upload_btn = gr.Button("Upload & Extract Text", elem_classes=["primary-btn"])
                    with gr.Column(scale=1):
                        upload_status = gr.Markdown("Upload a document to start.")
                        analyze_btn = gr.Button("Run AI Requirements Extraction", elem_classes=["primary-btn"])
                
                metrics_dashboard = gr.HTML("")
                extraction_output = gr.Markdown("")

            # Step 2: Requirements
            with gr.TabItem("Step 2: Intelligence", id=2):
                req_display = gr.Markdown("Requirements will appear here after analysis.")
                refresh_req_btn = gr.Button("Refresh Intelligence")

            # Step 3: Compliance
            with gr.TabItem("Step 3: Compliance Matrix", id=3):
                match_btn = gr.Button("Run Agentic Compliance Audit", elem_classes=["primary-btn"])
                match_display = gr.Markdown("Run audit to see results.")

            # Step 4: Proposal
            with gr.TabItem("Step 4: Proposal Generator", id=4):
                draft_btn = gr.Button("Synthesize Agentic Proposal", elem_classes=["primary-btn"])
                draft_display = gr.Markdown("Drafting...")

            # Step 5: Win Strategy
            with gr.TabItem("Step 5: Win Strategy", id=5):
                score_btn = gr.Button("Calculate Success Probability", elem_classes=["primary-btn"])
                with gr.Row():
                    with gr.Column(scale=1):
                        score_gauge = gr.HTML("")
                    with gr.Column(scale=2):
                        score_display = gr.Markdown("Analyze data to see win probability.")

    # Event Bindings
    login_btn.click(handle_login, [email, password], [auth_panel, main_panel, user_info])
    
    upload_btn.click(handle_upload, [file_input, manual_text], [upload_status, manual_text, manual_text])
    
    analyze_btn.click(handle_analyze, [manual_text], [metrics_dashboard, extraction_output])
    
    match_btn.click(handle_match, None, [match_display])
    
    draft_btn.click(handle_draft, None, [draft_display])
    
    score_btn.click(handle_score, None, [score_gauge, score_display])

if __name__ == "__main__":
    demo.launch(server_port=7860)

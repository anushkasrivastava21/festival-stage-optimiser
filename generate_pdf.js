const fs = require('fs');
const path = require('path');
const { marked } = require('./backend/node_modules/marked');
const katex = require('./backend/node_modules/katex');

const mdPath = path.join(__dirname, 'RESEARCH_PAPER.md');
let md = fs.readFileSync(mdPath, 'utf8');

// 1. Math extraction with placeholders to prevent Markdown parser from corrupting LaTeX underscores/tags
const mathBlocks = [];
md = md.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) => {
  try {
    const rendered = katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
    mathBlocks.push(`<div class="math-display">${rendered}</div>`);
    return `%%%MATH_BLOCK_${mathBlocks.length - 1}%%%`;
  } catch (e) {
    return match;
  }
});

md = md.replace(/\$([^\$\n]+?)\$/g, (match, tex) => {
  try {
    const rendered = katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
    mathBlocks.push(`<span class="math-inline">${rendered}</span>`);
    return `%%%MATH_BLOCK_${mathBlocks.length - 1}%%%`;
  } catch (e) {
    return match;
  }
});

// 2. Parse Markdown to HTML
let html = marked.parse(md);

// 3. Restore Math blocks
html = html.replace(/%%%MATH_BLOCK_(\d+)%%%/g, (match, idx) => {
  return mathBlocks[parseInt(idx, 10)];
});

// 4. Vector SVG Diagrams for Mermaid blocks
const svgArchitecture = `
<div class="figure-container">
<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; font-family:'Segoe UI', Arial, sans-serif;">
  <defs>
    <linearGradient id="gradEtl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient>
    <linearGradient id="gradDb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#eff6ff"/><stop offset="100%" stop-color="#dbeafe"/></linearGradient>
    <linearGradient id="gradNode" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f0fdf4"/><stop offset="100%" stop-color="#dcfce7"/></linearGradient>
    <linearGradient id="gradReact" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#faf5ff"/><stop offset="100%" stop-color="#f3e8ff"/></linearGradient>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569"/>
    </marker>
    <marker id="arrowBlue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#1d4ed8"/>
    </marker>
  </defs>

  <!-- Background -->
  <rect width="800" height="470" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Tier 1: Offline ETL -->
  <rect x="20" y="15" width="760" height="85" rx="5" fill="url(#gradEtl)" stroke="#94a3b8" stroke-width="1.2"/>
  <text x="35" y="34" font-size="11" font-weight="bold" fill="#1e293b">TIER 1: OFFLINE AUDIO PIPELINE &amp; CLUSTERING (Python / Scikit-learn)</text>
  
  <rect x="35" y="44" width="125" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="97" y="62" font-size="9.5" text-anchor="middle" font-weight="600" fill="#0f172a">Audio Corpus</text>
  <text x="97" y="76" font-size="8" text-anchor="middle" fill="#64748b">Kaggle / Spotify 114k</text>

  <line x1="160" y1="65" x2="185" y2="65" stroke="#475569" stroke-width="1.2" marker-end="url(#arrow)"/>

  <rect x="185" y="44" width="135" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="252" y="62" font-size="9.5" text-anchor="middle" font-weight="600" fill="#0f172a">Feature Extraction</text>
  <text x="252" y="76" font-size="8" text-anchor="middle" fill="#64748b">Energy, Tempo, Acousticness</text>

  <line x1="320" y1="65" x2="345" y2="65" stroke="#475569" stroke-width="1.2" marker-end="url(#arrow)"/>

  <rect x="345" y="44" width="135" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="412" y="62" font-size="9.5" text-anchor="middle" font-weight="600" fill="#0f172a">K-Means (k=5)</text>
  <text x="412" y="76" font-size="8" text-anchor="middle" fill="#64748b">Centroids &amp; Clusters</text>

  <line x1="480" y1="65" x2="505" y2="65" stroke="#475569" stroke-width="1.2" marker-end="url(#arrow)"/>

  <rect x="505" y="44" width="135" height="42" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
  <text x="572" y="62" font-size="9.5" text-anchor="middle" font-weight="600" fill="#0f172a">Adjacency Graph</text>
  <text x="572" y="76" font-size="8" text-anchor="middle" fill="#64748b">Nearest Neighbors &amp; Energy</text>

  <line x1="640" y1="65" x2="665" y2="65" stroke="#475569" stroke-width="1.2" marker-end="url(#arrow)"/>

  <rect x="665" y="44" width="100" height="42" rx="4" fill="#eff6ff" stroke="#2563eb" stroke-width="1.2"/>
  <text x="715" y="62" font-size="9.5" text-anchor="middle" font-weight="bold" fill="#1d4ed8">db/seed.sql</text>
  <text x="715" y="76" font-size="8" text-anchor="middle" fill="#3b82f6">Deterministic DML</text>

  <!-- Tier 2: The Core Database Engine -->
  <rect x="20" y="115" width="760" height="195" rx="5" fill="url(#gradDb)" stroke="#60a5fa" stroke-width="1.5"/>
  <text x="35" y="135" font-size="11" font-weight="bold" fill="#1e40af">TIER 2: ACTIVE RELATIONAL ENGINE / "THE DJ" (PostgreSQL 16)</text>

  <!-- Left: Concurrency & Ingestion -->
  <rect x="35" y="145" width="345" height="150" rx="4" fill="#ffffff" stroke="#93c5fd"/>
  <text x="45" y="163" font-size="10" font-weight="bold" fill="#1e3a8a">1. Ingestion &amp; Concurrency Control</text>
  
  <rect x="45" y="171" width="325" height="34" rx="3" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="55" y="185" font-size="8.5" font-weight="600" fill="#0284c7">fn_vote_before() [BEFORE INSERT Trigger]</text>
  <text x="55" y="197" font-size="8" fill="#475569">- SELECT ... FOR UPDATE (Strict 2PL Row Lock on Stages)</text>

  <rect x="45" y="210" width="325" height="34" rx="3" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="55" y="224" font-size="8.5" font-weight="600" fill="#0f172a">Integrity &amp; Rate Verification</text>
  <text x="55" y="236" font-size="8" fill="#475569">- 3s device throttle (FS429) &amp; playing track lookup (FS409)</text>

  <rect x="45" y="249" width="325" height="38" rx="3" fill="#eff6ff" stroke="#bfdbfe"/>
  <text x="55" y="263" font-size="8.5" font-weight="600" fill="#1d4ed8">fn_check_vibe_score() [AFTER INSERT Tripwire]</text>
  <text x="55" y="275" font-size="8" fill="#475569">- Window sum: max(t - window_seconds, last_pivot_at)</text>
  <text x="55" y="284" font-size="7.5" fill="#64748b">- Evaluates (Score &lt;= Threshold &amp;&amp; Cooldown Passed)</text>

  <!-- Right: Autopilot Procedures -->
  <rect x="400" y="145" width="365" height="150" rx="4" fill="#ffffff" stroke="#93c5fd"/>
  <text x="410" y="163" font-size="10" font-weight="bold" fill="#1e3a8a">2. Autonomous State Mutation (Stored Procedures)</text>

  <rect x="410" y="171" width="345" height="34" rx="3" fill="#fffbeb" stroke="#fde68a"/>
  <text x="420" y="185" font-size="8.5" font-weight="600" fill="#b45309">fn_pick_adjacent_cluster(current_cluster)</text>
  <text x="420" y="197" font-size="8" fill="#78350f">- Graph traversal prioritizing higher-energy neighbors</text>

  <rect x="410" y="210" width="345" height="38" rx="3" fill="#fef2f2" stroke="#fecaca"/>
  <text x="420" y="224" font-size="8.5" font-weight="600" fill="#b91c1c">sp_rewrite_queue(stage_id, 'autopilot', score)</text>
  <text x="420" y="236" font-size="8" fill="#7f1d1d">- DELETE FROM live_queue WHERE status = 'queued'</text>
  <text x="420" y="245" font-size="7.5" fill="#991b1b">- Reset current_vibe_score = 0 &amp; stamp last_pivot_at = now()</text>

  <rect x="410" y="253" width="345" height="34" rx="3" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="420" y="267" font-size="8.5" font-weight="600" fill="#0f172a">sp_fill_queue() via Cursors &amp; vibe_shift_log</text>
  <text x="420" y="279" font-size="8" fill="#475569">- Refill 5 tracks from new cluster &amp; commit audit record</text>

  <!-- Tier 3: Dumb Messenger -->
  <rect x="20" y="325" width="760" height="55" rx="5" fill="url(#gradNode)" stroke="#86efac" stroke-width="1.2"/>
  <text x="35" y="343" font-size="10.5" font-weight="bold" fill="#166534">TIER 3: DUMB MESSENGER / STATELESS GATEWAY (Node.js / Express)</text>
  <text x="35" y="358" font-size="8.5" fill="#15803d">Direct pass-through REST endpoints: POST /api/vote, GET /api/queue/:stageId, GET /api/admin/stats</text>
  <text x="35" y="370" font-size="8" fill="#475569">Maps PostgreSQL error codes (FS429 -&gt; 429, FS409 -&gt; 409, FS404 -&gt; 404). Zero state or business logic.</text>

  <!-- Tier 4: Client Interfaces -->
  <rect x="20" y="395" width="760" height="60" rx="5" fill="url(#gradReact)" stroke="#d8b4fe" stroke-width="1.2"/>
  <text x="35" y="413" font-size="10.5" font-weight="bold" fill="#6b21a8">TIER 4: ZERO-LOGIC CLIENT SURFACES (React / Vite)</text>
  
  <rect x="35" y="420" width="350" height="28" rx="3" fill="#ffffff" stroke="#c084fc"/>
  <text x="45" y="434" font-size="8.5" font-weight="600" fill="#581c87">Audience Interface (Mobile Web)</text>
  <text x="45" y="444" font-size="7.5" fill="#64748b">Web Audio synthesized playback + Love (+1) / Hate (-1) voting</text>

  <rect x="410" y="420" width="355" height="28" rx="3" fill="#ffffff" stroke="#c084fc"/>
  <text x="420" y="434" font-size="8.5" font-weight="600" fill="#581c87">Admin Stage Console (Desktop / iPad)</text>
  <text x="420" y="444" font-size="7.5" fill="#64748b">Real-time vote telemetry, audit shift feed &amp; manual override switch</text>

  <!-- Arrows -->
  <line x1="200" y1="310" x2="200" y2="325" stroke="#475569" stroke-width="1.2" marker-end="url(#arrow)"/>
  <line x1="600" y1="325" x2="600" y2="310" stroke="#475569" stroke-width="1.2" marker-end="url(#arrow)"/>
  <line x1="200" y1="380" x2="200" y2="395" stroke="#475569" stroke-width="1.2" marker-end="url(#arrow)"/>
  <line x1="600" y1="395" x2="600" y2="380" stroke="#475569" stroke-width="1.2" marker-end="url(#arrow)"/>
</svg>
<div class="caption"><strong>Figure 1:</strong> Four-Tier System Architecture. Business logic and queue mutation reside entirely within Tier 2 (PostgreSQL).</div>
</div>
`;

const svgEER = `
<div class="figure-container">
<svg viewBox="0 0 800 460" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; font-family:'Segoe UI', Arial, sans-serif;">
  <rect width="800" height="460" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>

  <!-- VIBE_CLUSTERS -->
  <g transform="translate(30, 25)">
    <rect width="180" height="90" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2"/>
    <rect width="180" height="24" rx="4" fill="#334155"/>
    <text x="90" y="16" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">vibe_clusters</text>
    <text x="10" y="38" font-size="8" font-weight="bold" fill="#1d4ed8">PK  cluster_id : SMALLINT</text>
    <text x="10" y="52" font-size="8" fill="#0f172a">UK  vibe_name : VARCHAR(30)</text>
    <text x="10" y="66" font-size="8" fill="#0f172a">    energy_level : SMALLINT</text>
    <text x="10" y="80" font-size="7.5" fill="#64748b">    CHECK (1 &lt;= energy &lt;= 10)</text>
  </g>

  <!-- CLUSTER_ADJACENCY -->
  <g transform="translate(30, 155)">
    <rect width="180" height="80" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2"/>
    <rect width="180" height="24" rx="4" fill="#334155"/>
    <text x="90" y="16" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">cluster_adjacency</text>
    <text x="10" y="38" font-size="8" font-weight="bold" fill="#1d4ed8">PK,FK1 from_cluster : SMALLINT</text>
    <text x="10" y="52" font-size="8" font-weight="bold" fill="#1d4ed8">PK,FK2 to_cluster : SMALLINT</text>
    <text x="10" y="68" font-size="7.5" fill="#64748b">    CHECK (from &lt;&gt; to)</text>
  </g>

  <!-- TRACKS -->
  <g transform="translate(260, 25)">
    <rect width="210" height="135" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2"/>
    <rect width="210" height="24" rx="4" fill="#334155"/>
    <text x="105" y="16" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">tracks</text>
    <text x="10" y="38" font-size="8" font-weight="bold" fill="#1d4ed8">PK  track_id : INTEGER</text>
    <text x="10" y="52" font-size="8" font-weight="bold" fill="#b91c1c">FK  cluster_id : SMALLINT</text>
    <text x="10" y="66" font-size="8" fill="#0f172a">    title : VARCHAR(120)</text>
    <text x="10" y="80" font-size="8" fill="#0f172a">    artist_name : VARCHAR(120)</text>
    <text x="10" y="94" font-size="8" fill="#0f172a">    duration_ms : INTEGER (&gt;0)</text>
    <text x="10" y="108" font-size="8" fill="#0f172a">    tempo : NUMERIC(5,1) (&gt;0)</text>
    <text x="10" y="122" font-size="7.5" fill="#64748b">    audio_url : TEXT</text>
  </g>

  <!-- STAGES -->
  <g transform="translate(520, 25)">
    <rect width="250" height="185" rx="4" fill="#eff6ff" stroke="#2563eb" stroke-width="1.8"/>
    <rect width="250" height="24" rx="4" fill="#1e40af"/>
    <text x="125" y="16" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">stages (Lock Hotspot)</text>
    <text x="10" y="38" font-size="8" font-weight="bold" fill="#1d4ed8">PK  stage_id : SMALLINT</text>
    <text x="10" y="52" font-size="8" fill="#0f172a">UK  stage_name : VARCHAR(50)</text>
    <text x="10" y="66" font-size="8" font-weight="bold" fill="#b91c1c">FK  current_cluster_id : SMALLINT</text>
    <text x="10" y="80" font-size="8" font-weight="600" fill="#1e3a8a">    current_vibe_score : INT [Mat]</text>
    <text x="10" y="94" font-size="8" font-weight="600" fill="#1e3a8a">    total_votes : BIGINT [Mat]</text>
    <text x="10" y="108" font-size="8" fill="#0f172a">    manual_override : BOOLEAN</text>
    <text x="10" y="122" font-size="8" fill="#0f172a">    threshold : INT DEFAULT -50</text>
    <text x="10" y="136" font-size="8" fill="#0f172a">    window_seconds : INT DEFAULT 60</text>
    <text x="10" y="150" font-size="8" fill="#0f172a">    cooldown_seconds : INT DEFAULT 20</text>
    <text x="10" y="164" font-size="7.5" fill="#64748b">    last_pivot_at : TIMESTAMPTZ</text>
  </g>

  <!-- LIVE_QUEUE -->
  <g transform="translate(300, 215)">
    <rect width="180" height="115" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2"/>
    <rect width="180" height="24" rx="4" fill="#334155"/>
    <text x="90" y="16" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">live_queue</text>
    <text x="10" y="38" font-size="8" font-weight="bold" fill="#1d4ed8">PK  queue_id : BIGSERIAL</text>
    <text x="10" y="52" font-size="8" font-weight="bold" fill="#b91c1c">FK  stage_id : SMALLINT</text>
    <text x="10" y="66" font-size="8" font-weight="bold" fill="#b91c1c">FK  track_id : INTEGER</text>
    <text x="10" y="80" font-size="8" fill="#0f172a">    play_order : INTEGER</text>
    <text x="10" y="94" font-size="8" fill="#0f172a">    status : 'queued'|'playing'|'played'</text>
    <text x="10" y="108" font-size="7.5" fill="#64748b">UQ(stage_id) WHERE status='playing'</text>
  </g>

  <!-- LIVE_VOTES -->
  <g transform="translate(540, 255)">
    <rect width="210" height="115" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1.4"/>
    <rect width="210" height="24" rx="4" fill="#991b1b"/>
    <text x="105" y="16" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">live_votes (High Volume)</text>
    <text x="10" y="38" font-size="8" font-weight="bold" fill="#1d4ed8">PK  vote_id : BIGSERIAL</text>
    <text x="10" y="52" font-size="8" font-weight="bold" fill="#b91c1c">FK  stage_id : SMALLINT</text>
    <text x="10" y="66" font-size="8" font-weight="bold" fill="#b91c1c">FK  track_id : INTEGER</text>
    <text x="10" y="80" font-size="8" fill="#0f172a">    session_id : UUID</text>
    <text x="10" y="94" font-size="8" fill="#0f172a">    vote_val : SMALLINT (-1, 1)</text>
    <text x="10" y="108" font-size="7.5" fill="#64748b">    vote_time : TIMESTAMPTZ</text>
  </g>

  <!-- VIBE_SHIFT_LOG -->
  <g transform="translate(30, 305)">
    <rect width="230" height="115" rx="4" fill="#f8fafc" stroke="#475569" stroke-width="1.2"/>
    <rect width="230" height="24" rx="4" fill="#334155"/>
    <text x="115" y="16" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">vibe_shift_log (Audit)</text>
    <text x="10" y="38" font-size="8" font-weight="bold" fill="#1d4ed8">PK  log_id : BIGSERIAL</text>
    <text x="10" y="52" font-size="8" font-weight="bold" fill="#b91c1c">FK  stage_id : SMALLINT</text>
    <text x="10" y="66" font-size="8" fill="#0f172a">FK  old_cluster_id, new_cluster_id</text>
    <text x="10" y="80" font-size="8" fill="#0f172a">    trigger_score : INTEGER</text>
    <text x="10" y="94" font-size="8" fill="#0f172a">    reason : 'autopilot'|'manual'|...</text>
    <text x="10" y="108" font-size="7.5" fill="#64748b">    created_at : TIMESTAMPTZ</text>
  </g>

  <!-- Lines -->
  <line x1="210" y1="70" x2="260" y2="70" stroke="#475569" stroke-width="1.2"/>
  <text x="235" y="65" font-size="7.5" fill="#475569">1 : N</text>

  <line x1="365" y1="160" x2="365" y2="215" stroke="#475569" stroke-width="1.2"/>
  <text x="370" y="190" font-size="7.5" fill="#475569">1 : N</text>

  <line x1="520" y1="175" x2="480" y2="245" stroke="#475569" stroke-width="1.2"/>
  <text x="505" y="205" font-size="7.5" fill="#475569">1 : N</text>

  <line x1="645" y1="210" x2="645" y2="255" stroke="#dc2626" stroke-width="1.2"/>
  <text x="650" y="235" font-size="7.5" fill="#dc2626">1 : N (Lock)</text>
</svg>
<div class="caption"><strong>Figure 2:</strong> Enhanced Entity-Relationship (EER) Model. Note the 1:N cardinality between Stages and Live_Queue and controlled denormalization of aggregate counters.</div>
</div>
`;

const svgSequence = `
<div class="figure-container">
<svg viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:auto; font-family:'Segoe UI', Arial, sans-serif;">
  <defs>
    <marker id="seqArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#1e293b"/>
    </marker>
    <marker id="seqArrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626"/>
    </marker>
  </defs>

  <!-- Background -->
  <rect width="800" height="420" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>

  <!-- Actor Lifelines -->
  <rect x="50" y="15" width="100" height="28" rx="4" fill="#eff6ff" stroke="#2563eb"/>
  <text x="100" y="33" font-size="9.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Phone A (Tx 1)</text>
  <line x1="100" y1="45" x2="100" y2="395" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4,4"/>

  <rect x="200" y="15" width="100" height="28" rx="4" fill="#fef2f2" stroke="#dc2626"/>
  <text x="250" y="33" font-size="9.5" font-weight="bold" fill="#991b1b" text-anchor="middle">Phone B (Tx 2)</text>
  <line x1="250" y1="45" x2="250" y2="395" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4,4"/>

  <rect x="360" y="15" width="140" height="28" rx="4" fill="#f8fafc" stroke="#475569"/>
  <text x="430" y="33" font-size="9.5" font-weight="bold" fill="#1e293b" text-anchor="middle">PG Lock Manager</text>
  <line x1="430" y1="45" x2="430" y2="395" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4,4"/>

  <rect x="530" y="15" width="110" height="28" rx="4" fill="#eff6ff" stroke="#2563eb"/>
  <text x="585" y="33" font-size="9.5" font-weight="bold" fill="#1e40af" text-anchor="middle">stages Row (s=1)</text>
  <line x1="585" y1="45" x2="585" y2="395" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4,4"/>

  <rect x="660" y="15" width="120" height="28" rx="4" fill="#f0fdf4" stroke="#16a34a"/>
  <text x="720" y="33" font-size="9.5" font-weight="bold" fill="#14532d" text-anchor="middle">Tripwire Engine</text>
  <line x1="720" y1="45" x2="720" y2="395" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4,4"/>

  <!-- Sequence Steps -->
  <!-- 1. Tx A begins and locks -->
  <line x1="100" y1="75" x2="430" y2="75" stroke="#1e293b" stroke-width="1.2" marker-end="url(#seqArrow)"/>
  <text x="260" y="69" font-size="8" fill="#1e293b" text-anchor="middle">1. BEGIN: SELECT ... FOR UPDATE (stage_id=1)</text>

  <rect x="425" y="80" width="10" height="145" fill="#3b82f6" opacity="0.3"/>
  <line x1="430" y1="90" x2="585" y2="90" stroke="#2563eb" stroke-width="1.2" marker-end="url(#seqArrow)"/>
  <text x="507" y="85" font-size="7.5" fill="#2563eb" text-anchor="middle">Acquires Exclusive Lock (X-Lock)</text>

  <!-- 2. Tx B tries to lock -->
  <line x1="250" y1="115" x2="430" y2="115" stroke="#dc2626" stroke-width="1.2" marker-end="url(#seqArrowRed)"/>
  <text x="340" y="109" font-size="8" fill="#dc2626" text-anchor="middle">2. BEGIN: SELECT ... FOR UPDATE (stage_id=1)</text>

  <rect x="245" y="120" width="10" height="115" fill="#ef4444" opacity="0.2"/>
  <rect x="260" y="125" width="150" height="24" rx="3" fill="#fef2f2" stroke="#fca5a5"/>
  <text x="335" y="141" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle">Tx B BLOCKED! (Wait Queue)</text>

  <!-- 3. Tx A executes trigger math -->
  <line x1="100" y1="155" x2="720" y2="155" stroke="#1e293b" stroke-width="1.2" marker-end="url(#seqArrow)"/>
  <text x="410" y="149" font-size="8" fill="#1e293b" text-anchor="middle">3. INSERT vote &amp; invoke fn_check_vibe_score()</text>

  <line x1="720" y1="180" x2="585" y2="180" stroke="#1e293b" stroke-width="1.2" marker-end="url(#seqArrow)"/>
  <text x="652" y="175" font-size="8" fill="#1e293b" text-anchor="middle">4. UPDATE score: 0 -&gt; -1, total: 1</text>

  <!-- 4. Tx A commits -->
  <line x1="100" y1="215" x2="430" y2="215" stroke="#2563eb" stroke-width="1.2" marker-end="url(#seqArrow)"/>
  <text x="265" y="209" font-size="8" font-weight="bold" fill="#1e40af" text-anchor="middle">5. COMMIT (Shrinking Phase: Lock Released)</text>

  <!-- 5. Tx B unblocks -->
  <line x1="430" y1="240" x2="250" y2="240" stroke="#16a34a" stroke-width="1.2" marker-end="url(#seqArrow)"/>
  <text x="340" y="235" font-size="8" font-weight="bold" fill="#15803d" text-anchor="middle">6. Tx B Awakens! X-Lock Granted</text>

  <rect x="425" y="240" width="10" height="110" fill="#ef4444" opacity="0.3"/>

  <!-- 6. Tx B processes with pristine updated score -->
  <line x1="250" y1="275" x2="585" y2="275" stroke="#1e293b" stroke-width="1.2" marker-end="url(#seqArrow)"/>
  <text x="417" y="269" font-size="8" fill="#1e293b" text-anchor="middle">7. Reads updated score (-1) pristine under lock</text>

  <line x1="250" y1="305" x2="720" y2="305" stroke="#1e293b" stroke-width="1.2" marker-end="url(#seqArrow)"/>
  <text x="485" y="299" font-size="8" fill="#1e293b" text-anchor="middle">8. INSERT vote &amp; UPDATE score: -1 -&gt; -2, total: 2</text>

  <line x1="250" y1="340" x2="430" y2="340" stroke="#2563eb" stroke-width="1.2" marker-end="url(#seqArrow)"/>
  <text x="340" y="335" font-size="8" font-weight="bold" fill="#1e40af" text-anchor="middle">9. COMMIT (Lock Released)</text>

  <!-- Result Banner -->
  <rect x="180" y="365" width="440" height="30" rx="4" fill="#f0fdf4" stroke="#86efac" stroke-width="1.2"/>
  <text x="400" y="384" font-size="9" font-weight="bold" fill="#14532d" text-anchor="middle">RESULT: Zero Lost Updates. All votes serialized with mathematical correctness.</text>
</svg>
<div class="caption"><strong>Figure 3:</strong> Strict Two-Phase Locking (SS2PL) Sequence Diagram. Demonstrating exclusive serialization on the stage row.</div>
</div>
`;

// Replace marked code blocks for mermaid with SVGs
html = html.replace(/<pre><code class="language-mermaid">[\s\S]*?flowchart[\s\S]*?<\/code><\/pre>/, svgArchitecture);
html = html.replace(/<pre><code class="language-mermaid">[\s\S]*?erDiagram[\s\S]*?<\/code><\/pre>/, svgEER);
html = html.replace(/<pre><code class="language-mermaid">[\s\S]*?sequenceDiagram[\s\S]*?<\/code><\/pre>/, svgSequence);

const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Crowdsourced Festival Stage Optimizer - Research Paper</title>
<style>
@page {
  size: A4;
  margin: 22mm 18mm 22mm 18mm;
}

body {
  font-family: 'Cambria', 'Times New Roman', 'Liberation Serif', Georgia, serif;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #111827;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
  text-align: justify;
}

h1 {
  font-size: 20pt;
  font-weight: bold;
  text-align: center;
  line-height: 1.25;
  margin-top: 10px;
  margin-bottom: 14px;
  color: #0f172a;
}

h2 {
  font-size: 13pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #1e3a8a;
  border-bottom: 1.5px solid #2563eb;
  padding-bottom: 3px;
  margin-top: 24px;
  margin-bottom: 10px;
  page-break-after: avoid;
}

h3 {
  font-size: 11.5pt;
  font-weight: bold;
  color: #1e40af;
  margin-top: 16px;
  margin-bottom: 6px;
  page-break-after: avoid;
}

h4 {
  font-size: 10.5pt;
  font-weight: bold;
  font-style: italic;
  color: #334155;
  margin-top: 12px;
  margin-bottom: 4px;
  page-break-after: avoid;
}

p {
  margin-top: 0;
  margin-bottom: 10px;
}

ul, ol {
  margin-top: 4px;
  margin-bottom: 12px;
  padding-left: 22px;
}

li {
  margin-bottom: 3px;
}

/* Academic Tables (Booktabs style) */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 9pt;
  line-height: 1.4;
  page-break-inside: avoid;
}

table thead tr {
  border-top: 2px solid #0f172a;
  border-bottom: 1px solid #475569;
}

table th {
  padding: 7px 9px;
  font-weight: bold;
  text-align: left;
  background-color: #f8fafc;
  color: #1e293b;
}

table tbody tr {
  border-bottom: 1px solid #e2e8f0;
}

table tbody tr:last-child {
  border-bottom: 2px solid #0f172a;
}

table tbody tr:nth-child(even) {
  background-color: #fcfdfe;
}

table td {
  padding: 6px 9px;
  vertical-align: top;
}

/* Code Listings */
pre {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
  border-left: 3.5px solid #2563eb;
  border-radius: 4px;
  padding: 9px 12px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 8.5pt;
  line-height: 1.4;
  color: #0f172a;
  overflow-x: auto;
  margin: 12px 0;
  page-break-inside: avoid;
}

code {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 9pt;
  background-color: #f1f5f9;
  padding: 1px 3px;
  border-radius: 3px;
  color: #0f172a;
}

pre code {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

/* Math */
.math-display {
  margin: 12px 0;
  text-align: center;
  overflow-x: auto;
}

.math-inline {
  display: inline-block;
  vertical-align: middle;
}

.katex {
  font-size: 1.05em;
}

/* Diagrams */
.figure-container {
  margin: 16px 0;
  text-align: center;
  page-break-inside: avoid;
}

.figure-container svg {
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

.caption {
  font-size: 8.5pt;
  font-style: italic;
  color: #475569;
  margin-top: 5px;
  text-align: center;
}

hr {
  border: none;
  border-top: 1px solid #cbd5e1;
  margin: 18px 0;
}

blockquote {
  border-left: 3px solid #94a3b8;
  margin: 10px 0;
  padding-left: 12px;
  color: #475569;
  font-style: italic;
}
</style>
</head>
<body>
${html}
</body>
</html>`;

const outPath = path.join(__dirname, 'paper_final.html');
fs.writeFileSync(outPath, completeHtml, 'utf8');
console.log('Successfully wrote paper_final.html (' + completeHtml.length + ' bytes)');

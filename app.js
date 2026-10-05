const GROUP_META = {
  "0": { key: "phd", label: "PhD Students", pill: "phd" },
  "1": { key: "senior", label: "Senior Scientists", pill: "senior" },
  "2": { key: "genai", label: "GenAI", pill: "genai" },
};

const state = {
  records: [],
  task: "racial_inequality",
  group: "all",
  search: "",
  classification: "",
};

const el = {
  list: document.getElementById("list"),
  status: document.getElementById("status"),
  groupNav: document.getElementById("group-nav"),
  meta: document.getElementById("run-meta"),
  search: document.getElementById("search"),
  classFilter: document.getElementById("class-filter"),
};

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function countByGroup(task) {
  const counts = { all: 0, "0": 0, "1": 0, "2": 0 };
  for (const record of state.records) {
    if (record.task !== task) continue;
    counts.all += 1;
    counts[record.group_code] += 1;
  }
  return counts;
}

function renderGroupNav() {
  const counts = countByGroup(state.task);
  const items = [
    ["all", "All", counts.all],
    ["0", GROUP_META["0"].label, counts["0"]],
    ["1", GROUP_META["1"].label, counts["1"]],
    ["2", GROUP_META["2"].label, counts["2"]],
  ];
  el.groupNav.innerHTML = items
    .map(([value, label, n]) => {
      const active = state.group === value ? " is-active" : "";
      return `<button type="button" class="group-btn${active}" data-group="${value}">${label} (${n})</button>`;
    })
    .join("");
}

function filteredRecords() {
  const q = state.search.trim().toLowerCase();
  return state.records.filter((record) => {
    if (record.task !== state.task) return false;
    if (state.group !== "all" && record.group_code !== state.group) return false;
    if (q && !record.participant_id.toLowerCase().includes(q)) return false;
    if (state.classification) {
      const hit = record.coding.pairs.some(
        (pair) => pair.primary_classification === state.classification,
      );
      if (!hit) return false;
    }
    return true;
  });
}

function formatYesNo(value) {
  const raw = value == null || value === "" ? "—" : String(value);
  const lower = raw.toLowerCase();
  if (lower === "yes") return `<span class="yn yn-yes">${escapeHtml(raw)}</span>`;
  if (lower === "no") return `<span class="yn yn-no">${escapeHtml(raw)}</span>`;
  return escapeHtml(raw);
}

function renderPair(pair) {
  const features = `${escapeHtml(pair.features[0])} × ${escapeHtml(pair.features[1])}`;
  const sign = pair.interaction_sign || {};
  const evidence = (pair.key_evidence || []).filter(Boolean);
  const curv = pair.curvature || {};
  const up = pair.upstream_interaction || {};
  return `
    <article class="pair">
      <div class="pair-top">
        <div>
          <div class="pair-rank">Pair ${escapeHtml(pair.rank)}</div>
          <p class="pair-features">${features} <span class="sign ${pair.predicted_sign === "+" ? "sign-pos" : "sign-neg"}">(${escapeHtml(pair.predicted_sign)})</span></p>
        </div>
      </div>
      <div class="class-badge ${escapeHtml(pair.primary_classification)}">${escapeHtml(pair.primary_classification)}</div>
      <div class="pair-meta">
        <div class="meta-row"><span class="meta-q">addressed:</span><span class="meta-a">${formatYesNo(pair.addressed)}</span></div>
        <div class="meta-row"><span class="meta-q">curvature:</span><span class="meta-a">${formatYesNo(curv.present || "—")}</span></div>
        <div class="meta-row"><span class="meta-q">upstream:</span><span class="meta-a">${formatYesNo(up.present || "—")}</span></div>
        <div class="meta-row"><span class="meta-q">sign match:</span><span class="meta-a">${formatYesNo(sign.consistent_with_predicted_sign || "—")}</span></div>
        <div class="meta-row"><span class="meta-q">implied sign:</span><span class="meta-a">${escapeHtml(sign.mechanism_implied_sign || "—")}</span></div>
      </div>
      ${
        evidence.length
          ? `<div>
              <p class="block-label strong-label">Key evidence for Classification</p>
              <ul class="evidence">${evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>`
          : ""
      }
      ${
        curv.mechanism || up.mechanism
          ? `<div class="reasoning">
              <p class="block-label strong-label">LLM reasoning about curvature and upstream</p>
              ${curv.mechanism ? `<p class="mech"><strong>Curvature:</strong> ${escapeHtml(curv.mechanism)}</p>` : ""}
              ${up.mechanism ? `<p class="mech"><strong>Upstream:</strong> ${escapeHtml(up.mechanism)}</p>` : ""}
            </div>`
          : ""
      }
    </article>
  `;
}

function renderTheory(record) {
  const pairs = record.coding?.pairs || [];
  const summary = record.coding?.causal_reconstruction?.summary || "";
  return `
    <section class="theory" id="${escapeHtml(record.participant_id)}-${escapeHtml(record.task)}">
      <div class="theory-head">
        <span class="pid">${escapeHtml(record.participant_id)}</span>
        <span class="pill conf">LLM_confidence: ${escapeHtml(record.coding?.confidence || "—")}</span>
      </div>
      <div class="theory-body">
        <div>
          <p class="block-label">Theory text</p>
          <p class="theory-text">${escapeHtml(record.theory_text)}</p>
        </div>
        ${
          summary
            ? `<div><p class="block-label">Causal reconstruction by LLM</p><p class="reconstruction">${escapeHtml(summary)}</p></div>`
            : ""
        }
        <div>
          <p class="block-label">Three theory × pair units</p>
          <div class="pairs">${pairs.map(renderPair).join("")}</div>
        </div>
      </div>
    </section>
  `;
}

function render() {
  renderGroupNav();
  const rows = filteredRecords();
  el.status.textContent = `${rows.length} theories · ${rows.length * 3} theory–pair units shown`;
  if (!rows.length) {
    el.list.innerHTML = `<p class="empty">No theories match the current filters.</p>`;
    return;
  }
  el.list.innerHTML = rows.map(renderTheory).join("");
}

function bind() {
  document.querySelectorAll(".task-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".task-btn").forEach((node) => node.classList.remove("is-active"));
      button.classList.add("is-active");
      state.task = button.dataset.task;
      state.group = "all";
      render();
    });
  });
  el.groupNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-group]");
    if (!button) return;
    state.group = button.dataset.group;
    render();
  });
  el.search.addEventListener("input", () => {
    state.search = el.search.value;
    render();
  });
  el.classFilter.addEventListener("change", () => {
    state.classification = el.classFilter.value;
    render();
  });
}

async function main() {
  bind();
  const response = await fetch("data.json");
  if (!response.ok) throw new Error(`Failed to load data.json (${response.status})`);
  const data = await response.json();
  state.records = data.records || [];
  el.meta.innerHTML = `model ${escapeHtml(data.model || "—")}<br />reasoning ${escapeHtml(data.reasoning_effort || "—")}<br />${state.records.length} records`;
  render();
}

main().catch((error) => {
  el.status.textContent = String(error);
});

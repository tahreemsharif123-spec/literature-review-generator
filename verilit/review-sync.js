// Save the current review to Supabase and reopen saved reviews (index.html only).
import { sb, enabled, getUser, onUser, openSignIn, mountAccountArea } from "./account.js";

const $ = s => document.querySelector(s);
const app = window.VeriLit;
const params = new URLSearchParams(location.search);
let currentId = params.get("review");

mountAccountArea($("#account"));

const saveBtn = $("#saveReview");
const saveStatus = $("#saveStatus");
const say = (msg, kind) => { saveStatus.textContent = msg; saveStatus.className = "status" + (kind ? " " + kind : ""); };

if (enabled) {
  $("#saveRow").hidden = false;
  onUser(u => {
    saveBtn.textContent = currentId ? "Save changes" : "Save to my reviews";
    $("#saveHint").textContent = u ? "Saved reviews appear in My reviews." : "Sign in to save this review and open it later.";
  });
}

function snapshot() {
  const verified = app.state.verified;
  const topic = $("#q").value.trim();
  return {
    title: (topic || "Untitled review").slice(0, 160),
    topic: topic.slice(0, 500),
    settings: {
      y1: $("#y1").value, y2: $("#y2").value, n: $("#n").value,
      style: $("#style").value, len: $("#len").value,
      useS2: $("#useS2").checked, onlyArticles: $("#onlyArticles").checked, needAbs: $("#needAbs").checked,
    },
    papers: verified.map(({ sel, ...p }) => p),
    paper_count: verified.length,
    draft: $("#draftIn").value.slice(0, 200000),
  };
}

async function save() {
  if (!getUser()) { openSignIn(save); return; }
  const row = snapshot();
  if (!row.paper_count) { say("Verify at least one paper in step 2 before saving.", "err"); return; }
  saveBtn.disabled = true; say("Saving…");
  try {
    if (currentId) {
      const { error } = await sb.from("reviews").update(row).eq("id", currentId);
      if (error) throw error;
    } else {
      const { data, error } = await sb.from("reviews").insert(row).select("id").single();
      if (error) throw error;
      currentId = data.id;
      history.replaceState(null, "", "?review=" + encodeURIComponent(currentId));
      saveBtn.textContent = "Save changes";
    }
    say(`Saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Open it any time from My reviews.`, "ok");
  } catch (err) {
    say("Could not save: " + (err.message || err), "err");
  } finally { saveBtn.disabled = false; }
}
saveBtn.addEventListener("click", save);

async function load(id) {
  const st = $("#searchStatus");
  if (!getUser()) {
    st.className = "status";
    st.textContent = "Sign in to open this saved review.";
    openSignIn(() => load(id));
    return;
  }
  st.className = "status"; st.textContent = "Opening your saved review…";
  const { data, error } = await sb.from("reviews").select("*").eq("id", id).maybeSingle();
  if (error || !data) {
    st.className = "status err";
    st.textContent = "This review was not found in your account.";
    currentId = null; history.replaceState(null, "", location.pathname);
    return;
  }
  const s = data.settings || {};
  $("#q").value = data.topic || data.title;
  for (const k of ["y1", "y2", "n", "style", "len"]) if (s[k] != null && $("#" + k)) $("#" + k).value = s[k];
  for (const k of ["useS2", "onlyArticles", "needAbs"]) if (typeof s[k] === "boolean") $("#" + k).checked = s[k];
  const papers = (data.papers || []).map(p => ({ ...p, sel: true, check: p.check || "ok" }));
  app.state.papers = papers;
  app.state.verified = papers;
  app.state.draftCited = null;
  app.renderPapers(); app.updateSel(); app.refreshDownstream();
  $("#verifyStatus").className = "status";
  $("#verifyStatus").textContent = `${papers.length} verified papers restored from your saved review.`;
  $("#draftIn").value = data.draft || "";
  if ((data.draft || "").trim()) app.runCheck(); else app.setStep(papers.length ? 3 : 1);
  st.textContent = `Opened "${data.title}". Last saved ${new Date(data.updated_at).toLocaleString()}.`;
  saveBtn.textContent = "Save changes";
}

if (currentId && enabled) {
  let started = false;
  onUser(u => { if (!started && (u || !getUser())) { started = true; load(currentId); } });
}

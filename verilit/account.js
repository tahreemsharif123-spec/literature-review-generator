// VeriLit accounts: Supabase client, sign-in dialog and header account area.
// Shared by index.html and dashboard.html. Loaded as an ES module.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";

const cfg = window.VERILIT_SUPABASE || {};
export const enabled = Boolean(cfg.url && cfg.anonKey);
export const sb = enabled
  ? createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let user = null;
const listeners = new Set();
export const getUser = () => user;
export function onUser(fn) { listeners.add(fn); fn(user); }
function setUser(u) {
  const changed = (u && u.id) !== (user && user.id);
  user = u || null;
  if (changed) listeners.forEach(fn => fn(user));
}

if (sb) {
  const { data } = await sb.auth.getSession();
  setUser(data.session ? data.session.user : null);
  sb.auth.onAuthStateChange((_event, session) => setUser(session ? session.user : null));
}

/* ---------- Sign-in dialog ---------- */
let dialog = null;
let afterSignIn = null;

function buildDialog() {
  dialog = document.createElement("dialog");
  dialog.className = "auth";
  dialog.setAttribute("aria-labelledby", "authTitle");
  dialog.innerHTML = `
    <div class="auth-inner">
      <h2 id="authTitle">Your VeriLit account</h2>
      <p class="lede">Save verified papers and drafts, and open them again from your dashboard.</p>
      <div class="auth-tabs" role="group" aria-label="Account action">
        <button type="button" data-mode="signin" aria-pressed="true">Sign in</button>
        <button type="button" data-mode="signup" aria-pressed="false">Create account</button>
      </div>
      <form id="authForm" novalidate>
        <div class="field"><label for="authEmail">Email</label>
          <input type="email" id="authEmail" autocomplete="email" required></div>
        <div class="field"><label for="authPass">Password</label>
          <input type="password" id="authPass" autocomplete="current-password" minlength="8" required></div>
        <p class="status" id="authStatus" role="status"></p>
        <div class="actions">
          <button type="button" class="ghost" id="authCancel">Cancel</button>
          <button type="submit" id="authSubmit">Sign in</button>
        </div>
      </form>
      <p class="fine">Passwords need at least 8 characters. Your reviews are private to your account.</p>
    </div>`;
  document.body.appendChild(dialog);

  let mode = "signin";
  const setMode = m => {
    mode = m;
    dialog.querySelectorAll(".auth-tabs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
    dialog.querySelector("#authSubmit").textContent = m === "signin" ? "Sign in" : "Create account";
    dialog.querySelector("#authPass").autocomplete = m === "signin" ? "current-password" : "new-password";
    status("");
  };
  const status = (msg, kind) => { const el = dialog.querySelector("#authStatus"); el.textContent = msg; el.className = "status" + (kind ? " " + kind : ""); };

  dialog.querySelectorAll(".auth-tabs button").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
  dialog.querySelector("#authCancel").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });

  dialog.querySelector("#authForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = dialog.querySelector("#authEmail").value.trim();
    const password = dialog.querySelector("#authPass").value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return status("Enter a valid email address.", "err");
    if (password.length < 8) return status("The password needs at least 8 characters.", "err");
    const btn = dialog.querySelector("#authSubmit");
    btn.disabled = true;
    status(mode === "signin" ? "Signing in…" : "Creating your account…");
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + "/dashboard.html" } });
        if (error) throw error;
        if (!data.session) { status("Account created. Open the link in your email to confirm it, then sign in.", "ok"); return; }
      }
      dialog.querySelector("#authPass").value = "";
      dialog.close();
      const next = afterSignIn; afterSignIn = null;
      if (next) next();
    } catch (err) {
      const msg = String(err && err.message || err);
      status(/invalid login/i.test(msg) ? "Email or password is wrong." : /already registered/i.test(msg) ? "This email already has an account. Use Sign in." : msg, "err");
    } finally { btn.disabled = false; }
  });
  dialog._setMode = setMode;
}

export function openSignIn(then, startMode = "signin") {
  if (!sb) return;
  if (!dialog) buildDialog();
  afterSignIn = then || null;
  dialog._setMode(startMode);
  dialog.showModal();
  dialog.querySelector("#authEmail").focus();
}

export async function signOut() { if (sb) await sb.auth.signOut(); }

/* ---------- Header account area ---------- */
export function mountAccountArea(el, { onDashboard = false } = {}) {
  if (!el || !sb) return;
  el.hidden = false;
  onUser(u => {
    if (!u) {
      el.innerHTML = `<button type="button" class="ghost" data-act="signin">Sign in</button><button type="button" data-act="signup">Create free account</button>`;
    } else {
      el.innerHTML = `<span class="who" title="${esc(u.email)}">${esc(u.email)}</span>`
        + (onDashboard ? `<a class="btn" href="index.html">New review</a>` : `<a class="btn" href="dashboard.html">My reviews</a>`)
        + `<button type="button" class="ghost" data-act="signout">Sign out</button>`;
    }
  });
  el.addEventListener("click", e => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "signin") openSignIn();
    if (act === "signup") openSignIn(null, "signup");
    if (act === "signout") signOut();
  });
}

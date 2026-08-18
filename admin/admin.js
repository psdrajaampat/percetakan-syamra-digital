/**
 * Syamra Digital — admin.js
 * Logika panel admin: login, load/edit/save konten, upload gambar ke R2.
 */
(function () {
  "use strict";

  let state = null; // seluruh objek konten (harga, layanan, galeri, owner, kontak)
  let activeLayananSub = "cetak";

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    let data = null;
    try { data = await res.json(); } catch { /* no body */ }
    if (!res.ok) {
      const msg = (data && data.error) || `Request gagal (${res.status})`;
      throw new Error(msg);
    }
    return data;
  }

  async function uploadFile(file, category) {
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    const res = await fetch("/api/upload", {
      method: "POST",
      credentials: "same-origin",
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload gagal");
    return data; // { ok, key, url }
  }

  // ---------- Auth ----------
  async function checkSession() {
    try {
      const data = await api("/api/me");
      return !!data.authenticated;
    } catch {
      return false;
    }
  }

  function showLogin() {
    $("#login-screen").classList.remove("hidden");
    $("#dashboard").classList.add("hidden");
  }

  async function showDashboard() {
    $("#login-screen").classList.add("hidden");
    $("#dashboard").classList.remove("hidden");
    await loadContent();
  }

  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = $("#login-password").value;
    const errEl = $("#login-error");
    errEl.textContent = "";
    try {
      await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
      $("#login-password").value = "";
      await showDashboard();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  $("#logout-btn").addEventListener("click", async () => {
    try { await api("/api/logout", { method: "POST" }); } catch {}
    showLogin();
  });

  // ---------- Load content ----------
  async function loadContent() {
    try {
      const data = await api("/api/content");
      state = normalize(data);
      renderAll();
    } catch (err) {
      showSaveBanner("Gagal memuat konten: " + err.message, "error");
    }
  }

  function normalize(data) {
    return {
      harga: Array.isArray(data.harga) ? data.harga : [],
      layanan: {
        cetak: (data.layanan && data.layanan.cetak) || [],
        ads: (data.layanan && data.layanan.ads) || [],
        reklame: (data.layanan && data.layanan.reklame) || [],
      },
      galeri: Array.isArray(data.galeri) ? data.galeri : [],
      owner: data.owner || { nama: "", title: "", bio: "", fotoUrl: "" },
      kontak: data.kontak || { alamat: "", whatsapp: "", facebook: "" },
    };
  }

  function renderAll() {
    renderHargaList();
    renderLayananList();
    renderGaleriList();
    renderOwnerForm();
    renderKontakForm();
  }

  // ---------- Tabs ----------
  $$(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      $$(".panel").forEach((p) => p.classList.remove("active"));
      $(`#panel-${tab}`).classList.add("active");
    });
  });

  $$(".sub-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".sub-tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeLayananSub = btn.dataset.sub;
      $$(".sub-panel").forEach((p) => p.classList.remove("active"));
      $(`#layanan-${activeLayananSub}-list`).classList.add("active");
    });
  });

  // ---------- Harga ----------
  function renderHargaList() {
    const list = $("#harga-list");
    const tpl = $("#tpl-harga-item");
    list.innerHTML = "";
    state.harga.forEach((item, idx) => {
      const node = tpl.content.cloneNode(true);
      const card = node.querySelector(".item-card");
      card.dataset.index = idx;
      card.querySelector(".f-icon").value = item.icon || "";
      card.querySelector(".f-nama").value = item.nama || "";
      card.querySelector(".f-harga").value = item.harga || "";
      card.querySelector(".f-satuan").value = item.satuan || "";
      card.querySelector(".btn-remove").addEventListener("click", () => {
        state.harga.splice(idx, 1);
        renderHargaList();
      });
      list.appendChild(node);
    });
  }

  $('[data-add="harga"]').addEventListener("click", () => {
    state.harga.push({ icon: "🖨️", nama: "", harga: "", satuan: "" });
    renderHargaList();
  });

  function collectHarga() {
    return $$("#harga-list .item-card").map((card) => ({
      icon: card.querySelector(".f-icon").value.trim(),
      nama: card.querySelector(".f-nama").value.trim(),
      harga: card.querySelector(".f-harga").value.trim(),
      satuan: card.querySelector(".f-satuan").value.trim(),
    }));
  }

  // ---------- Layanan ----------
  function renderLayananList() {
    ["cetak", "ads", "reklame"].forEach((cat) => {
      const list = $(`#layanan-${cat}-list`);
      const tpl = $("#tpl-layanan-item");
      list.innerHTML = "";
      state.layanan[cat].forEach((item, idx) => {
        const node = tpl.content.cloneNode(true);
        const card = node.querySelector(".item-card");
        card.dataset.index = idx;
        card.querySelector(".f-icon").value = item.icon || "";
        card.querySelector(".f-judul").value = item.judul || "";
        card.querySelector(".f-desc").value = item.desc || "";
        card.querySelector(".btn-remove").addEventListener("click", () => {
          state.layanan[cat].splice(idx, 1);
          renderLayananList();
        });
        list.appendChild(node);
      });
    });
  }

  $("[data-add-layanan]").addEventListener("click", () => {
    state.layanan[activeLayananSub].push({ icon: "🖨️", judul: "", desc: "" });
    renderLayananList();
  });

  function collectLayanan() {
    const out = {};
    ["cetak", "ads", "reklame"].forEach((cat) => {
      out[cat] = $$(`#layanan-${cat}-list .item-card`).map((card) => ({
        icon: card.querySelector(".f-icon").value.trim(),
        judul: card.querySelector(".f-judul").value.trim(),
        desc: card.querySelector(".f-desc").value.trim(),
      }));
    });
    return out;
  }

  // ---------- Galeri ----------
  function renderGaleriList() {
    const list = $("#galeri-list");
    const tpl = $("#tpl-galeri-item");
    list.innerHTML = "";
    state.galeri.forEach((item, idx) => {
      const node = tpl.content.cloneNode(true);
      const card = node.querySelector(".galeri-admin-item");
      card.dataset.index = idx;
      const imgEl = card.querySelector(".g-img");
      imgEl.src = item.url || "";
      imgEl.alt = item.label || "";
      card.querySelector(".g-label").value = item.label || "";
      card.querySelector(".btn-remove").addEventListener("click", () => {
        state.galeri.splice(idx, 1);
        renderGaleriList();
      });
      list.appendChild(node);
    });
  }

  $("#galeri-upload-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    showSaveBanner("Mengupload foto...", "success");
    try {
      const res = await uploadFile(file, "galeri");
      state.galeri.push({ url: res.url, label: "" });
      renderGaleriList();
      showSaveBanner("Foto berhasil diupload. Jangan lupa klik Simpan.", "success");
    } catch (err) {
      showSaveBanner("Upload gagal: " + err.message, "error");
    }
  });

  function collectGaleri() {
    return $$("#galeri-list .galeri-admin-item").map((card, idx) => ({
      url: state.galeri[idx].url,
      label: card.querySelector(".g-label").value.trim(),
    }));
  }

  // ---------- Owner ----------
  function renderOwnerForm() {
    $("#owner-preview").src = state.owner.fotoUrl || "";
    $("#owner-nama-input").value = state.owner.nama || "";
    $("#owner-title-input").value = state.owner.title || "";
    $("#owner-bio-input").value = state.owner.bio || "";
  }

  $("#owner-upload-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    showSaveBanner("Mengupload foto...", "success");
    try {
      const res = await uploadFile(file, "owner");
      state.owner.fotoUrl = res.url;
      $("#owner-preview").src = res.url;
      showSaveBanner("Foto berhasil diupload. Jangan lupa klik Simpan.", "success");
    } catch (err) {
      showSaveBanner("Upload gagal: " + err.message, "error");
    }
  });

  function collectOwner() {
    return {
      nama: $("#owner-nama-input").value.trim(),
      title: $("#owner-title-input").value.trim(),
      bio: $("#owner-bio-input").value.trim(),
      fotoUrl: state.owner.fotoUrl || "",
    };
  }

  // ---------- Kontak ----------
  function renderKontakForm() {
    $("#kontak-alamat-input").value = state.kontak.alamat || "";
    $("#kontak-whatsapp-input").value = state.kontak.whatsapp || "";
    $("#kontak-facebook-input").value = state.kontak.facebook || "";
  }

  function collectKontak() {
    return {
      alamat: $("#kontak-alamat-input").value.trim(),
      whatsapp: $("#kontak-whatsapp-input").value.trim().replace(/[^0-9]/g, ""),
      facebook: $("#kontak-facebook-input").value.trim(),
    };
  }

  // ---------- Save ----------
  $("#save-btn").addEventListener("click", async () => {
    const payload = {
      harga: collectHarga(),
      layanan: collectLayanan(),
      galeri: collectGaleri(),
      owner: collectOwner(),
      kontak: collectKontak(),
    };

    const btn = $("#save-btn");
    btn.disabled = true;
    setSaveStatus("Menyimpan...", "");
    try {
      await api("/api/content", { method: "POST", body: JSON.stringify(payload) });
      state = payload;
      setSaveStatus("✅ Tersimpan " + new Date().toLocaleTimeString("id-ID"), "success");
    } catch (err) {
      setSaveStatus("❌ Gagal menyimpan: " + err.message, "error");
    } finally {
      btn.disabled = false;
    }
  });

  function setSaveStatus(text, cls) {
    const el = $("#save-status");
    el.textContent = text;
    el.className = "save-status" + (cls ? " " + cls : "");
  }

  function showSaveBanner(text, type) {
    const el = $("#save-banner");
    el.textContent = text;
    el.className = "save-banner " + type;
    el.classList.remove("hidden");
    clearTimeout(showSaveBanner._t);
    showSaveBanner._t = setTimeout(() => el.classList.add("hidden"), 3500);
  }

  // ---------- Init ----------
  (async function init() {
    const authed = await checkSession();
    if (authed) {
      await showDashboard();
    } else {
      showLogin();
    }
  })();
})();

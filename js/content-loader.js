/**
 * Syamra Digital — content-loader.js
 * Mengambil data dari /api/content lalu merender bagian-bagian
 * yang bisa diubah lewat panel admin (harga, layanan, galeri, owner, kontak).
 * Jika API gagal (mis. dibuka dari file lokal), konten HTML default tetap tampil.
 */
(function () {
  const CARD_COLORS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7"];

  function esc(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderHarga(items) {
    const el = document.getElementById("harga-grid");
    if (!el || !Array.isArray(items)) return;
    el.innerHTML = items
      .map(
        (i) => `
      <div class="harga-card">
        <div class="icon">${esc(i.icon)}</div>
        <h3>${esc(i.nama)}</h3>
        <div class="price">${esc(i.harga)}</div>
        <div class="unit">${esc(i.satuan)}</div>
      </div>`
      )
      .join("");
  }

  function renderLayananPanel(panelId, items) {
    const el = document.getElementById(panelId);
    if (!el || !Array.isArray(items)) return;
    el.innerHTML = items
      .map(
        (i, idx) => `
      <div class="lay-card ${CARD_COLORS[idx % CARD_COLORS.length]}">
        <span class="icon">${esc(i.icon)}</span>
        <h3>${esc(i.judul)}</h3>
        <p>${esc(i.desc)}</p>
      </div>`
      )
      .join("");
  }

  function renderGaleri(items) {
    const el = document.getElementById("galeri-grid");
    if (!el || !Array.isArray(items)) return;
    if (items.length === 0) {
      el.innerHTML = `<p style="text-align:center;color:var(--text-light,#777);grid-column:1/-1;">Galeri segera hadir — stay tuned! 📸</p>`;
      return;
    }
    el.innerHTML = items
      .map(
        (i) => `
      <div class="galeri-item">
        <img src="${esc(i.url)}" alt="${esc(i.label)}" style="width:100%;height:100%;object-fit:cover;">
        <div class="label">${esc(i.label)}</div>
      </div>`
      )
      .join("");
  }

  function renderOwner(owner) {
    if (!owner) return;
    const foto = document.getElementById("owner-foto");
    const nama = document.getElementById("owner-nama");
    const title = document.getElementById("owner-title");
    const bio = document.getElementById("owner-bio");
    if (foto && owner.fotoUrl) foto.src = owner.fotoUrl;
    if (foto) foto.alt = owner.nama || "Owner";
    if (nama) nama.textContent = owner.nama || "";
    if (title) title.textContent = owner.title || "";
    if (bio) bio.textContent = owner.bio || "";
  }

  function renderKontak(kontak) {
    if (!kontak) return;
    const alamatEl = document.getElementById("kontak-alamat");
    const waEl = document.getElementById("kontak-whatsapp");
    const fbEl = document.getElementById("kontak-facebook");
    const waBtn = document.getElementById("kontak-wa-btn");
    const heroWaBtn = document.getElementById("hero-wa-btn");

    if (alamatEl && kontak.alamat) alamatEl.innerHTML = esc(kontak.alamat).replace(/\n/g, "<br>");
    if (waEl && kontak.whatsapp) {
      const formatted = formatWaDisplay(kontak.whatsapp);
      waEl.innerHTML = `${formatted}<br>Siap menerima pesanan &amp; konsultasi`;
    }
    if (fbEl && kontak.facebook) {
      fbEl.innerHTML = `Rumah Cetak Raja Ampat<br>${esc(kontak.facebook)}`;
    }
    const waLink = kontak.whatsapp ? `https://wa.me/${kontak.whatsapp.replace(/[^0-9]/g, "")}` : null;
    if (waLink && waBtn) waBtn.href = waLink;
    if (waLink && heroWaBtn) heroWaBtn.href = waLink;
  }

  function formatWaDisplay(number) {
    const digits = String(number).replace(/[^0-9]/g, "");
    // Tampilkan sebagai 0813-4343-5960 jika format Indonesia (62xxxxxxxxxx)
    const local = digits.startsWith("62") ? "0" + digits.slice(2) : digits;
    return local.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
  }

  async function loadContent() {
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      renderHarga(data.harga);
      if (data.layanan) {
        renderLayananPanel("tab-cetak", data.layanan.cetak);
        renderLayananPanel("tab-ads", data.layanan.ads);
        renderLayananPanel("tab-reklame", data.layanan.reklame);
      }
      renderGaleri(data.galeri);
      renderOwner(data.owner);
      renderKontak(data.kontak);
    } catch (e) {
      // Fetch gagal (mis. dibuka via file:// atau API belum di-deploy) —
      // biarkan konten default di HTML yang tampil.
      console.warn("Tidak bisa memuat konten dari API, menampilkan konten default.", e);
    }
  }

  document.addEventListener("DOMContentLoaded", loadContent);
})();

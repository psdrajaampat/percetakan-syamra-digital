/**
 * Syamra Digital — main.js
 * Interaktivitas tab layanan
 */

/**
 * Tampilkan panel layanan berdasarkan ID tab yang dipilih.
 * @param {string} id - ID panel ('cetak', 'ads', atau 'reklame')
 * @param {Event} e - Klik event dari tombol tab
 */
function showTab(id, e) {
  // Sembunyikan semua panel
  document.querySelectorAll('.layanan-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // Nonaktifkan semua tombol tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Tampilkan panel yang dipilih
  document.getElementById('tab-' + id).classList.add('active');

  // Aktifkan tombol yang diklik
  const clickedBtn = e ? e.target : document.querySelector(`[onclick*="'${id}'"]`);
  if (clickedBtn) clickedBtn.classList.add('active');
}

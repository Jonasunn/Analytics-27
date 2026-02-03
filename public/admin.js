/* global Chart */
let trendChart = null;
let funnelChart = null;

let banners = [];
let editingBannerId = null; // numeric row id being edited

const $ = (id) => document.getElementById(id);

function openModal() {
  const m = $("bannerModal");
  m.setAttribute("aria-hidden", "false");
}
function closeModal() {
  const m = $("bannerModal");
  m.setAttribute("aria-hidden", "true");
  clearBannerForm();
}

function clearBannerForm() {
  editingBannerId = null;
  $("bannerId").value = "";
  $("bannerName").value = "";
  $("bannerUrl").value = "";
  $("bannerSubmitBtn").textContent = "Add";
  $("bannerCancelBtn").style.display = "none";
}

function startEdit(row) {
  editingBannerId = row.id;
  $("bannerId").value = row.banner_id || "";
  $("bannerName").value = row.name || "";
  $("bannerUrl").value = row.url || "";
  $("bannerSubmitBtn").textContent = "Save";
  $("bannerCancelBtn").style.display = "inline-block";
  openModal();
}

function renderBannerList() {
  const wrap = $("bannerList");
  wrap.innerHTML = "";
  if (!banners.length) {
    wrap.innerHTML = '<div class="muted">No banners added yet.</div>';
    return;
  }

  for (const row of banners) {
    const el = document.createElement("div");
    el.className = "banner-row";
    el.innerHTML = `
      <div class="banner-meta">
        <div class="name">${escapeHtml(row.name || "")}</div>
        <div class="sub">ID: ${escapeHtml(row.banner_id || "")}</div>
      </div>
      <div class="banner-meta">
        <div class="sub">URL</div>
        <div class="sub">${escapeHtml(row.url || "")}</div>
      </div>
      <div></div>
      <div class="actions">
        <button type="button" data-edit="${row.id}">Edit</button>
        <button type="button" data-del="${row.id}">Delete</button>
      </div>
    `;
    wrap.appendChild(el);
  }

  wrap.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      await fetch(`/api/banners/${id}`, { method: "DELETE" });
      await loadBanners();
      await loadStats();
    });
  });

  wrap.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-edit"));
      const row = banners.find((b) => b.id === id);
      if (row) startEdit(row);
    });
  });
}

function renderBannerDropdown() {
  const sel = $("bannerSelect");
  sel.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = "All";
  sel.appendChild(optAll);

  for (const row of banners) {
    const opt = document.createElement("option");
    opt.value = row.banner_id;
    opt.textContent = row.name;
    sel.appendChild(opt);
  }
}

async function loadBanners() {
  const r = await fetch("/api/banners");
  const j = await r.json();
  banners = j.rows || [];
  renderBannerDropdown();
  renderBannerList();
}

function getFilters() {
  const banner_id = $("bannerSelect").value || "";
  const days = parseInt($("daysSelect").value || "28", 10);
  return { banner_id, days };
}

function setKpis(totals) {
  $("kpiViews").textContent = String(totals.views ?? 0);
  $("kpiClicks").textContent = String(totals.clicks ?? 0);
  $("kpiStarts").textContent = String(totals.starts ?? 0);
  $("kpiWins").textContent = String(totals.wins ?? 0);
  $("kpiRegs").textContent = String(totals.regs ?? 0);
}

function upsertTrend(series) {
  const labels = series.map((d) => d.date.slice(5)); // MM-DD
  const views = series.map((d) => d.views || 0);
  const clicks = series.map((d) => d.clicks || 0);
  const starts = series.map((d) => d.starts || 0);
  const wins = series.map((d) => d.wins || 0);
  const regs = series.map((d) => d.regs || 0);

  if (!trendChart) {
    trendChart = new Chart($("trendChart"), {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Views", data: views },
          { label: "Clicks", data: clicks },
          { label: "Starts", data: starts },
          { label: "Wins", data: wins },
          { label: "Registrations", data: regs },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: true } },
        scales: { y: { beginAtZero: true } },
      },
    });
  } else {
    trendChart.data.labels = labels;
    trendChart.data.datasets[0].data = views;
    trendChart.data.datasets[1].data = clicks;
    trendChart.data.datasets[2].data = starts;
    trendChart.data.datasets[3].data = wins;
    trendChart.data.datasets[4].data = regs;
    trendChart.update();
  }
}

function upsertFunnel(totals) {
  const labels = ["Views", "Clicks", "Starts", "Wins", "Registrations"];
  const data = [
    totals.views ?? 0,
    totals.clicks ?? 0,
    totals.starts ?? 0,
    totals.wins ?? 0,
    totals.regs ?? 0,
  ];

  if (!funnelChart) {
    funnelChart = new Chart($("funnelChart"), {
      type: "bar",
      data: { labels, datasets: [{ label: "Count", data }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  } else {
    funnelChart.data.datasets[0].data = data;
    funnelChart.update();
  }
}

function setRates(rates) {
  const win = (rates.winRate || 0) * 100;
  const rs = (rates.regRateFromStarts || 0) * 100;
  const rw = (rates.regRateFromWins || 0) * 100;
  $("ratesText").textContent = `Win: ${win.toFixed(1)}% · Reg/Starts: ${rs.toFixed(1)}% · Reg/Wins: ${rw.toFixed(1)}%`;
}

async function loadStats() {
  const { banner_id, days } = getFilters();
  const qs = new URLSearchParams();
  qs.set("days", String(days));
  if (banner_id) qs.set("banner_id", banner_id);

  const r = await fetch(`/api/stats?${qs.toString()}`);
  const j = await r.json();

  setKpis(j.totals || {});
  upsertTrend(j.series || []);
  upsertFunnel(j.totals || {});
  setRates(j.rates || {});
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function wire() {
  $("applyBtn").addEventListener("click", loadStats);
  $("refreshBtn").addEventListener("click", () => window.location.reload());
  $("manageBannersBtn").addEventListener("click", openModal);
  $("closeBannerModal").addEventListener("click", closeModal);
  $("bannerCancelBtn").addEventListener("click", clearBannerForm);

  $("bannerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      banner_id: $("bannerId").value.trim(),
      name: $("bannerName").value.trim(),
      url: $("bannerUrl").value.trim(),
    };

    if (editingBannerId) {
      await fetch(`/api/banners/${editingBannerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    await loadBanners();
    clearBannerForm();
  });

  // close modal when clicking backdrop
  $("bannerModal").addEventListener("click", (e) => {
    if (e.target && e.target.id === "bannerModal") closeModal();
  });
}

(async function init() {
  try {
    wire();
    await loadBanners();
    await loadStats();
  } catch (e) {
    document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:16px;">${escapeHtml(e?.stack || String(e))}</pre>`;
  }
})();

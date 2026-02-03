const $ = (id)=>document.getElementById(id);
function esc(s){return String(s).replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));}

async function load(){
  const q = ($("q").value||"").trim();
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  const r = await fetch(`/api/registrations?${qs.toString()}`);
  const j = await r.json();
  const rows = j.rows || [];
  if (!rows.length){
    $("rows").innerHTML = "<div class='muted'>No registrations found.</div>";
    return;
  }
  const table = document.createElement("table");
  table.style.width="100%";
  table.innerHTML = `
    <thead>
      <tr>
        <th align="left">Created</th>
        <th align="left">Name</th>
        <th align="left">Email</th>
        <th align="left">Phone</th>
        <th align="left">Banner ID</th>
        <th align="left">Score</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tb = table.querySelector("tbody");
  for (const r of rows){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${esc(r.created_at||"")}</td>
      <td>${esc(r.name||"")}</td>
      <td>${esc(r.email||"")}</td>
      <td>${esc(r.phone||"")}</td>
      <td>${esc(r.game_id||"")}</td>
      <td>${r.score ?? ""}</td>
    `;
    tb.appendChild(tr);
  }
  $("rows").innerHTML = "";
  $("rows").appendChild(table);
}

$("searchBtn").addEventListener("click", load);
load();

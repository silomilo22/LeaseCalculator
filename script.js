const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const money = n => "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clean = s => (s || "").replace(/\$/g, "").replace(/,/g, "").trim();
const num = s => Number(clean(s));

// Tabs
$$(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    ["analyze", "target", "batch"].forEach(id => {
      $(`#tab-${id}`).hidden = id !== tab;
    });
  });
});

// Theme toggle
const root = document.documentElement;
$("#themeToggle").addEventListener("click", () => {
  root.classList.toggle("light");
});

// Analyze lease
$("#an-use-budget").addEventListener("change", e => $("#an-maxpsf").disabled = !e.target.checked);
$("#an-use-extras").addEventListener("change", e => $("#an-extras").disabled = !e.target.checked);

$("#an-calc").addEventListener("click", () => {
  const addr = $("#an-addr").value.trim();
  const monthly = num($("#an-monthly").value);
  const sqft = num($("#an-sqft").value);
  if (!monthly || !sqft) return alert("Enter valid monthly rent and square footage.");

  const extras = $("#an-use-extras").checked ? num($("#an-extras").value) : 0;
  const effMonthly = monthly + extras;
  const psf = effMonthly / sqft;

  $("#an-out-addr").textContent = addr || "—";
  $("#an-out-cpsf").textContent = money(psf) + "/sq ft";
  $("#an-out-eff").textContent = money(effMonthly);
  $("#an-out-base").textContent = money(monthly);

  if ($("#an-use-budget").checked) {
    const max = num($("#an-maxpsf").value);
    if (!max) return alert("Enter valid max $/sqft.");
    const verdict = psf > max ? `<span class='bad'>Too expensive</span>` : `<span class='ok'>Within budget</span>`;
    const suggest = money(max * sqft);
    $("#an-out-verdict").innerHTML = verdict;
    $("#an-out-suggest").textContent = `Suggested Max: ${suggest}`;
  } else {
    $("#an-out-verdict").textContent = "";
    $("#an-out-suggest").textContent = "";
  }
});

$("#an-clear").addEventListener("click", () => {
  ["an-addr","an-monthly","an-sqft","an-maxpsf","an-extras"].forEach(id => $("#" + id).value = "");
  $("#an-out-addr").textContent = $("#an-out-cpsf").textContent = $("#an-out-eff").textContent = $("#an-out-base").textContent = "—";
  $("#an-out-verdict").textContent = $("#an-out-suggest").textContent = "";
});

// Target rent
$("#tg-calc").addEventListener("click", () => {
  const sqft = num($("#tg-sqft").value);
  const psf = num($("#tg-psf").value);
  if (!sqft || !psf) return alert("Enter valid numbers.");
  const monthly = sqft * psf;
  $("#tg-monthly").textContent = money(monthly);
  $("#tg-yearly").textContent = money(monthly * 12);
});
$("#tg-clear").addEventListener("click", () => {
  ["tg-sqft","tg-psf"].forEach(id => $("#" + id).value = "");
  $("#tg-monthly").textContent = $("#tg-yearly").textContent = "—";
});

// Batch mode (basic)
$("#b-calc").addEventListener("click", () => {
  const mode = document.querySelector('input[name="bmode"]:checked').value;
  const text = $("#b-paste").value.trim();
  if (!text) return alert("No data entered.");

  const rows = text.split("\n").map(l => l.split(/[, ]+/).filter(Boolean));
  const tbody = $("#b-table tbody");
  const thead = $("#b-table thead");
  tbody.innerHTML = ""; thead.innerHTML = "";

  if (mode === "analyze") {
    thead.innerHTML = "<tr><th>Address</th><th>Monthly</th><th>Extras</th><th>Sq Ft</th><th>$ /sq ft</th><th>Verdict</th><th>Suggested Max</th></tr>";

    const useBudget = $("#b-use-budget").checked ? num($("#b-maxpsf").value) : null;
    const extrasAll = $("#b-use-extras").checked ? num($("#b-extras").value) : 0;

    rows.forEach(parts => {
      const addr = isNaN(parts[0]) ? parts[0] : "";
      const m = num(parts[addr ? 1 : 0]);
      const s = num(parts[addr ? 2 : 1]);
      const e = extrasAll || num(parts[addr ? 3 : 2]) || 0;
      if (!m || !s) return;
      const eff = m + e;
      const psf = eff / s;
      const verdict = useBudget && psf > useBudget ? `<span class='bad'>Too expensive</span>` : `<span class='ok'>Within budget</span>`;
      const suggest = useBudget ? money(useBudget * s) : "—";

      tbody.innerHTML += `<tr><td>${addr || "(no address)"}</td><td>${money(m)}</td><td>${money(e)}</td><td>${s}</td><td>${money(psf)}/sq ft</td><td>${verdict}</td><td>${suggest}</td></tr>`;
    });
  } else {
    thead.innerHTML = "<tr><th>Sq Ft</th><th>$ /sq ft</th><th>Monthly</th><th>Yearly</th></tr>";
    rows.forEach(parts => {
      const s = num(parts[0]), p = num(parts[1]);
      if (!s || !p) return;
      const m = s * p;
      tbody.innerHTML += `<tr><td>${s}</td><td>${money(p)}</td><td>${money(m)}</td><td>${money(m * 12)}</td></tr>`;
    });
  }
});

// ---------- Helpers ----------
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const money = n => "$" + Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const clean = s => (s ?? "").toString().replace(/\$/g,"").replace(/,/g,"").trim();
const num   = s => { const v = Number(clean(s)); return Number.isFinite(v) ? v : NaN; };
function req(val, name, allowZero=false){
  if (!Number.isFinite(val) || (allowZero ? val < 0 : val <= 0)){
    throw new Error(`${name} must be ${allowZero ? "≥ 0" : "> 0"} and numeric.`);
  }
  return val;
}
function setHidden(el, hidden){ hidden ? el.setAttribute("hidden","") : el.removeAttribute("hidden"); }

// ---------- Tabs ----------
$$(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    $$(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    setHidden($("#tab-analyze"), tab!=="analyze");
    setHidden($("#tab-target"),  tab!=="target");
    setHidden($("#tab-batch"),   tab!=="batch");
  });
});

// ---------- Theme ----------
$("#themeToggle").addEventListener("click",()=>{
  const root = document.documentElement;
  root.classList.toggle("light");
});

// ---------- Analyze ----------
$("#an-use-budget").addEventListener("change", e => $("#an-maxpsf").disabled = !e.target.checked);
$("#an-use-extras").addEventListener("change", e => $("#an-extras").disabled = !e.target.checked);

$("#an-calc").addEventListener("click",()=>{
  try{
    const addr    = $("#an-addr").value.trim();
    const monthly = req(num($("#an-monthly").value), "Monthly Lease Cost");
    const sqft    = req(num($("#an-sqft").value), "Square Footage");
    const extras  = $("#an-use-extras").checked ? req(num($("#an-extras").value), "Extras", true) : 0;

    const effMonthly = monthly + extras;
    const cpsf = effMonthly / sqft;

    $("#an-out-addr").textContent = addr || "—";
    $("#an-out-cpsf").textContent = money(cpsf) + "/sq ft";
    $("#an-out-eff").textContent  = money(effMonthly);
    $("#an-out-base").textContent = money(monthly);

    if ($("#an-use-budget").checked){
      const maxpsf = req(num($("#an-maxpsf").value), "Max $/sq ft");
      const suggested = maxpsf * sqft;
      const diff = cpsf - maxpsf;
      const overUnder = effMonthly - suggested;
      $("#an-out-verdict").innerHTML =
        diff > 0 ? `<span class="bad">Too expensive</span> by ${money(diff)} per sq ft (${money(overUnder)} over target).`
                 : `<span class="ok">Within budget</span> by ${money(Math.abs(diff))} per sq ft (${money(Math.abs(overUnder))} under).`;
      $("#an-out-suggest").textContent = `Suggested max monthly (incl. extras): ${money(suggested)}.`;
    } else {
      $("#an-out-verdict").textContent = "(No budget check applied)";
      $("#an-out-suggest").textContent = "—";
    }
  }catch(err){ alert(err.message); }
});

$("#an-clear").addEventListener("click",()=>{
  ["an-addr","an-monthly","an-sqft","an-maxpsf","an-extras"].forEach(id=> $("#"+id).value="");
  $("#an-use-budget").checked=false; $("#an-maxpsf").disabled=true;
  $("#an-use-extras").checked=false; $("#an-extras").disabled=true;
  ["an-out-addr","an-out-cpsf","an-out-eff","an-out-base"].forEach(id=> $("#"+id).textContent="—");
  $("#an-out-verdict").textContent="—"; $("#an-out-suggest").textContent="—";
});

// ---------- Batch Mode ----------
function setBatchMode(mode){
  const isAnalyze = mode==="analyze";
  setHidden($("#qe-addr-row"), !isAnalyze);
  $("#qe-l1").textContent = isAnalyze ? "Monthly ($)" : "Sq Ft";
  $("#qe-l2").textContent = isAnalyze ? "Sq Ft"       : "Desired $/sq ft";
  $("#qe-a").placeholder  = isAnalyze ? "e.g. 2000"   : "e.g. 1500";
  $("#qe-b").placeholder  = isAnalyze ? "e.g. 1850"   : "e.g. 1.10";

  $("#b-use-budget").checked=false; $("#b-maxpsf").value="";
  $("#b-use-extras").checked=false; $("#b-extras").value="";

  $("#b-use-budget").disabled = !isAnalyze;
  $("#b-maxpsf").disabled     = !isAnalyze;
  $("#b-use-extras").disabled = !isAnalyze;
  $("#b-extras").disabled     = !isAnalyze;
}
setBatchMode("analyze");
$$('input[name="bmode"]').forEach(r=> r.addEventListener("change",()=> setBatchMode(r.value)));
$("#b-use-budget").addEventListener("change", e=> $("#b-maxpsf").disabled = !e.target.checked);
$("#b-use-extras").addEventListener("change", e=> $("#b-extras").disabled = !e.target.checked);

// Quick Entry -> Paste box
$("#qe-add").addEventListener("click",()=>{
  const mode = ($('input[name="bmode"]:checked')||{}).value || "analyze";
  const ta = $("#b-paste");

  if (mode === "analyze"){
    const addr = $("#qe-addr").value.trim();
    const monthly = num($("#qe-a").value);
    const sqft    = num($("#qe-b").value);
    if (!Number.isFinite(monthly) || monthly < 0 || !Number.isFinite(sqft) || sqft <= 0){
      alert("Enter Monthly (≥ 0) and Sq Ft (> 0)."); return;
    }
    const safeAddr = addr.includes(",") ? `"${addr}"` : addr; // quote if needed
    const line = addr ? `${safeAddr}, ${Math.round(monthly)}, ${Math.round(sqft)}`
                      : `${Math.round(monthly)}, ${Math.round(sqft)}`;
    if (ta.value && !ta.value.endsWith("\n")) ta.value += "\n";
    ta.value += line + "\n";
  } else {
    const sqft = num($("#qe-a").value);
    const psf  = num($("#qe-b").value);
    if (!Number.isFinite(sqft) || sqft <= 0 || !Number.isFinite(psf) || psf <= 0){
      alert("Enter Sq Ft (> 0) and $/sq ft (> 0)."); return;
    }
    const line = `${Math.round(sqft)}, ${psf.toFixed(2)}`;
    if (ta.value && !ta.value.endsWith("\n")) ta.value += "\n";
    ta.value += line + "\n";
  }
  ["qe-addr","qe-a","qe-b"].forEach(id=> $("#"+id).value="");
});
$("#qe-clear").addEventListener("click",()=> ["qe-addr","qe-a","qe-b"].forEach(id=> $("#"+id).value=""));

// Robust CSV/loose splitter
function splitSmart(line){
  const out=[]; let cur=""; let inQ=false;
  for (let i=0;i<line.length;i++){
    const ch=line[i];
    if (ch === '"'){ inQ=!inQ; continue; }
    if (!inQ && ch === ','){ out.push(cur.trim()); cur=""; continue; }
    cur += ch;
  }
  if (cur.trim() !== "") out.push(cur.trim());
  if (out.length <= 1){ return line.replace(/,/g," ").split(/\s+/).filter(Boolean); }
  return out;
}

// Calculate batch
$("#b-calc").addEventListener("click",()=>{
  const mode = ($('input[name="bmode"]:checked')||{}).value || "analyze";
  const text = $("#b-paste").value.trim();
  if (!text){ alert("Paste at least one row or use Quick Entry."); return; }

  const thead=$("#b-table thead"), tbody=$("#b-table tbody");
  thead.innerHTML=""; tbody.innerHTML="";

  if (mode === "analyze"){
    thead.innerHTML = `
      <tr>
        <th>Address</th><th>Monthly</th><th>Extras</th><th>Sq Ft</th>
        <th>$/sq ft</th><th>Verdict</th><th>Suggested Max</th>
      </tr>`;

    const globalMax = $("#b-use-budget").checked ? num($("#b-maxpsf").value) : null;
    const globalExtras = $("#b-use-extras").checked ? num($("#b-extras").value) : null;

    text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).forEach((line, i)=>{
      const fields = splitSmart(line);
      if (fields.length < 2){ return; }

      const sqft = num(fields[fields.length-1]);
      const monthly = num(fields[fields.length-2]);
      if (!Number.isFinite(sqft) || sqft <= 0 || !Number.isFinite(monthly)){ return; }

      let extras = null;
      if (fields.length >= 3){
        const maybeExtras = num(fields[fields.length-3]);
        if (Number.isFinite(maybeExtras)){ extras = maybeExtras; }
      }
      if (extras === null && Number.isFinite(globalExtras)){ extras = globalExtras; }
      extras = Number.isFinite(extras) ? extras : 0;

      const addrEnd = fields.length - (Number.isFinite(num(fields[fields.length-3])) ? 3 : 2);
      const address = addrEnd > 0 ? fields.slice(0, addrEnd).join(", ") : "(no address)";

      const effective = monthly + extras;
      const cpsf = effective / sqft;

      let verdict="(no budget)", suggested="—";
      if (Number.isFinite(globalMax)){
        verdict = cpsf > globalMax ? `<span class="bad">Too expensive</span>` : `<span class="ok">Within budget</span>`;
        suggested = money(globalMax * sqft);
      }

      // clickable address
      const mapsLink = address !== "(no address)"
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" style="color:var(--link);text-decoration:underline">${address}</a>`
        : address;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${mapsLink}</td>
        <td>${money(monthly)}</td>
        <td>${money(extras)}</td>
        <td>${sqft.toLocaleString()}</td>
        <td>${money(cpsf)}/sq ft</td>
        <td>${verdict}</td>
        <td>${suggested}</td>`;
      tbody.appendChild(tr);
    });

  } else {
    thead.innerHTML = `<tr><th>Sq Ft</th><th>$ /sq ft</th><th>Monthly</th><th>Yearly</th></tr>`;
    text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean).forEach(line=>{
      const parts = splitSmart(line);
      const sqft = num(parts[0]), psf = num(parts[1]);
      if (!Number.isFinite(sqft) || sqft<=0 || !Number.isFinite(psf) || psf<=0){ return; }
      const monthly = sqft*psf;
      const tr=document.createElement("tr");
      tr.innerHTML = `<td>${sqft.toLocaleString()}</td><td>${money(psf)}</td><td>${money(monthly)}</td><td>${money(monthly*12)}</td>`;
      tbody.appendChild(tr);
    });
  }
});

// Utilities
$("#b-clear").addEventListener("click",()=>{
  $("#b-paste").value="";
  $("#b-table thead").innerHTML="";
  $("#b-table tbody").innerHTML="";
});
$("#b-copy").addEventListener("click",()=>{
  const thead=$("#b-table thead"), tbody=$("#b-table tbody");
  if (!tbody.rows.length){ alert("No results to copy."); return; }
  const header=[...thead.rows[0].cells].map(c=>c.textContent).join("\t");
  const lines=[header, ...[...tbody.rows].map(r=>[...r.cells].map(td=>td.textContent).join("\t"))];
  navigator.clipboard.writeText(lines.join("\n")).then(()=>alert("Copied to clipboard."));
});

// ---------- Target (fix) ----------
$("#tg-calc").addEventListener("click", () => {
  try {
    const sqft = req(num($("#tg-sqft").value), "Square Footage");
    const psf  = req(num($("#tg-psf").value), "Desired $ per sq ft");
    const monthly = sqft * psf;
    $("#tg-monthly").textContent = money(monthly);
    $("#tg-yearly").textContent  = money(monthly * 12);
  } catch (err) {
    alert(err.message);
  }
});

$("#tg-clear").addEventListener("click", () => {
  ["tg-sqft","tg-psf"].forEach(id => $("#"+id).value = "");
  $("#tg-monthly").textContent = "—";
  $("#tg-yearly").textContent  = "—";
});



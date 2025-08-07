let img = null;
const canvas = document.getElementById("mappaCanvas");
const ctx = canvas.getContext("2d");
let recettori = [];

document.getElementById("uploadImg").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    img = new Image();
    img.onload = function () {
      simula();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  recettori.push({ x, y });
  simula();
});

function simula() {
  const potenza = parseFloat(document.getElementById("potenza").value);
  const tipo = document.getElementById("tipoPropagazione").value;
  const barriera = document.getElementById("barriera").value;
  const attenuazioneBarriera = parseFloat(document.getElementById("attenuazioneBarriera").value || 0);
  const scala = parseFloat(document.getElementById("scalaPx").value);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const colori = [
    { min: 90, max: 100, color: "rgba(255,0,0,0.4)", label: "> 90 dB" },
    { min: 80, max: 90, color: "rgba(255,165,0,0.4)", label: "80–90 dB" },
    { min: 70, max: 80, color: "rgba(255,255,0,0.4)", label: "70–80 dB" },
    { min: 60, max: 70, color: "rgba(144,238,144,0.4)", label: "60–70 dB" },
    { min: 50, max: 60, color: "rgba(0,128,0,0.4)", label: "50–60 dB" },
    { min: 0,  max: 50,  color: "rgba(173,216,230,0.4)", label: "< 50 dB" }
  ];

  // Disegna cerchi
  for (let r = 10; r < 400; r += 10) {
    const distanza = r * scala;
    let attenuazione = tipo === "sferica"
      ? 20 * Math.log10(distanza) + 11
      : 20 * Math.log10(distanza) + 8;

    if (barriera === "si") attenuazione += attenuazioneBarriera;
    const livello = potenza - attenuazione;
    const fascia = colori.find(c => livello >= c.min && livello < c.max);
    if (fascia) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      ctx.strokeStyle = fascia.color;
      ctx.lineWidth = 10;
      ctx.stroke();
    }
  }

  // Sorgente
  ctx.beginPath();
  ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "black";
  ctx.fill();

  // Scala metrica (100 m)
  const scala100 = 100 / scala;
  ctx.beginPath();
  ctx.moveTo(50, canvas.height - 30);
  ctx.lineTo(50 + scala100, canvas.height - 30);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillText("100 m", 50 + scala100 / 2 - 15, canvas.height - 35);

  // Recettori e livelli
  ctx.font = "12px Arial";
  ctx.fillStyle = "black";
  recettori.forEach((r, i) => {
    const dx = (r.x - centerX) * scala;
    const dy = (r.y - centerY) * scala;
    const distanza = Math.sqrt(dx*dx + dy*dy);
    let attenuazione = tipo === "sferica"
      ? 20 * Math.log10(distanza) + 11
      : 20 * Math.log10(distanza) + 8;
    if (barriera === "si") attenuazione += attenuazioneBarriera;
    const livello = potenza - attenuazione;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.fillText(`R${i + 1}: ${livello.toFixed(1)} dB`, r.x + 10, r.y);
  });

  // Legenda
  const legendaDiv = document.getElementById("legenda");
  legendaDiv.innerHTML = "<b>Legenda dB:</b><br>" + colori.map(c =>
    `<div><span style="display:inline-block;width:15px;height:10px;background:${c.color};margin-right:5px;"></span>${c.label}</div>`
  ).join("");
}

function generaPDF() {
  html2canvas(document.getElementById("mappaCanvas")).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text("SIMULAZIONE ACUSTICA", 15, 20);
    pdf.addImage(imgData, 'PNG', 15, 30, 180, 120);

    pdf.setFontSize(12);
    pdf.text("Formule:", 15, 160);
    pdf.text("Sferica: Lp = Lw - 20 log10(r) - 11", 15, 170);
    pdf.text("Semisferica: Lp = Lw - 20 log10(r) - 8", 15, 180);
    pdf.text("Con barriera: - ΔLᵦ (attenuazione inserita)", 15, 190);

    // Parametri
    const pot = document.getElementById("potenza").value;
    const tipo = document.getElementById("tipoPropagazione").value;
    const hSrc = document.getElementById("altezzaSorgente").value;
    const bar = document.getElementById("barriera").value;
    const hBar = document.getElementById("altezzaBarriera").value;
    const scala = document.getElementById("scalaPx").value;

    pdf.text("Parametri:", 15, 205);
    pdf.text(`Potenza: ${pot} dB`, 15, 215);
    pdf.text(`Propagazione: ${tipo}`, 15, 225);
    pdf.text(`Altezza sorgente: ${hSrc} m`, 15, 235);
    pdf.text(`Barriera: ${bar} (altezza ${hBar} m)`, 15, 245);
    pdf.text(`Scala immagine: 1 px = ${scala} m`, 15, 255);

    pdf.save("simulazione_acustica.pdf");
  });
}

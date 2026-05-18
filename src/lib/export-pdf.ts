import jsPDF from "jspdf";

interface Question {
  id: string;
  text: string;
  type: string;
}

interface Response {
  id: string;
  submitted_at: string;
  answers: Record<string, string | number>;
}

interface SurveyDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
}

export function exportSurveyPDF(
  survey: SurveyDetail,
  questions: Question[],
  responses: Response[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Helpers ─────────────────────────────────────────────────
  function checkPage(needed = 10) {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function text(str: string, x: number, size = 11, style: "normal" | "bold" = "normal", color = "#111827") {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    const hex = color.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    doc.setTextColor(r, g, b);
    doc.text(str, x, y);
  }

  function wrapped(str: string, x: number, maxW: number, size = 10, style: "normal" | "bold" = "normal", color = "#374151") {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    const hex = color.replace("#", "");
    doc.setTextColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
    const lines = doc.splitTextToSize(str, maxW) as string[];
    lines.forEach((line: string) => {
      checkPage(6);
      doc.text(line, x, y);
      y += 5.5;
    });
  }

  function rule(color = "#e5e7eb") {
    const hex = color.replace("#", "");
    doc.setDrawColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  }

  function badge(label: string, x: number, bgHex: string, textHex: string) {
    const pad = 3;
    doc.setFontSize(8);
    const w = doc.getTextWidth(label) + pad * 2;
    const hex = bgHex.replace("#", "");
    doc.setFillColor(parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16));
    doc.roundedRect(x, y - 4, w, 6, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    const th = textHex.replace("#", "");
    doc.setTextColor(parseInt(th.slice(0, 2), 16), parseInt(th.slice(2, 4), 16), parseInt(th.slice(4, 6), 16));
    doc.text(label, x + pad, y);
    return w + 4;
  }

  // ── Cover header ─────────────────────────────────────────────
  // Violet bar
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, pageW, 14, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("PrimePulseQ", margin, 9);
  doc.setFont("helvetica", "normal");
  doc.text("Survey Report", pageW - margin - doc.getTextWidth("Survey Report"), 9);

  y = 26;
  text(survey.title, margin, 20, "bold", "#111827");
  y += 10;

  if (survey.description) {
    wrapped(survey.description, margin, contentW, 10, "normal", "#6b7280");
    y += 2;
  }

  const statusColors: Record<string, [string, string]> = {
    active: ["#d1fae5", "#065f46"],
    closed: ["#f3f4f6", "#374151"],
    draft:  ["#fef9c3", "#713f12"],
  };
  const [sbg, stxt] = statusColors[survey.status] ?? ["#f3f4f6", "#374151"];
  badge(survey.status.toUpperCase(), margin, sbg, stxt);
  y += 8;

  // Meta row
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  const created = new Date(survey.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  doc.text(`Created: ${created}`, margin, y);
  doc.text(`Responses: ${responses.length}`, margin + 55, y);
  doc.text(`Questions: ${questions.length}`, margin + 110, y);
  y += 10;
  rule();

  // ── Per-question results ─────────────────────────────────────
  questions.forEach((q, qi) => {
    const answers = responses.map((r) => r.answers[q.id]).filter((a) => a !== undefined);
    if (answers.length === 0) return;

    checkPage(20);

    // Question number + text
    text(`Q${qi + 1}`, margin, 10, "bold", "#7c3aed");
    y += 6;
    wrapped(q.text, margin, contentW, 11, "bold", "#111827");
    y += 2;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(`${answers.length} response${answers.length !== 1 ? "s" : ""} · ${q.type.replace("_", " ")}`, margin, y);
    y += 6;

    if (q.type === "scale") {
      const nums = answers.filter((a): a is number => typeof a === "number");
      if (nums.length) {
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        text(`Average: ${avg.toFixed(1)} / 10`, margin, 14, "bold", "#7c3aed");
        y += 8;

        // Mini bar chart
        const barW = contentW / 10 - 2;
        [1,2,3,4,5,6,7,8,9,10].forEach((n, i) => {
          const count = nums.filter((v) => v === n).length;
          const pct = nums.length ? count / nums.length : 0;
          const barH = Math.max(1, pct * 25);
          const x = margin + i * (barW + 2);

          const fillHex = n >= 8 ? "#10b981" : n >= 5 ? "#7c3aed" : "#f59e0b";
          const fh = fillHex.replace("#", "");
          doc.setFillColor(parseInt(fh.slice(0,2),16), parseInt(fh.slice(2,4),16), parseInt(fh.slice(4,6),16));
          doc.rect(x, y + (25 - barH), barW, barH, "F");

          doc.setFontSize(7);
          doc.setTextColor(107, 114, 128);
          doc.text(String(n), x + barW / 2 - 1, y + 30);
          if (count > 0) {
            doc.setTextColor(107, 114, 128);
            doc.text(String(count), x + barW / 2 - 1, y + (25 - barH) - 1);
          }
        });
        y += 38;
      }
    } else if (q.type === "yes_no" || q.type === "multiple_choice") {
      const counts: Record<string, number> = {};
      answers.forEach((a) => { const k = String(a); counts[k] = (counts[k] ?? 0) + 1; });
      Object.entries(counts).sort(([,a],[,b]) => b - a).forEach(([opt, count]) => {
        checkPage(8);
        const pct = answers.length ? (count / answers.length) * 100 : 0;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(55, 65, 81);
        doc.text(opt, margin, y);
        doc.text(`${count} (${Math.round(pct)}%)`, margin + contentW - 20, y);

        // Bar
        const barY = y + 2;
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(margin, barY, contentW - 30, 3, 1, 1, "F");
        doc.setFillColor(124, 58, 237);
        if (pct > 0) doc.roundedRect(margin, barY, (contentW - 30) * (pct / 100), 3, 1, 1, "F");
        y += 10;
      });
    } else if (q.type === "text") {
      answers.slice(0, 5).forEach((a) => {
        checkPage(12);
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(margin, y - 4, contentW, 8, 2, 2, "FD");
        wrapped(`"${a}"`, margin + 4, contentW - 8, 9, "normal", "#374151");
        y += 2;
      });
      if (answers.length > 5) {
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`+${answers.length - 5} more responses`, margin, y);
        y += 6;
      }
    }

    y += 4;
    if (qi < questions.length - 1) rule("#f3f4f6");
  });

  // ── Footer on last page ──────────────────────────────────────
  checkPage(12);
  y += 4;
  rule();
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated by PrimePulseQ · ${new Date().toLocaleDateString()}`, margin, y);
  doc.text("All responses are anonymous", pageW - margin - doc.getTextWidth("All responses are anonymous"), y);

  doc.save(`${survey.title.replace(/\s+/g, "-").toLowerCase()}-results.pdf`);
}

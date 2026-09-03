"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WORK_STATUS_LABEL, WORK_PRIORITY_LABEL, type Work } from "@/types";
import { formatDate } from "@/lib/utils";

function rows(works: Work[]) {
  return works.map((w) => ({
    Nomor: w.work_number,
    "Nama Pekerjaan": w.title,
    Unit: w.unit?.name ?? "-",
    Kategori: w.category?.name ?? "-",
    "Penanggung Jawab": w.responsible?.full_name ?? "-",
    Prioritas: WORK_PRIORITY_LABEL[w.priority],
    Status: WORK_STATUS_LABEL[w.status],
    "Progress (%)": w.progress,
    "Tanggal Mulai": formatDate(w.start_date),
    Deadline: formatDate(w.deadline),
  }));
}

export function ExportButtons({ works }: { works: Work[] }) {
  async function exportCsv() {
    const data = rows(works);
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((r) => headers.map((h) => `"${String(r[h as keyof typeof r]).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, "laporan-simonta.csv");
  }

  async function exportExcel() {
    const ExcelJS = (await import("exceljs")).default;
    const data = rows(works);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Laporan");
    if (data.length > 0) {
      ws.columns = Object.keys(data[0]).map((key) => ({ header: key, key, width: 20 }));
      ws.addRows(data);
      ws.getRow(1).font = { bold: true };
    }
    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "laporan-simonta.xlsx"
    );
  }

  async function exportPdf() {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const data = rows(works);
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(12);
    doc.text("Laporan Pekerjaan — SIMONTA Kantor Pertanahan Kota Cimahi", 14, 12);
    autoTable(doc, {
      startY: 18,
      head: [Object.keys(data[0] ?? {})],
      body: data.map((r) => Object.values(r)),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [15, 23, 42] },
    });
    doc.save("laporan-simonta.pdf");
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportCsv}>
        <Download className="h-4 w-4" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportExcel}>
        <Download className="h-4 w-4" /> Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportPdf}>
        <Download className="h-4 w-4" /> PDF
      </Button>
    </div>
  );
}

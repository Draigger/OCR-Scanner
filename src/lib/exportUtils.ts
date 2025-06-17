import type { ExtractedIdData } from '@/types';
import jsPDF from 'jspdf';

export function exportToJson(data: ExtractedIdData, filename: string = 'id-data.json'): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPdf(data: ExtractedIdData, filename: string = 'id-data.pdf'): void {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text('Extracted ID Card Data', 14, 22);
  
  doc.setFontSize(12);
  let yPos = 40;
  const lineHeight = 10;

  (Object.keys(data) as Array<keyof ExtractedIdData>).forEach(key => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    doc.text(`${label}: ${data[key]}`, 14, yPos);
    yPos += lineHeight;
  });

  doc.save(filename);
}

export function exportToCsv(data: ExtractedIdData, filename: string = 'id-data.csv'): void {
  const headers = (Object.keys(data) as Array<keyof ExtractedIdData>).join(',');
  const values = (Object.values(data) as string[]).map(value => `"${value.replace(/"/g, '""')}"`).join(',');
  const csvString = `${headers}\n${values}`;
  
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

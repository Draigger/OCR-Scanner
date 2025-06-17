'use client';

import type { ExtractedIdData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { exportToJson, exportToPdf, exportToCsv } from '@/lib/exportUtils';

interface ExportControlsProps {
  data: ExtractedIdData | null;
}

export function ExportControls({ data }: ExportControlsProps) {
  if (!data) {
    return null; // Don't render if there's no data to export
  }

  const handleExportJson = () => {
    if (data) exportToJson(data);
  };

  const handleExportPdf = () => {
    if (data) exportToPdf(data);
  };

  const handleExportCsv = () => {
    if (data) exportToCsv(data);
  };

  return (
    <Card className="shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline">
          <Download className="mr-2 h-6 w-6 text-primary" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button onClick={handleExportJson} disabled={!data} variant="outline" aria-label="Export data as JSON">
          Export JSON
        </Button>
        <Button onClick={handleExportPdf} disabled={!data} variant="outline" aria-label="Export data as PDF">
          Export PDF
        </Button>
        <Button onClick={handleExportCsv} disabled={!data} variant="outline"aria-label="Export data as CSV">
          Export CSV
        </Button>
      </CardContent>
    </Card>
  );
}

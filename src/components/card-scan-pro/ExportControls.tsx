'use client';

import type { ExtractedIdData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileJson, FileText, Table } from 'lucide-react';
import { exportToJson, exportToPdf, exportToCsv } from '@/lib/exportUtils';

interface ExportControlsProps {
  data: ExtractedIdData | null;
}

export function ExportControls({ data }: ExportControlsProps) {
  if (!data) {
    return null;
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

  const exportOptions = [
    {
      label: 'Export JSON',
      icon: FileJson,
      onClick: handleExportJson,
      description: 'Machine-readable format',
      color: 'text-blue-600'
    },
    {
      label: 'Export PDF',
      icon: FileText,
      onClick: handleExportPdf,
      description: 'Printable document',
      color: 'text-red-600'
    },
    {
      label: 'Export CSV',
      icon: Table,
      onClick: handleExportCsv,
      description: 'Spreadsheet format',
      color: 'text-green-600'
    }
  ];

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover-lift">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-2xl font-bold">
          <div className="p-2 bg-primary/10 rounded-lg mr-3">
            <Download className="h-6 w-6 text-primary" />
          </div>
          Export Data
        </CardTitle>
        <p className="text-muted-foreground">Download your extracted data in various formats</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {exportOptions.map((option, index) => (
          <Button
            key={option.label}
            onClick={option.onClick}
            disabled={!data}
            variant="outline"
            className="w-full h-16 justify-start text-left hover-lift border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
            aria-label={option.label}
          >
            <div className="flex items-center gap-4 w-full">
              <div className={`p-2 rounded-lg bg-muted/50 ${option.color}`}>
                <option.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground" />
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
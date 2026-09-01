'use client';

import React, { useState } from 'react';
import { useCRM } from '@/lib/store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { parseCsvToLeads } from '@/lib/exportCsv';
import { Lead } from '@/types/crm';
import { IconUpload, IconFileText, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';

export function ImportCsvModal() {
  const { isImportModalOpen, setIsImportModalOpen, bulkImportLeads } = useCRM();

  const [csvText, setCsvText] = useState('');
  const [parsedLeads, setParsedLeads] = useState<Partial<Lead>[]>([]);
  const [fileName, setFileName] = useState('');

  const sampleCsv = `Company Name,Contact Name,Website,Location,Phone,Email,Deal Value,Service Interest,Status
Starlight Health,Dr. Kevin Ortiz,https://starlighthealth.io,Denver CO,+1 (303) 555-0199,kevin@starlighthealth.io,8500,AI Voice Agent,Not Contacted
HyperScale Retail,Chloe Vance,https://hyperscaleretail.com,New York NY,+1 (212) 555-8821,chloe@hyperscaleretail.com,15000,Web Development,Needs Outreach
Optima Logistics,Dave Ramos,https://optimalogistics.net,Dallas TX,+1 (214) 555-7733,dave@optimalogistics.net,12000,Workflow / n8n Automation,Contacted`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const parsed = parseCsvToLeads(text);
      setParsedLeads(parsed);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    const parsed = parseCsvToLeads(text);
    setParsedLeads(parsed);
  };

  const handlePasteSample = () => {
    handleTextChange(sampleCsv);
    setFileName('sample_agency_leads.csv');
  };

  const handleImport = () => {
    if (!parsedLeads.length) return;
    bulkImportLeads(parsedLeads);
    setIsImportModalOpen(false);
    setCsvText('');
    setParsedLeads([]);
    setFileName('');
  };

  return (
    <Modal
      isOpen={isImportModalOpen}
      onClose={() => setIsImportModalOpen(false)}
      title="Bulk Import Agency Leads"
      subtitle="Upload a CSV spreadsheet or paste formatted lead rows"
      maxWidth="max-w-[680px]"
    >
      <div className="space-y-4 text-[12px]">
        {/* Upload Zone */}
        <div className="border-2 border-dashed border-[var(--t-border-color-medium)] hover:border-[#5d4ef7] rounded-[8px] p-4 text-center bg-[var(--t-background-transparent-lighter)] transition-colors relative">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center gap-1.5 pointer-events-none">
            <IconUpload size={24} className="text-[#5d4ef7]" />
            <span className="text-[13px] font-medium text-[var(--t-font-color-primary)]">
              {fileName ? fileName : 'Choose CSV file or drag & drop here'}
            </span>
            <span className="text-[11px] text-[var(--t-font-color-tertiary)]">
              Accepts .csv with Company Name, Website, Email, Deal Value, Service Type
            </span>
          </div>
        </div>

        {/* Or Paste Raw Text */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-[var(--t-font-color-secondary)]">
              Or Paste Raw CSV Data
            </label>
            <button
              type="button"
              onClick={handlePasteSample}
              className="text-[11px] text-[#5d4ef7] hover:underline"
            >
              Paste Sample Template
            </button>
          </div>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Paste comma-separated lead data here..."
            className="w-full font-mono text-[11px] bg-[var(--t-background-transparent-lighter)] border border-[var(--t-border-color-medium)] rounded-[8px] p-2.5 text-[var(--t-font-color-primary)] outline-none focus:border-[#5d4ef7]"
          />
        </div>

        {/* Parsed Preview Table */}
        {parsedLeads.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
                Preview ({parsedLeads.length} leads detected)
              </span>
              <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                <IconCheck size={13} /> Ready for Import
              </span>
            </div>

            <div className="max-h-[160px] overflow-y-auto border border-[var(--t-border-color-light)] rounded-[6px] bg-[var(--t-background-secondary)]">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[var(--t-background-quaternary)] sticky top-0 text-[var(--t-font-color-tertiary)] border-b border-[var(--t-border-color-light)]">
                  <tr>
                    <th className="p-2">Company</th>
                    <th className="p-2">Service</th>
                    <th className="p-2">Value</th>
                    <th className="p-2">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--t-border-color-light)] text-[var(--t-font-color-secondary)]">
                  {parsedLeads.slice(0, 10).map((l, i) => (
                    <tr key={i} className="hover:bg-[var(--t-background-transparent-light)]">
                      <td className="p-2 font-medium text-[var(--t-font-color-primary)]">
                        {l.companyName}
                      </td>
                      <td className="p-2">{l.serviceInterest}</td>
                      <td className="p-2 font-mono">{formatCurrency(l.dealValue || 0)}</td>
                      <td className="p-2">{l.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--t-border-color-light)]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setIsImportModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!parsedLeads.length}
            leftIcon={<IconCheck size={14} />}
            onClick={handleImport}
          >
            Import {parsedLeads.length} Leads
          </Button>
        </div>
      </div>
    </Modal>
  );
}

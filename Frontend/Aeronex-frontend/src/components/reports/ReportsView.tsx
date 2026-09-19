import React, { useState } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ReportItem } from '../../types';

const AERONEX_REPORTS: ReportItem[] = [
  {
    id: 'engine-health',
    code: 'AER-HR-001',
    title: 'Engine Health Assessment',
    summary:
      'Current engine health, anomaly status, degradation estimate, and maintenance assessment.',
    date: 'LIVE SESSION',
    pages: 1,
    type: 'Health Report',
    status: 'AVAILABLE',
    author: 'Aeronex Analytics',
  },
  {
    id: 'telemetry',
    code: 'AER-TL-001',
    title: 'Telemetry Session Report',
    summary:
      'Recorded engine telemetry including RPM, CHT, EGT, oil parameters, fuel flow, and vibration.',
    date: 'LIVE SESSION',
    pages: 1,
    type: 'Telemetry Report',
    status: 'AVAILABLE',
    author: 'Aeronex Telemetry',
  },
  {
    id: 'mission',
    code: 'AER-MS-001',
    title: 'Mission Reliability Report',
    summary:
      'Mission state, completion probability, reliability estimate, risk level, and current decision.',
    date: 'LIVE SESSION',
    pages: 1,
    type: 'Mission Report',
    status: 'AVAILABLE',
    author: 'Aeronex Mission Analytics',
  },
  {
    id: 'degradation',
    code: 'AER-DG-001',
    title: 'Degradation & Maintenance Report',
    summary:
      'Engine degradation score, trend assessment, predicted maintenance action, and priority.',
    date: 'LIVE SESSION',
    pages: 1,
    type: 'Maintenance Report',
    status: 'AVAILABLE',
    author: 'Aeronex Predictive Analytics',
  },
];

export const ReportsView: React.FC = () => {
  const [activeReport, setActiveReport] =
    useState<ReportItem | null>(AERONEX_REPORTS[0]);

  const [downloadSuccess, setDownloadSuccess] =
    useState<string | null>(null);

  const handleDownload = (report: ReportItem) => {
    setDownloadSuccess(report.id);

    window.setTimeout(() => {
      setDownloadSuccess(null);
    }, 2500);
  };

  return (
    <div className="space-y-4 font-mono select-none">

      {/* ─────────────────────────────────────────
          HEADER
      ───────────────────────────────────────── */}

      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>

          <div>

            <div className="flex items-center gap-2 flex-wrap">

              <h2 className="text-base font-bold text-white tracking-wide">
                AERONEX ENGINEERING REPORTS
              </h2>

              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                REPORT REPOSITORY
              </span>

            </div>

            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Engineering summaries generated from the current Aeronex
              monitoring session
            </p>

          </div>

        </div>

        <div className="text-xs text-slate-400">

          AVAILABLE REPORTS:{' '}

          <span className="text-white font-bold">
            {AERONEX_REPORTS.length}
          </span>

        </div>

      </div>

      {/* ─────────────────────────────────────────
          REPORT GRID
      ───────────────────────────────────────── */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* REPORT LIST */}

        <div className="lg:col-span-2 space-y-3">

          {AERONEX_REPORTS.map(report => {

            const isSelected =
              activeReport?.id === report.id;

            return (
              <div
                key={report.id}
                onClick={() => setActiveReport(report)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f1b33] border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-[#0d1527] border-slate-800 hover:border-slate-700'
                }`}
              >

                {/* REPORT TITLE */}

                <div className="flex items-start justify-between gap-2 mb-2">

                  <div>

                    <span className="text-[10px] text-cyan-400 font-bold block">
                      {report.code}
                    </span>

                    <h3 className="text-sm font-bold text-white mt-0.5">
                      {report.title}
                    </h3>

                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    {report.status}
                  </span>

                </div>

                {/* SUMMARY */}

                <p className="text-xs font-sans text-slate-300 leading-relaxed mb-3">
                  {report.summary}
                </p>

                {/* REPORT META */}

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-2">

                  <div className="flex items-center gap-3 flex-wrap">

                    <span>
                      {report.date}
                    </span>

                    <span>•</span>

                    <span>
                      {report.pages} PAGE
                    </span>

                    <span>•</span>

                    <span>
                      {report.type}
                    </span>

                  </div>

                  {/* EXPORT BUTTON */}

                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation();
                      handleDownload(report);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs transition-colors"
                  >

                    {downloadSuccess === report.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />

                        <span className="text-emerald-300 text-[10px]">
                          READY
                        </span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-cyan-400" />

                        <span className="text-[10px]">
                          EXPORT
                        </span>
                      </>
                    )}

                  </button>

                </div>

              </div>
            );
          })}

        </div>

        {/* ─────────────────────────────────────────
            REPORT PREVIEW
        ───────────────────────────────────────── */}

        {activeReport && (

          <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">

            <div>

              {/* VIEWER HEADER */}

              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">

                <div className="flex items-center gap-2">

                  <FileCheck className="w-4 h-4 text-cyan-400" />

                  <h4 className="text-xs font-bold text-slate-200 uppercase">
                    REPORT PREVIEW
                  </h4>

                </div>

                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  GENERATED VIEW
                </span>

              </div>

              {/* DOCUMENT */}

              <div className="bg-[#080d16] border border-slate-800 rounded p-4 text-slate-300 space-y-3 shadow-inner">

                {/* DOCUMENT HEADER */}

                <div className="border-b border-slate-800 pb-2 text-[10px] text-slate-400 flex items-center justify-between">

                  <span>
                    AERONEX ENGINEERING REPORT
                  </span>

                  <span>
                    PAGE 1 OF {activeReport.pages}
                  </span>

                </div>

                {/* TITLE */}

                <div>

                  <h5 className="font-bold text-sm text-white">
                    {activeReport.title}
                  </h5>

                  <div className="text-[10px] text-cyan-400 mt-0.5">
                    {activeReport.code}
                  </div>

                </div>

                {/* REPORT DETAILS */}

                <div className="text-[11px] font-sans text-slate-400 space-y-1.5 leading-relaxed">

                  <p>
                    <strong className="text-slate-300">
                      Source:
                    </strong>{' '}
                    {activeReport.author}
                  </p>

                  <p>
                    <strong className="text-slate-300">
                      Session:
                    </strong>{' '}
                    {activeReport.date}
                  </p>

                  <p>
                    <strong className="text-slate-300">
                      Report type:
                    </strong>{' '}
                    {activeReport.type}
                  </p>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 mt-2">

                    {activeReport.summary}

                  </div>

                </div>

                {/* DATA STATUS */}

                <div className="pt-2 border-t border-slate-800 text-[10px] text-cyan-400 font-semibold flex items-center gap-1.5">

                  <ShieldCheck className="w-3.5 h-3.5" />

                  GENERATED FROM AERONEX MONITORING DATA

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between gap-2">

              <span className="flex items-center gap-1.5">

                <Clock className="w-3 h-3" />

                LIVE SESSION

              </span>

              <span className="text-slate-500 font-sans">
                ENGINEERING PROTOTYPE
              </span>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};
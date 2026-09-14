'use client';

import { useState } from 'react';

interface StatusInfo {
  label: string;
  bg: string;
  explainer?: string;
  sensitive_explainer?: string;
}

interface RegionCardProps {
  region: string;
  psi24h: number;
  pm251h: number;
  pm2524h: number;
  usaqi: number;
  psiStatus: StatusInfo;
  pm25Status: StatusInfo;
  usAqiStatus: StatusInfo;
}

export default function RegionCard({
  region,
  psi24h,
  pm251h,
  usaqi,
  psiStatus,
  pm25Status,
  usAqiStatus,
}: RegionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSensitiveExpanded, setIsSensitiveExpanded] = useState(false);

  return (
    <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors flex flex-col justify-between">
      <div>
        {/* Card Title */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="capitalize text-xl font-bold text-white">{region}</h2>
        </div>

        {/* Grouped Metrics Layout */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* NOW Group (Spans 2 columns) */}
          <div className="col-span-2 bg-indigo-950/20 border border-indigo-500/20 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider">
                NOW
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* 1-Hr PM2.5 Metric */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    1-Hr PM2.5
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                    {pm251h}
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium border ${pm25Status.bg}`}>
                    {pm25Status.label}
                  </span>
                </div>
              </div>

              {/* PM2.5 AQI Metric */}
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    PM2.5 AQI
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                    {usaqi}
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium border ${usAqiStatus.bg}`}>
                    {usAqiStatus.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 24-HR Group */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 tracking-wider">
                24HR
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                24-Hr PSI
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {psi24h}
              </div>
              <div className="mt-2">
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium border ${psiStatus.bg}`}>
                  {psiStatus.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Advice & Breakdown Section */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">

        {/* Accordion Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors pt-2 border-t border-slate-800/50 focus:outline-none"
        >
          <span>{isExpanded ? 'Hide Health Advice' : 'Health Advice for Everyone'}</span>
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Explainer Drawer */}
        {isExpanded && (
          <div className="pt-2 space-y-3 text-xs text-slate-300 border-t border-slate-800/40">
            {pm25Status.explainer && (
              <div>
                <span className="font-bold text-slate-200 block mb-0.5">1-Hr PM2.5 Advice:</span>
                <p className="leading-relaxed text-slate-400">{pm25Status.explainer}</p>
              </div>
            )}
            {usAqiStatus.explainer && (
              <div>
                <span className="font-bold text-slate-200 block mb-0.5">PM2.5 US AQI Advice:</span>
                <p className="leading-relaxed text-slate-400">{usAqiStatus.explainer}</p>
              </div>
            )}
            
            {psiStatus.explainer && (
              <div>
                <span className="font-bold text-slate-200 block mb-0.5">24-Hr PSI Advice:</span>
                <p className="leading-relaxed text-slate-400">{psiStatus.explainer}</p>
              </div>
            )}
          </div>
        )}

        {/* Accordion Toggle Button */}
        <button
          onClick={() => setIsSensitiveExpanded(!isSensitiveExpanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors pt-2 border-t border-slate-800/50 focus:outline-none"
        >
          <span>{isSensitiveExpanded ? 'Hide Health Advice' : 'Health Advice for Sensitive Groups'}</span>
          <svg
            className={`w-4 h-4 transform transition-transform duration-200 ${
              isSensitiveExpanded ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Explainer Drawer */}
        {isSensitiveExpanded && (
          <div className="pt-2 space-y-3 text-xs text-slate-300 border-t border-slate-800/40">
            {pm25Status.sensitive_explainer && (
              <div>
                <span className="font-bold text-slate-200 block mb-0.5">1-Hr PM2.5 Advice:</span>
                <p className="leading-relaxed text-slate-400">{pm25Status.sensitive_explainer}</p>
              </div>
            )}
            {usAqiStatus.sensitive_explainer && (
              <div>
                <span className="font-bold text-slate-200 block mb-0.5">PM2.5 US AQI Advice:</span>
                <p className="leading-relaxed text-slate-400">{usAqiStatus.sensitive_explainer}</p>
              </div>
            )}
            
            {psiStatus.sensitive_explainer && (
              <div>
                <span className="font-bold text-slate-200 block mb-0.5">24-Hr PSI Advice:</span>
                <p className="leading-relaxed text-slate-400">{psiStatus.sensitive_explainer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
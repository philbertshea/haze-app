import fs from 'fs';
import path from 'path';

interface RegionData {
  pm25SubIndex: number;
  calculatedOneHrPsi: number;
}

interface PsiData {
  lastUpdated: string;
  regions: Record<string, RegionData>;
}

// Helper to determine badge color based on PSI scale
function getPsiStatus(score: number) {
  if (score <= 50) return { label: 'Good', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  if (score <= 100) return { label: 'Moderate', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  if (score <= 200) return { label: 'Unhealthy', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  if (score <= 300) return { label: 'Very Unhealthy', bg: 'bg-red-500/10 text-red-400 border-red-500/20' };
  return { label: 'Hazardous', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
}

// Reads local data.json at build/render time
async function getPsiData(): Promise<PsiData | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (err) {
    console.error('Failed to read data.json:', err);
    return null;
  }
}

export default async function Page() {
  const data = await getPsiData();

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center max-w-md">
          <p className="text-rose-400 font-medium">No PSI Data Found</p>
          <p className="text-slate-400 text-sm mt-2">
            Ensure your Go script has executed and written to <code className="text-slate-200">public/data.json</code>.
          </p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(data.lastUpdated).toLocaleString('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Singapore Haze Tracker</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time PM2.5 & Sub-Index Breakdowns</p>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 self-start md:self-auto">
            Last Updated: <span className="text-slate-200 font-medium">{formattedDate}</span>
          </div>
        </header>

        {/* Region Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(data.regions).map(([region, readings]) => {
            const status = getPsiStatus(readings.calculatedOneHrPsi);
            return (
              <div
                key={region}
                className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="capitalize text-lg font-semibold text-white">{region}</h2>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status.bg}`}>
                    {status.label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-400">1-hr PSI (Calculated)</span>
                    <span className="text-2xl font-bold text-white">{readings.calculatedOneHrPsi}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-800/80">
                    <span className="text-xs text-slate-500">PM2.5 Sub-Index</span>
                    <span className="text-sm font-medium text-slate-300">{readings.pm25SubIndex}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
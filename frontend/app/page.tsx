import fs from 'fs';
import path from 'path';

interface Region {
  name: string;
  labelLocation: {
    latitude: number;
    longitude: number;
  };
}

interface PsiData {
  lastUpdated: string;
  fetchedAt: string;
  regions: Region[];
  readings: {
    pm25_sub_index: Record<string, number>;
    pm25_twenty_four_hourly: Record<string, number>;
    psi_twenty_four_hourly: Record<string, number>;
    [key: string]: Record<string, number>;
  };
}

// Helper to determine status badge based on 24-hr PSI score
function getPsiStatus(score: number) {
  if (score <= 50) return { label: 'Good', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  if (score <= 100) return { label: 'Moderate', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  if (score <= 200) return { label: 'Unhealthy', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  if (score <= 300) return { label: 'Very Unhealthy', bg: 'bg-red-500/10 text-red-400 border-red-500/20' };
  return { label: 'Hazardous', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
}

// Reads local public/data.json
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
          <p className="text-rose-400 font-medium">No Data Available</p>
          <p className="text-slate-400 text-sm mt-2">
            Could not read <code className="text-slate-200">public/data.json</code>.
          </p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(data.lastUpdated).toLocaleString('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Extract the list of region names (central, west, north, south, east)
  const regionNames = data.regions.map((r) => r.name);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Singapore Haze Tracker</h1>
            <p className="text-slate-400 text-sm mt-1">Real-time air quality metrics by region</p>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-xs text-slate-400 self-start md:self-auto">
            Last Updated: <span className="text-slate-200 font-medium">{formattedDate}</span>
          </div>
        </header>

        {/* Region Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {regionNames.map((region) => {
            const psi24h = data.readings.psi_twenty_four_hourly[region] ?? 0;
            const pm25Sub = data.readings.pm25_sub_index[region] ?? 0;
            const pm2524h = data.readings.pm25_twenty_four_hourly[region] ?? 0;
            const status = getPsiStatus(psi24h);

            return (
              <div
                key={region}
                className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Card Title & Status Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="capitalize text-xl font-bold text-white">{region}</h2>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium border ${status.bg}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Main Metric: 24-hr PSI */}
                  <div className="mb-6">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      24-Hr PSI
                    </span>
                    <div className="text-4xl font-extrabold text-white mt-1">{psi24h}</div>
                  </div>
                </div>

                {/* Sub-Metrics Breakdown */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">PM2.5 Sub-Index</span>
                    <span className="font-semibold text-slate-200">{pm25Sub}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">PM2.5 24-Hr (&mu;g/m&sup3;)</span>
                    <span className="font-semibold text-slate-200">{pm2524h}</span>
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
import fs from 'fs';
import path from 'path';
import RegionCard from '@/components/RegionCard';

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
    pm25_one_hourly: Record<string, number>;
    pm25_twenty_four_hourly: Record<string, number>;
    psi_twenty_four_hourly: Record<string, number>;
    [key: string]: Record<string, number>;
  };
  derivedReadings: {
    usaqi_from_pm25_one_hourly: Record<string, number>;
    [key: string]: Record<string, number>;
  };
}

// Helper to determine status badge based on 24-hr PSI score
function getPsiStatus(score: number) {
  if (score <= 50) return { label: 'Good', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', explainer: 'Air quality is considered satisfactory, and air pollution poses little or no risk.' };
  if (score <= 100) return { label: 'Moderate', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', explainer: 'Air quality is acceptable. Unusually sensitive individuals should consider limiting prolonged outdoor exertion.' };
  if (score <= 200) return { label: 'Unhealthy', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', explainer: 'Everyone may begin to experience health effects. Sensitive groups may experience more serious health effects.' };
  if (score <= 300) return { label: 'Very Unhealthy', bg: 'bg-red-500/10 text-red-400 border-red-500/20', explainer: 'Health alert: everyone may experience more serious health effects. Avoid outdoor activities.' };
  return { label: 'Hazardous', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', explainer: 'Health warning of emergency conditions. The entire population is more likely to be affected.' };
}

function getPm25Status(score: number) {
  if (score <= 55) return { label: 'Normal', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', explainer: '1-hour PM2.5 levels are in the normal band. Standard activities can continue.' };
  if (score <= 150) return { label: 'Elevated', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', explainer: '1-hour PM2.5 levels are elevated. Reduce strenuous outdoor exertion if you experience discomfort.' };
  if (score <= 250) return { label: 'High', bg: 'bg-red-500/10 text-red-400 border-red-500/20', explainer: '1-hour PM2.5 levels are high. Minimize outdoor activity.' };
  return { label: 'Very High', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', explainer: '1-hour PM2.5 levels are very high. Avoid all outdoor exertion.' };
}

function getUsAqiStatus(score: number) {
  if (score <= 50) return { label: 'Good', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', explainer: 'Air quality is good and poses little to no health risk.' };
  if (score <= 100) return { label: 'Moderate', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', explainer: 'Air quality is acceptable for most, but sensitive individuals should monitor symptoms.' };
  if (score <= 150) return { label: 'Unhealthy for Sensitive Groups', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', explainer: 'Members of sensitive groups may experience health effects. General public is less likely to be affected.' };
  if (score <= 200) return { label: 'Unhealthy', bg: 'bg-red-500/10 text-red-400 border-red-500/20', explainer: 'Some members of the general public may experience health effects; sensitive groups may experience serious effects.' };
  if (score <= 300) return { label: 'Very Unhealthy', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', explainer: 'Health alert: Risk of health effects is increased for everyone.' };
  return { label: 'Hazardous', bg: 'bg-stone-500/10 text-stone-400 border-stone-500/20', explainer: 'Health warning of emergency conditions: Everyone is more likely to be affected.' };
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
    timeZone: 'Asia/Singapore',
  });

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
            Readings from NEA as of: <span className="text-slate-200 font-medium">{formattedDate}</span>
          </div>
        </header>

        {/* Region Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {regionNames.map((region) => {
            const psi24h = data.readings.psi_twenty_four_hourly[region] ?? 0;
            const pm251h = data.readings.pm25_one_hourly[region] ?? 0;
            const pm2524h = data.readings.pm25_twenty_four_hourly[region] ?? 0;
            const usaqi = data.derivedReadings.usaqi_from_pm25_one_hourly[region] ?? 0;

            const psiStatus = getPsiStatus(psi24h);
            const pm25Status = getPm25Status(pm251h);
            const usAqiStatus = getUsAqiStatus(usaqi);

            return (
              <RegionCard
                key={region}
                region={region}
                psi24h={psi24h}
                pm251h={pm251h}
                pm2524h={pm2524h}
                usaqi={usaqi}
                psiStatus={psiStatus}
                pm25Status={pm25Status}
                usAqiStatus={usAqiStatus}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
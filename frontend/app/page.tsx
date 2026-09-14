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
  if (score <= 50) return { label: 'Good', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', explainer: 'CONTINUE with normal activities.', sensitive_explainer: 'CONTINUE with normal activities.' };
  if (score <= 100) return { label: 'Moderate', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', explainer: 'CONTINUE with normal activities.', sensitive_explainer: 'CONTINUE with normal activities.' };
  if (score <= 200) return { label: 'Unhealthy', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', explainer: 'REDUCE prolonged or strenuous outdoor physical exertion.', sensitive_explainer: 'Elderly, Pregnant and Children should MINIMISE prolonged or strenuous outdoor physical exertion. \nPeople with Chronic Lung or Heart Disease should AVOID prolonged or strenuous outdoor physical exertion.' };
  if (score <= 300) return { label: 'Very Unhealthy', bg: 'bg-red-500/10 text-red-400 border-red-500/20', explainer: 'AVOID prolonged or strenuous outdoor physical exertion.', sensitive_explainer: 'Elderly, Pregnant and Children should MINIMISE ALL outdoor activity. \nPeople with Chronic Lung or Heart Disease should AVOID ALL outdoor activity.' };
  return { label: 'Hazardous', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', explainer: 'MINIMISE ALL outdoor activity.', sensitive_explainer: 'AVOID ALL outdoor activity.' };
}

function getPm25Status(score: number) {
  if (score <= 55) return { label: 'Normal', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', explainer: 'CONTINUE with normal activities.', sensitive_explainer: 'CONTINUE with normal activities.' };
  if (score <= 150) return { label: 'Elevated', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', explainer: 'REDUCE strenuous outdoor activity for the next hour. ', sensitive_explainer: 'AVOID strenuous outdoor activity for the next hour.' };
  if (score <= 250) return { label: 'High', bg: 'bg-red-500/10 text-red-400 border-red-500/20', explainer: 'AVOID strenuous outdoor activity for the next hour. ', sensitive_explainer: 'AVOID ALL outdoor activity for the next hour.' };
  return { label: 'Very High', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', explainer: 'MINIMISE ALL outdoor activity for the next hour. ', sensitive_explainer: 'AVOID ALL outdoor activity for the next hour.' };
}

function getUsAqiStatus(score: number) {
  if (score <= 50) return { label: 'Good', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', explainer: 'It is a GREAT DAY to be outside.', sensitive_explainer: 'CONTINUE with normal activities.' };
  if (score <= 100) return { label: 'Moderate', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', explainer: 'It is a GOOD DAY to be outside.', sensitive_explainer: 'CONSIDER MAKING outdoor activities shorter and less intense. Watch for coughing and shortness of breath.'  };
  if (score <= 150) return { label: 'Unhealthy for Sensitive Groups', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', explainer: 'It is a GOOD DAY to be outside.', sensitive_explainer: 'MAKE outdoor activities shorter and less intense. TAKE more breaks. Watch for coughing and shortness of breath.' };
  if (score <= 200) return { label: 'Unhealthy', bg: 'bg-red-500/10 text-red-400 border-red-500/20', explainer: 'REDUCE long or intense outdoor activities. TAKE more breaks.', sensitive_explainer: 'AVOID long or intense outdoor activities. Consider rescheduling or moving activities indoors.'};
  if (score <= 300) return { label: 'Very Unhealthy', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', explainer: 'AVOID long or intense outdoor activities. Consider rescheduling or moving activities indoors.', sensitive_explainer: 'AVOID ALL physical outdoor activities. Reschedule or move activities indoors.' };
  return { label: 'Hazardous', bg: 'bg-stone-500/10 text-stone-400 border-stone-500/20', explainer: 'AVOID ALL physical outdoor activities.', sensitive_explainer: 'REMAIN INDOORS and keep activity levels low.' };
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
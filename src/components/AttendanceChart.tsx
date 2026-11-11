import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Layers, BarChart2, Calendar } from 'lucide-react';
import { AttendanceRecord } from '../types';
import { calculateDailyAttendanceTrend, DailyAttendanceCount } from '../utils/attendance';

interface Props {
  records: AttendanceRecord[];
  currentClass: string;
  selectedDate?: string;
}

export const AttendanceChart: React.FC<Props> = ({
  records,
  currentClass,
  selectedDate = new Date().toISOString().split('T')[0],
}) => {
  const [daysRange, setDaysRange] = useState<number>(7);
  const [isStacked, setIsStacked] = useState<boolean>(false);

  // Calculate daily data based on selected class and date
  const chartData: DailyAttendanceCount[] = useMemo(() => {
    return calculateDailyAttendanceTrend(
      records,
      currentClass === 'SEMUA' ? undefined : currentClass,
      selectedDate,
      daysRange
    );
  }, [records, currentClass, selectedDate, daysRange]);

  // Aggregate totals across the current range
  const rangeTotals = useMemo(() => {
    return chartData.reduce(
      (acc, item) => {
        acc.hadir += item.hadir;
        acc.terlambat += item.terlambat;
        acc.sakit += item.sakit;
        acc.izin += item.izin;
        acc.alpa += item.alpa;
        acc.total += item.total;
        return acc;
      },
      { hadir: 0, terlambat: 0, sakit: 0, izin: 0, alpa: 0, total: 0 }
    );
  }, [chartData]);

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-5 space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Grafik Tren Presensi Harian
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {currentClass === 'SEMUA' ? 'Semua Kelas' : `Kelas ${currentClass}`}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Perbandingan jumlah Hadir, Terlambat, Sakit, dan Izin per hari
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Stacked vs Grouped Toggle */}
          <button
            onClick={() => setIsStacked(!isStacked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-colors cursor-pointer ${
              isStacked
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="Ubah tampilan grafik bertumpuk atau bersebelahan"
          >
            {isStacked ? <Layers className="w-3.5 h-3.5 text-emerald-600" /> : <BarChart2 className="w-3.5 h-3.5" />}
            <span>{isStacked ? 'Grafik Bertumpuk' : 'Grafik Berkelompok'}</span>
          </button>

          {/* Days Range Selector */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
            <button
              onClick={() => setDaysRange(7)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                daysRange === 7
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDaysRange(14)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                daysRange === 14
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              14 Hari
            </button>
          </div>
        </div>
      </div>

      {/* Mini Stat Badges for Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Total Hadir
          </span>
          <span className="text-sm font-bold text-emerald-950 font-mono">
            {rangeTotals.hadir}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
          <span className="text-amber-800 font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Terlambat
          </span>
          <span className="text-sm font-bold text-amber-950 font-mono">
            {rangeTotals.terlambat}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
          <span className="text-blue-800 font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Sakit
          </span>
          <span className="text-sm font-bold text-blue-950 font-mono">
            {rangeTotals.sakit}
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
          <span className="text-purple-800 font-semibold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            Izin
          </span>
          <span className="text-sm font-bold text-purple-950 font-mono">
            {rangeTotals.izin}
          </span>
        </div>
      </div>

      {/* Recharts BarChart Visualization */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              dy={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-2xl p-3 shadow-xl border border-slate-800 space-y-1.5 min-w-[140px]">
                      <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{label}</span>
                      </div>
                      <div className="space-y-1 pt-0.5">
                        {payload.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              ></span>
                              {entry.name}:
                            </span>
                            <span className="font-mono font-bold">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="hadir"
              name="Hadir"
              fill="#10b981"
              stackId={isStacked ? 'a' : undefined}
              radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="terlambat"
              name="Terlambat"
              fill="#f59e0b"
              stackId={isStacked ? 'a' : undefined}
              radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="sakit"
              name="Sakit"
              fill="#3b82f6"
              stackId={isStacked ? 'a' : undefined}
              radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              dataKey="izin"
              name="Izin"
              fill="#a855f7"
              stackId={isStacked ? 'a' : undefined}
              radius={isStacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
              maxBarSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

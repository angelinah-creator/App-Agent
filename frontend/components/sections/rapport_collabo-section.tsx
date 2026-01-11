"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Download, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { addWeeks, addMonths, addYears, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { timerService } from "@/lib/timer-service";
import { usersService } from "@/lib/users-service";

const COLORS = ["#E9B44C", "#9B59B6", "#3498DB", "#E74C3C", "#1ABC9C", "#95A5A6"];

type PeriodType = "day" | "week" | "month" | "year" | "custom";

export function RapportCollaboSection() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [periodType, setPeriodType] = useState<PeriodType>("week");
  const [offset, setOffset] = useState(0);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  // Récupérer la liste des utilisateurs
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.searchUsers({ role: "collaborateur" }),
  });

  const { periodStart, periodEnd, displayText } = useMemo(() => {
    const now = new Date();

    if (periodType === "custom" && customStart && customEnd) {
      return {
        periodStart: customStart,
        periodEnd: customEnd,
        displayText: `${format(customStart, "dd MMM")} - ${format(customEnd, "dd MMM yyyy", { locale: fr })}`,
      };
    }

    switch (periodType) {
      case "day":
        const day = addWeeks(now, offset);
        return {
          periodStart: day,
          periodEnd: day,
          displayText: format(day, "dd MMM yyyy", { locale: fr }),
        };
      case "week":
        const weekStart = startOfWeek(addWeeks(now, offset), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        return {
          periodStart: weekStart,
          periodEnd: weekEnd,
          displayText: `${format(weekStart, "dd MMM", { locale: fr })} - ${format(weekEnd, "dd MMM yyyy", { locale: fr })} • W${format(weekStart, "w", { locale: fr })}`,
        };
      case "month":
        const month = addMonths(now, offset);
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        return {
          periodStart: monthStart,
          periodEnd: monthEnd,
          displayText: format(month, "MMMM yyyy", { locale: fr }),
        };
      case "year":
        const year = addYears(now, offset);
        const yearStart = startOfYear(year);
        const yearEnd = endOfYear(year);
        return {
          periodStart: yearStart,
          periodEnd: yearEnd,
          displayText: format(year, "yyyy", { locale: fr }),
        };
      default:
        return {
          periodStart: startOfWeek(now, { weekStartsOn: 1 }),
          periodEnd: endOfWeek(now, { weekStartsOn: 1 }),
          displayText: "Cette semaine",
        };
    }
  }, [periodType, offset, customStart, customEnd]);

  const { data: report, isLoading } = useQuery({
    queryKey: ["userReport", selectedUserId, periodStart, periodEnd],
    queryFn: () =>
      timerService.getReport({
        userId: selectedUserId,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      }),
    enabled: !!selectedUserId,
  });

  const dailyData = useMemo(() => {
    if (!report) return [];

    const days = eachDayOfInterval({ start: periodStart, end: periodEnd });

    return days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const dayData = report.byDay.find((d) => d.day === dayKey);

      return {
        day: format(day, "EEE", { locale: fr }),
        date: format(day, "dd/MM"),
        hours: dayData?.hours || 0,
        formattedTime: formatHours(dayData?.hours || 0),
      };
    });
  }, [report, periodStart, periodEnd]);

  function formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const s = Math.round(((hours - h) * 60 - m) * 60);
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function formatDuration(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h${m.toString().padStart(2, "0")}m`;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1F2128] border border-[#313442] rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">
            {payload[0].payload.day} {payload[0].payload.date}
          </p>
          <p className="text-purple-400 font-mono text-sm mt-1">{payload[0].payload.formattedTime}</p>
        </div>
      );
    }
    return null;
  };

  const selectedUser = users.find((u) => u._id === selectedUserId);

  return (
    <div className="space-y-6 p-6 bg-[#0F0F12] min-h-screen">
      {/* Sélecteur d'utilisateur en haut à gauche */}
      <div className="bg-[#1F2128] rounded-xl border border-[#313442] p-4">
        <div className="flex items-center gap-3">
          <Users className="text-purple-400" size={20} />
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 bg-[#0F0F12] text-white px-4 py-2 rounded-lg border border-[#313442] max-w-xs"
          >
            <option value="">Sélectionner un collaborateur</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.prenoms} {user.nom}
              </option>
            ))}
          </select>
          {selectedUser && (
            <span className="text-gray-400 text-sm">
              {selectedUser.email}
            </span>
          )}
        </div>
      </div>

      {!selectedUserId ? (
        <div className="bg-[#1F2128] rounded-xl border border-[#313442] p-12 text-center">
          <Users className="text-gray-600 mx-auto mb-4" size={48} />
          <p className="text-gray-400 text-lg">Sélectionnez un collaborateur pour voir ses rapports</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1F2128] rounded-xl border border-[#313442] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setOffset((o) => o - 1)} className="p-2 hover:bg-white/5 rounded-lg transition">
                  <ChevronLeft className="text-white" />
                </button>

                <div className="flex items-center gap-2 bg-[#0F0F12] px-4 py-2 rounded-lg">
                  <Calendar className="text-purple-400" size={18} />
                  <span className="text-white font-medium">{displayText}</span>
                </div>

                <button onClick={() => setOffset((o) => o + 1)} className="p-2 hover:bg-white/5 rounded-lg transition">
                  <ChevronRight className="text-white" />
                </button>

                <select
                  value={periodType}
                  onChange={(e) => {
                    setPeriodType(e.target.value as PeriodType);
                    setOffset(0);
                  }}
                  className="bg-[#0F0F12] text-white px-3 py-2 rounded-lg border border-[#313442]"
                >
                  <option value="day">Jour</option>
                  <option value="week">Semaine</option>
                  <option value="month">Mois</option>
                  <option value="year">Année</option>
                </select>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition text-white">
                <Download size={18} />
                <span className="text-sm">Exporter PDF</span>
              </button>
            </div>

            {isLoading ? (
              <div className="text-center text-white py-8">Chargement...</div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0F0F12] rounded-lg p-4 border border-[#313442]">
                  <p className="text-gray-400 text-sm mb-1">Heures totales</p>
                  <p className="text-white text-2xl font-bold font-mono">{formatHours(report?.totalHours || 0)}</p>
                </div>
                <div className="bg-[#0F0F12] rounded-lg p-4 border border-[#313442]">
                  <p className="text-gray-400 text-sm mb-1">Nombre d'entrées</p>
                  <p className="text-white text-2xl font-bold">{report?.entriesCount || 0}</p>
                </div>
                <div className="bg-[#0F0F12] rounded-lg p-4 border border-[#313442]">
                  <p className="text-gray-400 text-sm mb-1">Moyenne journalière</p>
                  <p className="text-white text-2xl font-bold">
                    {dailyData.length > 0 ? ((report?.totalHours || 0) / dailyData.length).toFixed(2) : "0.00"} h
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isLoading && report && (
            <>
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-[#1F2128] rounded-xl border border-[#313442] p-6">
                  <h3 className="text-white font-semibold text-lg mb-4">Durée par jour</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#313442" />
                      <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                      <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} tickFormatter={(value) => `${value}h`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139, 92, 246, 0.1)" }} />
                      <Bar dataKey="hours" fill="#9B59B6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="col-span-1 bg-[#1F2128] rounded-xl border border-[#313442] p-6">
                  <h3 className="text-white font-semibold text-lg mb-4">Distribution par description</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={report?.byDescription || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="hours"
                      >
                        {(report?.byDescription || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#1F2128] border border-[#313442] rounded-lg p-3 shadow-lg">
                                <p className="text-white font-medium text-sm">{payload[0].payload.description}</p>
                                <p className="text-purple-400 font-mono text-sm">{formatDuration(payload[0].value)}</p>
                                <p className="text-gray-400 text-xs">{payload[0].payload.percentage.toFixed(2)}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2 max-h-[150px] overflow-y-auto">
                    {(report?.byDescription || []).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-gray-300 truncate text-xs">{item.description}</span>
                        </div>
                        <span className="text-white font-medium text-xs">{item.percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#1F2128] rounded-xl border border-[#313442] p-6">
                <h3 className="text-white font-semibold text-lg mb-4">Détails par projet</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#313442]">
                      <th className="text-left text-gray-400 font-medium py-3 px-4 text-sm">PROJET</th>
                      <th className="text-right text-gray-400 font-medium py-3 px-4 text-sm">DURÉE</th>
                      <th className="text-right text-gray-400 font-medium py-3 px-4 text-sm">%</th>
                      <th className="text-right text-gray-400 font-medium py-3 px-4 text-sm">ENTRÉES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report?.byProject || []).map((project, index) => (
                      <tr key={index} className="border-b border-[#313442]/50 hover:bg-white/5">
                        <td className="py-3 px-4 text-white">{project.projectName}</td>
                        <td className="text-right py-3 px-4 text-white font-mono">{formatHours(project.hours)}</td>
                        <td className="text-right py-3 px-4 text-white">{project.percentage.toFixed(2)}%</td>
                        <td className="text-right py-3 px-4 text-white">{project.entriesCount}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[#313442] bg-[#0F0F12]">
                      <td className="py-3 px-4 text-white font-bold">TOTAL</td>
                      <td className="text-right py-3 px-4 text-white font-mono font-bold">
                        {formatHours(report?.totalHours || 0)}
                      </td>
                      <td className="text-right py-3 px-4 text-white font-bold">100%</td>
                      <td className="text-right py-3 px-4 text-white font-bold">{report?.entriesCount || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  Filter,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  addWeeks,
  addMonths,
  addYears,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { timerService, ReportData } from "@/lib/timer-service";
import { projectService } from "@/lib/project-service"; // ← AJOUT
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import domtoimage from "dom-to-image";

const COLORS = [
  "#1f77b4", // bleu
  "#ff7f0e", // orange
  "#2ca02c", // vert
  "#d62728", // rouge
  "#9467bd", // violet
  "#8c564b", // brun
  "#e377c2", // rose
  "#7f7f7f", // gris
  "#bcbd22", // jaune-vert
  "#17becf", // cyan
  "#aec7e8", // bleu clair
  "#ffbb78", // orange pâle
  "#98df8a", // vert clair
  "#ff9896", // rouge clair
  "#c5b0d5", // lavande
  "#c49c94", // beige
  "#f7b6d2", // rose clair
  "#c7c7c7", // gris clair
  "#dbdb8d", // jaune-vert pâle
  "#9edae5", // turquoise clair
  "#393b79", // bleu nuit
  "#637939", // vert olive
  "#8c6d31", // ocre
  "#843c39", // bordeaux
  "#7b4173", // prune
  "#a55194", // violet moyen
  "#ce6dbd", // orchidée
  "#de9ed6", // mauve
  "#3182bd", // bleu marine
  "#6baed6", // bleu ciel
  "#9ecae1", // bleu très clair
  "#c6dbef", // bleu glacier
  "#e6550d", // orange foncé
  "#fd8d3c", // corail
  "#fdae6b", // pêche
  "#fdd0a2", // crème
  "#31a354", // vert forêt
  "#74c476", // vert pomme
  "#a1d99b", // vert menthe
  "#c7e9c0", // vert très clair
];

type PeriodType = "day" | "week" | "month" | "year" | "custom";

function formatHours(hours: number): string {
  const absHours = Math.abs(hours);
  const h = Math.floor(absHours);
  const m = Math.floor((absHours - h) * 60);
  const s = Math.round(((absHours - h) * 60 - m) * 60);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(hours: number): string {
  const absHours = Math.abs(hours);
  const h = Math.floor(absHours);
  const m = Math.round((absHours - h) * 60);
  return `${h}h${m.toString().padStart(2, "0")}m`;
}

// ─── Composant ProjectFilter ───────────────────────────────────────────────────
function ProjectFilter({
  projects,
  selectedProjectIds,
  onChange,
}: {
  projects: { projectId: string | null; projectName: string }[];
  selectedProjectIds: Set<string>;
  onChange: (ids: Set<string>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allSelected = selectedProjectIds.size === 0;
  const activeCount = selectedProjectIds.size;

  const toggle = (id: string) => {
    const next = new Set(selectedProjectIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  };

  const clearAll = () => onChange(new Set());

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded border transition text-xs ${
          activeCount > 0
            ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
            : "bg-[#0F0F12] border-[#313442] text-gray-300 hover:text-white"
        }`}
      >
        <Filter size={12} />
        <span>
          {activeCount > 0
            ? `${activeCount} projet${activeCount > 1 ? "s" : ""}`
            : "Projets"}
        </span>
        {activeCount > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              clearAll();
            }}
            className="ml-0.5 hover:text-white cursor-pointer"
          >
            <X size={10} />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-[#1F2128] border border-[#313442] rounded-lg shadow-2xl z-50 min-w-[200px] overflow-hidden">
          <div className="p-1.5 border-b border-[#313442]">
            <button
              onClick={clearAll}
              className={`w-full text-left px-2 py-1.5 rounded text-xs transition ${
                allSelected
                  ? "bg-purple-500/20 text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Tous les projets
            </button>
          </div>
          <div className="p-1.5 max-h-60 overflow-y-auto space-y-0.5">
            {projects.map((project) => {
              const id = project.projectId ?? "no-project";
              const checked = selectedProjectIds.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition ${
                    checked
                      ? "bg-purple-500/20 text-white"
                      : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-sm border flex items-center justify-center flex-shrink-0 transition ${
                      checked
                        ? "bg-purple-500 border-purple-500"
                        : "border-[#5a5d70]"
                    }`}
                  >
                    {checked && (
                      <svg
                        viewBox="0 0 8 8"
                        fill="none"
                        className="w-2 h-2"
                      >
                        <path
                          d="M1 4l2 2 4-4"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{project.projectName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Composant PeriodSelector ──────────────────────────────────────────────────
function PeriodSelector({
  isOpen,
  onClose,
  onSelectPeriod,
  currentPeriodType,
  buttonRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectPeriod: (type: PeriodType, start?: Date, end?: Date) => void;
  currentPeriodType: PeriodType;
  buttonRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        if (customStart && customEnd) {
          onSelectPeriod("custom", customStart, customEnd);
        }
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, buttonRef, customStart, customEnd, onSelectPeriod]);

  if (!isOpen) return null;

  const shortcuts = [
    { label: "Aujourd'hui", value: "day" as PeriodType },
    { label: "Cette semaine", value: "week" as PeriodType },
    { label: "Ce mois", value: "month" as PeriodType },
    { label: "Cette année", value: "year" as PeriodType },
    { label: "Semaine dernière", value: "last_week" as PeriodType },
    { label: "Mois dernier", value: "last_month" as PeriodType },
  ];

  const handleShortcutClick = (value: string) => {
    const now = new Date();

    switch (value) {
      case "day":
        onSelectPeriod("day", now, now);
        break;
      case "week":
        onSelectPeriod("week");
        break;
      case "last_week":
        const lastWeekStart = startOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });
        const lastWeekEnd = endOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });
        onSelectPeriod("custom", lastWeekStart, lastWeekEnd);
        break;
      case "month":
        onSelectPeriod("month");
        break;
      case "last_month":
        const lastMonthStart = startOfMonth(addMonths(now, -1));
        const lastMonthEnd = endOfMonth(addMonths(now, -1));
        onSelectPeriod("custom", lastMonthStart, lastMonthEnd);
        break;
      case "year":
        onSelectPeriod("year");
        break;
    }
    onClose();
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weeks: Date[][] = [];

    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const handleDayClick = (day: Date) => {
      if (!customStart || (customStart && customEnd)) {
        setCustomStart(day);
        setCustomEnd(null);
      } else {
        if (day < customStart) {
          setCustomEnd(customStart);
          setCustomStart(day);
        } else {
          setCustomEnd(day);
        }
      }
    };

    const isInRange = (day: Date) => {
      if (!customStart) return false;
      if (!customEnd) return isSameDay(day, customStart);
      return isWithinInterval(day, { start: customStart, end: customEnd });
    };

    const isStart = (day: Date) => customStart && isSameDay(day, customStart);
    const isEnd = (day: Date) => customEnd && isSameDay(day, customEnd);

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            className="p-0.5 hover:bg-white/5 rounded transition"
          >
            <ChevronLeft size={14} className="text-white" />
          </button>
          <span className="text-white font-medium text-xs">
            {format(currentMonth, "MMM yyyy", { locale: fr })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-0.5 hover:bg-white/5 rounded transition"
          >
            <ChevronRight size={14} className="text-white" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1 px-1">
          {["L", "M", "M", "J", "V", "S", "D"].map((day, idx) => (
            <div key={idx} className="text-center text-[9px] text-gray-400 py-0.5">
              {day}
            </div>
          ))}
        </div>

        <div className="space-y-0.5 px-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-0.5">
              {week.map((day, dayIdx) => {
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const inRange = isInRange(day);
                const isStartDay = isStart(day);
                const isEndDay = isEnd(day);

                return (
                  <button
                    key={dayIdx}
                    onClick={() => handleDayClick(day)}
                    className={`
                      aspect-square flex items-center justify-center text-[10px] rounded transition
                      ${!isCurrentMonth ? "text-gray-600" : "text-white"}
                      ${inRange && !isStartDay && !isEndDay ? "bg-purple-500/30" : "hover:bg-white/5"}
                      ${isStartDay ? "bg-purple-600 text-white" : ""}
                      ${isEndDay ? "bg-purple-600 text-white" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {customStart && customEnd && (
          <div className="mt-2 px-1">
            <button
              onClick={() => {
                onSelectPeriod("custom", customStart, customEnd);
                onClose();
              }}
              className="w-full py-1 bg-purple-500 hover:bg-purple-600 rounded text-white text-[10px] font-medium transition"
            >
              {format(customStart, "dd MMM")} - {format(customEnd, "dd MMM")}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={popupRef}
      className="absolute left-0 top-full mt-1 bg-[#1F2128] border border-[#313442] rounded-lg shadow-2xl z-50 overflow-hidden"
      style={{ width: "400px" }}
    >
      <div className="flex" style={{ height: "280px" }}>
        <div className="w-40 border-r border-[#313442] p-2 overflow-y-auto">
          <div className="space-y-0.5">
            {shortcuts.map((shortcut) => (
              <button
                key={shortcut.value}
                onClick={() => handleShortcutClick(shortcut.value)}
                className={`w-full text-left px-2 py-1.5 rounded transition text-xs ${
                  shortcut.value === currentPeriodType
                    ? "bg-purple-500/20 text-white"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 p-2">{renderCalendar()}</div>
      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────
export function RapportSection() {
  const [periodType, setPeriodType] = useState<PeriodType>("week");
  const [offset, setOffset] = useState(0);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [isPeriodSelectorOpen, setIsPeriodSelectorOpen] = useState(false);
  const periodSelectorButtonRef = useRef<HTMLDivElement>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Refs pour les graphiques (export PDF)
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  // ── Filtre projet ──────────────────────────────────────────────────────────
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const { periodStart, periodEnd, displayText } = useMemo(() => {
    const now = new Date();

    if (periodType === "custom" && customStart && customEnd) {
      return {
        periodStart: customStart,
        periodEnd: customEnd,
        displayText: `${format(customStart, "dd MMM")} - ${format(customEnd, "dd MMM")}`,
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
          displayText: `${format(weekStart, "dd MMM")} - ${format(weekEnd, "dd MMM")} • W${format(weekStart, "w")}`,
        };
      case "month":
        const month = addMonths(now, offset);
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        return {
          periodStart: monthStart,
          periodEnd: monthEnd,
          displayText: format(month, "MMM yyyy", { locale: fr }),
        };
      case "year":
        const year = addYears(now, offset);
        const yearStart = startOfYear(year);
        const yearEnd = endOfYear(year);
        return {
          periodStart: yearStart,
          periodEnd: yearEnd,
          displayText: format(year, "yyyy"),
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
    queryKey: ["report", periodStart, periodEnd],
    queryFn: () =>
      timerService.getReport({
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      }),
    refetchInterval: 1000,
  });

  // ── Récupération des projets accessibles à l'utilisateur ────────────────────
  const { data: userProjects = [] } = useQuery({
    queryKey: ["myProjects"],
    queryFn: () => projectService.getAll(),
  });

  // ── Liste de projets disponibles pour le filtre (tous les projets de l'utilisateur) ──
  const projectOptions = useMemo(() => {
    return userProjects.map((p) => ({
      projectId: p._id,
      projectName: p.name,
    }));
  }, [userProjects]);

  // ── Données filtrées par projet sélectionné ────────────────────────────────
  const filteredReport = useMemo(() => {
    if (!report || selectedProjectIds.size === 0) return report;

    const filteredEntries = report.entries.filter((e) => {
      const id = e.projectId ?? "no-project";
      return selectedProjectIds.has(id);
    });

    const filteredByProject = report.byProject.filter((p) => {
      const id = p.projectId ?? "no-project";
      return selectedProjectIds.has(id);
    });

    const totalSeconds = filteredEntries.reduce(
      (sum, e) => sum + (e.duration || 0),
      0,
    );

    const totalHours = totalSeconds / 3600;
    const byProjectRecalc = filteredByProject.map((p) => ({
      ...p,
      percentage: totalHours > 0 ? (p.hours / totalHours) * 100 : 0,
    }));

    return {
      ...report,
      entries: filteredEntries,
      byProject: byProjectRecalc,
      totalHours,
      entriesCount: filteredEntries.length,
    };
  }, [report, selectedProjectIds]);

  const dailyData = useMemo(() => {
    if (!filteredReport || !filteredReport.entries) return [];

    const days = eachDayOfInterval({ start: periodStart, end: periodEnd });

    return days.map((day) => {
      const dayKey = format(day, "yyyy-MM-dd");
      const dayEntries = filteredReport.entries.filter((entry) => {
        const entryDate = format(new Date(entry.startTime), "yyyy-MM-dd");
        return entryDate === dayKey;
      });

      const totalSeconds = dayEntries.reduce(
        (sum, entry) => sum + (entry.duration || 0),
        0,
      );
      const hours = totalSeconds / 3600;

      return {
        day: format(day, "EEE", { locale: fr }),
        date: format(day, "dd/MM"),
        hours,
        formattedTime: formatHours(hours),
      };
    });
  }, [filteredReport, periodStart, periodEnd]);

  const taskData = useMemo(() => {
    if (!filteredReport || !filteredReport.entries) return [];

    const taskMap = new Map<string, { title: string; duration: number }>();

    filteredReport.entries.forEach((entry) => {
      const taskTitle = entry.taskTitle || "Sans tâche";
      const current = taskMap.get(taskTitle) || { title: taskTitle, duration: 0 };
      current.duration += entry.duration || 0;
      taskMap.set(taskTitle, current);
    });

    const totalDuration = Array.from(taskMap.values()).reduce(
      (sum, t) => sum + t.duration,
      0,
    );

    return Array.from(taskMap.values()).map((task) => ({
      name: task.title,
      value: task.duration / 3600,
      percentage: totalDuration > 0 ? (task.duration / totalDuration) * 100 : 0,
    }));
  }, [filteredReport]);

  const handleSelectPeriod = (type: PeriodType, start?: Date, end?: Date) => {
    setPeriodType(type);
    setOffset(0);
    if (type === "custom" && start && end) {
      setCustomStart(start);
      setCustomEnd(end);
    }
    setIsPeriodSelectorOpen(false);
  };

  const weekTotalHours = useMemo(() => {
    return dailyData.reduce((sum, day) => sum + day.hours, 0);
  }, [dailyData]);

  const averageDailyHours = useMemo(() => {
    const daysWithData = dailyData.filter((d) => d.hours > 0).length;
    return daysWithData > 0 ? weekTotalHours / daysWithData : 0;
  }, [dailyData, weekTotalHours]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1F2128] border border-[#313442] rounded p-2 shadow">
          <p className="text-white text-xs font-medium">
            {payload[0].payload.day} {payload[0].payload.date}
          </p>
          <p className="text-purple-400 font-mono text-xs mt-0.5">
            {payload[0].payload.formattedTime}
          </p>
        </div>
      );
    }
    return null;
  };

  // ─── Fonction d'export PDF (adaptée de rapport_collabo-section) ─────────────
  const handleExportPDF = async () => {
    if (!filteredReport) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    /* ================= HEADER ================= */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Rapport d'activité global", 14, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(displayText, 14, y + 6);

    doc.setDrawColor(230);
    doc.line(14, y + 10, pageWidth - 14, y + 10);
    y += 18;

    /* ================= SUMMARY CARDS ================= */
    const cardWidth = (pageWidth - 40) / 2;

    const drawCard = (x: number, label: string, value: string) => {
      doc.setDrawColor(235);
      doc.roundedRect(x, y, cardWidth, 18, 3, 3);

      doc.setFontSize(9);
      doc.setTextColor(130);
      doc.text(label, x + 4, y + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30);
      doc.text(value, x + 4, y + 13);

      doc.setFont("helvetica", "normal");
    };

    drawCard(14, "Heures totales", formatHours(filteredReport.totalHours));
    drawCard(20 + cardWidth, "Moyenne/jour", formatHours(averageDailyHours));

    y += 28;

    /* ================= CAPTURE CHARTS ================= */
    let barChartImg = null;
    let pieChartImg = null;

    if (barChartRef.current) {
      barChartImg = await domtoimage.toPng(barChartRef.current, {
        scale: 2,
      } as any);
    }

    if (pieChartRef.current) {
      pieChartImg = await domtoimage.toPng(pieChartRef.current, {
        scale: 2,
      } as any);
    }

    /* ================= BAR CHART ================= */
    if (barChartImg) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Durée par jour", 14, y);

      y += 4;
      doc.addImage(barChartImg, "PNG", 14, y, 180, 70);
      y += 80;
    }

    /* ================= PIE CENTERED + LEGEND ================= */
    if (pieChartImg && taskData.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Répartition par tâche", pageWidth / 2, y, { align: "center" });

      y += 6;

      // Charger l'image pour obtenir le ratio
      const img = new Image();
      img.src = pieChartImg;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const ratio = img.height / img.width;
      const pieWidth = 110;
      const pieHeight = pieWidth * ratio;
      const pieX = (pageWidth - pieWidth) / 2;
      const pieY = y;

      doc.addImage(pieChartImg, "PNG", pieX, pieY, pieWidth, pieHeight);
      y += pieHeight + 10;

      /* ---------- LÉGENDE SOUS LE CAMEMBERT ---------- */
      const legendLeft = 30;
      const lineHeight = 6;
      const squareSize = 3.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      taskData.forEach((task, index) => {
        const color = COLORS[index % COLORS.length];
        const r = parseInt(color.substring(1, 3), 16);
        const g = parseInt(color.substring(3, 5), 16);
        const b = parseInt(color.substring(5, 7), 16);

        doc.setFillColor(r, g, b);
        doc.rect(legendLeft, y - 3, squareSize, squareSize, "F");

        doc.setTextColor(40);
        doc.text(task.name, legendLeft + 6, y);

        const rightText = `${task.percentage.toFixed(1)}%   ${formatDuration(task.value)}`;
        doc.setTextColor(120);
        doc.text(rightText, pageWidth - 30, y, { align: "right" });

        y += lineHeight;
      });

      y += 8;
    }

    /* ================= DETAIL TABLE ================= */
    doc.setFontSize(13);
    doc.text("Détail par projet", 14, y);
    y += 5;

    const rows = filteredReport.entries.map((entry) => {
      const project =
        filteredReport.byProject.find((p) => p.projectId === entry.projectId)
          ?.projectName || "Sans projet";

      return [
        project,
        entry.taskTitle || "Sans tâche",
        formatHours(entry.duration / 3600),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Projet", "Tâche", "Durée"]],
      body: rows,
      theme: "striped",
      styles: {
        fontSize: 9,
        lineColor: [240, 240, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [155, 89, 182],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
    });

    /* ================= FOOTER ================= */
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Généré automatiquement • Rapport de temps", 14, pageHeight - 10);
    doc.text(`Page 1`, pageWidth - 20, pageHeight - 10);

    doc.save(`rapport_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-[#0F0F12] -mt-8">
      {/* EN-TÊTE */}
      <div className="bg-[#1F2128] rounded-lg border border-[#313442] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setOffset((o) => o - 1)}
              className="p-1 hover:bg-white/5 rounded transition"
            >
              <ChevronLeft className="text-white" size={16} />
            </button>

            <div
              ref={periodSelectorButtonRef}
              onClick={() => setIsPeriodSelectorOpen(!isPeriodSelectorOpen)}
              className="flex items-center gap-1 bg-[#0F0F12] px-3 py-1 rounded cursor-pointer hover:bg-[#1a1a1f] transition"
            >
              <Calendar className="text-purple-400" size={14} />
              <span className="text-white text-xs font-medium">{displayText}</span>
            </div>

            <PeriodSelector
              isOpen={isPeriodSelectorOpen}
              onClose={() => setIsPeriodSelectorOpen(false)}
              onSelectPeriod={handleSelectPeriod}
              currentPeriodType={periodType}
              buttonRef={periodSelectorButtonRef}
            />

            <button
              onClick={() => setOffset((o) => o + 1)}
              className="p-1 hover:bg-white/5 rounded transition"
            >
              <ChevronRight className="text-white" size={16} />
            </button>

            <select
              value={periodType}
              onChange={(e) => {
                setPeriodType(e.target.value as PeriodType);
                setOffset(0);
              }}
              className="bg-[#0F0F12] text-white px-2 py-1 rounded border border-[#313442] text-xs"
            >
              <option value="day">Jour</option>
              <option value="week">Semaine</option>
              <option value="month">Mois</option>
              <option value="year">Année</option>
            </select>
          </div>

          {/* DROITE : filtre projet + export */}
          <div className="flex items-center gap-2">
            <ProjectFilter
              projects={projectOptions} // ← REMPLACÉ
              selectedProjectIds={selectedProjectIds}
              onChange={setSelectedProjectIds}
            />

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 px-3 py-1 bg-purple-500 hover:bg-purple-600 rounded transition text-white"
            >
              <Download size={14} />
              <span className="text-xs">Export PDF</span>
            </button>
          </div>
        </div>

        {/* STATISTIQUES PRINCIPALES */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0F0F12] rounded p-3 border border-[#313442]">
            <p className="text-gray-400 text-xs mb-0.5">Heures totales</p>
            <p className="text-white text-xl font-bold font-mono">
              {formatHours(filteredReport?.totalHours || 0)}
            </p>
          </div>
          <div className="bg-[#0F0F12] rounded p-3 border border-[#313442]">
            <p className="text-gray-400 text-xs mb-0.5">Moyenne/jour</p>
            <p className="text-white text-xl font-bold font-mono">
              {formatHours(averageDailyHours)}
            </p>
          </div>
        </div>
      </div>

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-3 gap-4">
        {/* GRAPHIQUE EN BARRES */}
        <div className="col-span-2 bg-[#1F2128] rounded-lg border border-[#313442] p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Durée par jour</h3>
          <div ref={barChartRef}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#313442" />
                <XAxis
                  dataKey="day"
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                />
                <Bar dataKey="hours" fill="#9B59B6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPHIQUE CIRCULAIRE */}
        <div className="col-span-1 bg-[#1F2128] rounded-lg border border-[#313442] p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Temps par tâche</h3>
          <div ref={pieChartRef}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={taskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {taskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#1F2128] border border-[#313442] rounded p-2 shadow">
                          <p className="text-white text-xs font-medium">
                            {payload[0].payload.name}
                          </p>
                          <p className="text-purple-400 font-mono text-xs">
                            {formatDuration(payload[0].value)}
                          </p>
                          <p className="text-gray-400 text-[10px]">
                            {payload[0].payload.percentage.toFixed(1)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1 max-h-[100px] overflow-y-auto">
            {taskData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 flex-1">
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-300 truncate text-[10px]">{item.name}</span>
                </div>
                <span className="text-white font-medium text-[10px]">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLEAU DÉTAILLÉ */}
      <div className="bg-[#1F2128] rounded-lg border border-[#313442] p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Détails par projet</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#313442]">
              <th className="text-left text-gray-400 font-medium py-2 px-3 text-xs">
                PROJET | TÂCHE
              </th>
              <th className="text-right text-gray-400 font-medium py-2 px-3 text-xs">
                DURÉE
              </th>
              <th className="text-right text-gray-400 font-medium py-2 px-3 text-xs">
                %
              </th>
              <th className="text-right text-gray-400 font-medium py-2 px-3 text-xs">
                ENTRÉES
              </th>
            </tr>
          </thead>
          <tbody>
            {(filteredReport?.byProject || []).map((project, projectIndex) => {
              const isExpanded = expandedProjects.has(project.projectId || "no-project");
              const projectEntries = (filteredReport?.entries || []).filter(
                (e) => (e.projectId || null) === project.projectId,
              );

              return (
                <React.Fragment key={project.projectId || `no-project-${projectIndex}`}>
                  <tr
                    className="border-b border-[#313442]/50 hover:bg-white/5 cursor-pointer"
                    onClick={() => toggleProject(project.projectId || "no-project")}
                  >
                    <td className="py-2 px-3 text-white flex items-center gap-1">
                      <ChevronRight
                        size={12}
                        className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                      <span className="text-xs font-medium">{project.projectName}</span>
                      <span className="text-gray-400 text-[10px]">
                        ({project.entriesCount})
                      </span>
                    </td>
                    <td className="text-right py-2 px-3 text-white font-mono text-xs">
                      {formatHours(project.hours)}
                    </td>
                    <td className="text-right py-2 px-3 text-white text-xs">
                      {project.percentage.toFixed(1)}%
                    </td>
                    <td className="text-right py-2 px-3 text-white text-xs">
                      {project.entriesCount}
                    </td>
                  </tr>

                  {isExpanded &&
                    projectEntries.map((entry, idx) => (
                      <tr
                        key={`${project.projectId}-entry-${idx}`}
                        className="border-b border-[#313442]/30 bg-[#0F0F12]/50"
                      >
                        <td className="py-1 px-3 pl-8 text-gray-300 text-xs">
                          <div>
                            {entry.taskTitle || entry.description || "Sans tâche"}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {format(new Date(entry.startTime), "dd MMM • HH:mm", {
                              locale: fr,
                            })}
                          </div>
                        </td>
                        <td className="text-right py-1 px-3 text-gray-300 font-mono text-xs">
                          {formatHours(entry.duration / 3600)}
                        </td>
                        <td className="text-right py-1 px-3 text-gray-300 text-xs">
                          {((entry.duration / 3600 / project.hours) * 100).toFixed(1)}%
                        </td>
                        <td className="text-right py-1 px-3 text-gray-300 text-xs">
                          1
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
            <tr className="border-t border-[#313442] bg-[#0F0F12]">
              <td className="py-2 px-3 text-white font-bold text-xs">TOTAL</td>
              <td className="text-right py-2 px-3 text-white font-mono font-bold text-xs">
                {formatHours(filteredReport?.totalHours || 0)}
              </td>
              <td className="text-right py-2 px-3 text-white font-bold text-xs">
                100%
              </td>
              <td className="text-right py-2 px-3 text-white font-bold text-xs">
                {filteredReport?.entriesCount || 0}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
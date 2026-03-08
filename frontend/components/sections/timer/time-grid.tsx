// frontend/components/sections/timer/time-grid.tsx
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const PIXELS_PER_HOUR = 48;

interface TimeGridProps {
  onCellClick: (dayIndex: number, hour: number) => void;
  pixelsPerHour: number;
  editableCutoff: Date; // Date limite pour les modifications
  weekStart: Date; // Début de la semaine affichée
}

export function TimeGrid({ onCellClick, pixelsPerHour, editableCutoff, weekStart }: TimeGridProps) {
  const handleCellClick = (e: React.MouseEvent, dayIndex: number, hour: number) => {
    // Calculer la date exacte du clic
    const cellDate = new Date(weekStart);
    cellDate.setDate(cellDate.getDate() + dayIndex);
    cellDate.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
    cellDate.setHours(0, 0, 0, 0); // Normaliser à minuit pour comparer les jours

    if (cellDate < editableCutoff) {
      alert("Impossible de créer une entrée sur une date de plus de 7 jours");
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const minuteFraction = clickY / pixelsPerHour;
    const exactHour = hour + minuteFraction;
    onCellClick(dayIndex, exactHour);
  };

  return (
    <>
      {HOURS.map((hour) => (
        <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] h-12 border-b border-[#313442]">
          <div className="text-[10px] text-gray-400 px-1">{hour.toString().padStart(2, '0')}:00</div>
          {DAYS.map((_, dayIndex) => (
            <div
              key={dayIndex}
              className="border-l border-[#313442] hover:bg-white/5 cursor-pointer transition"
              onClick={(e) => handleCellClick(e, dayIndex, hour)}
            />
          ))}
        </div>
      ))}
    </>
  );
}
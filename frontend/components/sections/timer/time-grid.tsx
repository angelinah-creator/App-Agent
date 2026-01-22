export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
export const PIXELS_PER_HOUR = 64;

interface TimeGridProps {
  onCellClick: (dayIndex: number, hour: number) => void;
  pixelsPerHour: number;
}

export function TimeGrid({ onCellClick, pixelsPerHour }: TimeGridProps) {
  const handleCellClick = (e: React.MouseEvent, dayIndex: number, hour: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const minuteFraction = clickY / pixelsPerHour;
    const exactHour = hour + minuteFraction;
    
    onCellClick(dayIndex, exactHour);
  };

  return (
    <>
      {HOURS.map((hour) => (
        <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] h-16 border-b border-[#313442]">
          <div className="text-xs text-gray-400 px-2">{hour.toString().padStart(2, '0')}:00</div>
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
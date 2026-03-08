// frontend/components/sections/timer/task-block.tsx
import { useTaskDrag } from '@/hooks/use-task-drag';

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}m`;
}

interface TaskBlockProps {
  entry: any;
  dayIndex: number;
  startHour: number;
  durationHours: number;
  pixelsPerHour: number;
  isActive: boolean;
  onClick: () => void;
  onUpdate: (startHour: number, durationHours: number) => void;
  editableCutoff: Date; // Date limite pour les modifications
}

export function TaskBlock({
  entry,
  dayIndex,
  startHour,
  durationHours,
  pixelsPerHour,
  isActive,
  onClick,
  onUpdate,
  editableCutoff,
}: TaskBlockProps) {
  const entryDate = new Date(entry.startTime);
  entryDate.setHours(0, 0, 0, 0);
  const isEditable = entryDate >= editableCutoff && !isActive;

  // N'utiliser le hook de drag que si modifiable
  const { taskRef, handleMouseDown, isDragging, isResizing, wasJustDragging } = 
    useTaskDrag(isEditable ? onUpdate : () => {}, pixelsPerHour);

  const handleBlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wasJustDragging || !isEditable) return;
    onClick();
  };

  return (
    <div
      ref={taskRef}
      onClick={handleBlockClick}
      className={`absolute text-white rounded px-1 py-0.5 text-[10px] transition-all select-none ${
        isActive
          ? 'bg-[#6C4EA8] cursor-default'
          : isEditable
            ? 'bg-[#6C4EA8] cursor-move hover:bg-purple-700'
            : 'bg-gray-600 cursor-not-allowed opacity-60'
      } ${isDragging || isResizing ? 'opacity-90 z-50 shadow scale-[1.02]' : 'z-10'}`}
      style={{
        left: `calc(60px + ${dayIndex} * (100% - 60px) / 7)`,
        top: startHour * pixelsPerHour,
        height: Math.max(durationHours * pixelsPerHour, 16),
        width: `calc((100% - 60px) / 7 - 6px)`,
        userSelect: 'none',
      }}
    >
      {/* Resize handles top - seulement si modifiable */}
      {isEditable && !isActive && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-white/40 active:bg-white/60 transition-colors rounded-t"
          onMouseDown={(e) => handleMouseDown(e, 'resize-top', startHour, durationHours)}
        />
      )}

      {/* Contenu */}
      <div 
        className="font-medium truncate h-full flex flex-col justify-start"
        onMouseDown={(e) => isEditable && !isActive && handleMouseDown(e, 'drag', startHour, durationHours)}
      >
        <div className="truncate text-[9px]">{entry.taskTitle || 'Sans tâche'}</div>
        {entry.projectName && (
          <div className="text-[8px] opacity-80 truncate">{entry.projectName}</div>
        )}
        <div className="text-[8px] mt-0.5 font-mono">{formatDuration(entry.duration)}</div>
      </div>

      {/* Resize handles bottom - seulement si modifiable */}
      {isEditable && !isActive && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-white/40 active:bg-white/60 transition-colors rounded-b"
          onMouseDown={(e) => handleMouseDown(e, 'resize-bottom', startHour, durationHours)}
        />
      )}

      {/* Overlay si non modifiable (optionnel) */}
      {!isEditable && (
        <div className="absolute inset-0 bg-black/30 rounded pointer-events-none" title="Entrée trop ancienne pour modification" />
      )}
    </div>
  );
}
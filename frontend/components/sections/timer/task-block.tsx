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
}: TaskBlockProps) {
  const { taskRef, handleMouseDown, isDragging, isResizing, wasJustDragging } = useTaskDrag(onUpdate, pixelsPerHour);

  const handleBlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (wasJustDragging) {
      return;
    }
    
    if (!isDragging && !isResizing) {
      onClick();
    }
  };

  return (
    <div
      ref={taskRef}
      onClick={handleBlockClick}
      className={`absolute text-white rounded px-1 py-0.5 text-[10px] transition-all select-none ${
        isActive ? 'bg-[#6C4EA8] cursor-default' : 'bg-[#6C4EA8] cursor-move hover:bg-purple-700'
      } ${isDragging || isResizing ? 'opacity-90 z-50 shadow scale-[1.02]' : 'z-10'}`}
      style={{
        left: `calc(60px + ${dayIndex} * (100% - 60px) / 7)`,
        top: startHour * pixelsPerHour,
        height: Math.max(durationHours * pixelsPerHour, 16),
        width: `calc((100% - 60px) / 7 - 6px)`,
        userSelect: 'none',
      }}
    >
      {/* Resize handle top */}
      {!isActive && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-white/40 active:bg-white/60 transition-colors rounded-t"
          onMouseDown={(e) => handleMouseDown(e, 'resize-top', startHour, durationHours)}
        />
      )}

      {/* Contenu */}
      <div 
        className="font-medium truncate h-full flex flex-col justify-start"
        onMouseDown={(e) => !isActive && handleMouseDown(e, 'drag', startHour, durationHours)}
      >
        <div className="truncate text-[9px]">{entry.taskTitle || 'Sans tâche'}</div>
        {entry.projectName && (
          <div className="text-[8px] opacity-80 truncate">{entry.projectName}</div>
        )}
        <div className="text-[8px] mt-0.5 font-mono">{formatDuration(entry.duration)}</div>
      </div>

      {/* Resize handle bottom */}
      {!isActive && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-white/40 active:bg-white/60 transition-colors rounded-b"
          onMouseDown={(e) => handleMouseDown(e, 'resize-bottom', startHour, durationHours)}
        />
      )}
    </div>
  );
}
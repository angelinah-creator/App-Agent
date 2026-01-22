// frontend/components/sections/timer/task-block.tsx
import { useTaskDrag } from '@/hooks/use-task-drag';

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // ✅ Gérer le click - seulement si ce n'est PAS un drag/resize
  const handleBlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // ✅ NE PAS ouvrir le popup si on vient de drag/resize
    if (wasJustDragging) {
      console.log('🚫 Click ignoré après drag/resize');
      return;
    }
    
    if (!isDragging && !isResizing) {
      console.log('✅ Click valide - ouverture popup');
      onClick();
    }
  };

  return (
    <div
      ref={taskRef}
      onClick={handleBlockClick}
      className={`absolute text-white rounded-md px-2 py-1 text-xs transition-all select-none ${
        isActive ? 'bg-purple-500 cursor-default' : 'bg-purple-600 cursor-move hover:bg-purple-700'
      } ${isDragging || isResizing ? 'opacity-90 z-50 shadow-lg scale-[1.02]' : 'z-10'}`}
      style={{
        left: `calc(80px + ${dayIndex} * (100% - 80px) / 7)`,
        top: startHour * pixelsPerHour,
        height: Math.max(durationHours * pixelsPerHour, 20),
        width: `calc((100% - 80px) / 7 - 8px)`,
        userSelect: 'none',
      }}
    >
      {/* Resize handle top */}
      {!isActive && (
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/40 active:bg-white/60 transition-colors rounded-t-md"
          onMouseDown={(e) => handleMouseDown(e, 'resize-top', startHour, durationHours)}
        />
      )}

      {/* Contenu */}
      <div 
        className="font-medium truncate text-[11px] h-full flex flex-col justify-start"
        onMouseDown={(e) => !isActive && handleMouseDown(e, 'drag', startHour, durationHours)}
      >
        <div className="truncate">{entry.taskTitle || 'Sans tâche'}</div>
        {entry.projectName && <div className="text-[9px] opacity-80 truncate">{entry.projectName}</div>}
        <div className="text-[9px] mt-1 font-mono">{formatDuration(entry.duration)}</div>
      </div>

      {/* Resize handle bottom */}
      {!isActive && (
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-white/40 active:bg-white/60 transition-colors rounded-b-md"
          onMouseDown={(e) => handleMouseDown(e, 'resize-bottom', startHour, durationHours)}
        />
      )}
    </div>
  );
}
import { useState, useCallback, useRef, useEffect } from 'react';

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeDirection: 'top' | 'bottom' | null;
  startY: number;
  startHour: number;
  startDuration: number;
}

export function useTaskDrag(
  onUpdate: (startHour: number, durationHours: number) => void,
  pixelsPerHour: number
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeDirection: null,
    startY: 0,
    startHour: 0,
    startDuration: 0,
  });

  const [clickStartY, setClickStartY] = useState(0);
  const taskRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  
  // ✅ AJOUT: Flag pour détecter si on vient de drag/resize
  const wasJustDraggingRef = useRef(false);
  const [wasJustDragging, setWasJustDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: 'drag' | 'resize-top' | 'resize-bottom', currentStartHour: number, currentDuration: number) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Stocker la position initiale pour détecter un clic simple
      setClickStartY(e.clientY);
      
      setDragState({
        isDragging: type === 'drag',
        isResizing: type !== 'drag',
        resizeDirection: type === 'resize-top' ? 'top' : type === 'resize-bottom' ? 'bottom' : null,
        startY: e.clientY,
        startHour: currentStartHour,
        startDuration: currentDuration,
      });
      
      isDraggingRef.current = false;
      // ✅ Réinitialiser le flag
      wasJustDraggingRef.current = false;
      setWasJustDragging(false);
    },
    []
  );

  useEffect(() => {
    if (!dragState.isDragging && !dragState.isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Utiliser requestAnimationFrame pour des mises à jour fluides
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        const deltaY = e.clientY - dragState.startY;
        
        // Marquer comme drag après seulement 2px (plus sensible)
        if (Math.abs(deltaY) > 2) {
          isDraggingRef.current = true;
          // ✅ Marquer qu'on a vraiment dragué
          wasJustDraggingRef.current = true;
        }

        const deltaHours = deltaY / pixelsPerHour;

        if (dragState.isDragging) {
          // Déplacement simple
          const newStartHour = Math.max(0, Math.min(24 - dragState.startDuration, dragState.startHour + deltaHours));
          onUpdate(newStartHour, dragState.startDuration);
        } else if (dragState.isResizing) {
          if (dragState.resizeDirection === 'bottom') {
            // Resize bas : modifier la durée
            const newDuration = Math.max(0.25, dragState.startDuration + deltaHours); // min 15min
            onUpdate(dragState.startHour, newDuration);
          } else if (dragState.resizeDirection === 'top') {
            // Resize haut : modifier début + durée
            const newStartHour = Math.max(0, dragState.startHour + deltaHours);
            const newDuration = Math.max(0.25, dragState.startDuration - deltaHours);
            onUpdate(newStartHour, newDuration);
          }
        }
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Nettoyer l'animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // ✅ Détecter si c'était vraiment un drag
      const deltaY = Math.abs(e.clientY - clickStartY);
      const wasDragAction = deltaY > 2;
      
      console.log(`🖱️ MouseUp - Delta: ${deltaY}px, wasDragAction: ${wasDragAction}`);
      
      // ✅ Mettre à jour le state
      if (wasDragAction) {
        setWasJustDragging(true);
        wasJustDraggingRef.current = true;
        
        // ✅ Réinitialiser après un court délai (100ms)
        setTimeout(() => {
          setWasJustDragging(false);
          wasJustDraggingRef.current = false;
          console.log('✅ Flag wasJustDragging réinitialisé');
        }, 100);
      }
      
      setDragState({
        isDragging: false,
        isResizing: false,
        resizeDirection: null,
        startY: 0,
        startHour: 0,
        startDuration: 0,
      });
      
      // Réinitialiser
      isDraggingRef.current = false;
      setClickStartY(0);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, pixelsPerHour, onUpdate, clickStartY]);

  return {
    taskRef,
    handleMouseDown,
    isDragging: dragState.isDragging,
    isResizing: dragState.isResizing,
    wasJustDragging, // ✅ Exposer le flag
  };
}
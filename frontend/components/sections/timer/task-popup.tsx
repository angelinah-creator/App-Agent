// frontend/components/sections/timer/task-popup.tsx
import { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { TimeEntry } from '@/lib/timer-service';

interface TaskPopupProps {
  isOpen: boolean;
  onClose: () => void;
  entry: Partial<TimeEntry> | null;
  projects: any[];
  personalTasks: any[];
  sharedTasks: any[];
  onSave: (data: Partial<TimeEntry>) => void;
  onDelete?: () => void;
  mode: 'create' | 'edit';
  isEditable?: boolean; // seulement pour 'edit' (true par défaut)
}

export function TaskPopup({
  isOpen,
  onClose,
  entry,
  projects,
  personalTasks,
  sharedTasks,
  onSave,
  onDelete,
  mode,
  isEditable = true,
}: TaskPopupProps) {
  const [formData, setFormData] = useState<Partial<TimeEntry>>({});
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('00:00:00');
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);
  const taskSelectorRef = useRef<HTMLDivElement>(null);

  const extractId = (value: any): string | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value._id) return value._id;
    return undefined;
  };

  useEffect(() => {
    if (!isTaskSelectorOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (taskSelectorRef.current && !taskSelectorRef.current.contains(event.target as Node)) {
        setIsTaskSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTaskSelectorOpen]);

  useEffect(() => {
    if (entry) {
      setFormData(entry);
      
      if (entry.startTime) {
        const start = new Date(entry.startTime);
        setStartTime(start.toTimeString().slice(0, 5));
        
        if (entry.endTime) {
          const end = new Date(entry.endTime);
          setEndTime(end.toTimeString().slice(0, 5));
          
          const durationMs = end.getTime() - start.getTime();
          const hours = Math.floor(durationMs / 3600000);
          const minutes = Math.floor((durationMs % 3600000) / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          setDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else if (entry.duration) {
          const hours = Math.floor(entry.duration / 3600);
          const minutes = Math.floor((entry.duration % 3600) / 60);
          const seconds = entry.duration % 60;
          setDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          
          const endDate = new Date(start.getTime() + entry.duration * 1000);
          setEndTime(endDate.toTimeString().slice(0, 5));
        }
      }
    }
  }, [entry]);

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '00:00:00';
    
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  const handleStartChange = (value: string) => {
    setStartTime(value);
    const newDuration = calculateDuration(value, endTime);
    setDuration(newDuration);
    
    if (entry?.startTime) {
      const date = new Date(entry.startTime);
      const [hours, minutes] = value.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      
      const [dH, dM] = newDuration.split(':').map(Number);
      const newEndTime = new Date(date.getTime() + (dH * 3600 + dM * 60) * 1000);
      
      setFormData({ 
        ...formData, 
        startTime: date.toISOString(),
        endTime: newEndTime.toISOString(),
        duration: dH * 3600 + dM * 60
      });
    }
  };

  const handleEndChange = (value: string) => {
    setEndTime(value);
    const newDuration = calculateDuration(startTime, value);
    setDuration(newDuration);
    
    if (entry?.startTime) {
      const startDate = new Date(entry.startTime);
      const [hours, minutes] = value.split(':').map(Number);
      const endDate = new Date(startDate);
      endDate.setHours(hours, minutes, 0, 0);
      
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
      }
      
      const durationSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
      
      setFormData({ 
        ...formData, 
        endTime: endDate.toISOString(),
        duration: durationSeconds
      });
    }
  };

  const handleSelectTask = (taskId: string, taskType: 'personal' | 'shared') => {
    if (taskType === 'personal') {
      setFormData({ 
        ...formData, 
        personalTaskId: taskId,
        sharedTaskId: undefined 
      });
    } else {
      setFormData({ 
        ...formData, 
        sharedTaskId: taskId,
        personalTaskId: undefined 
      });
    }
    setIsTaskSelectorOpen(false);
  };

  const getSelectedTaskName = () => {
    const personalId = extractId(formData.personalTaskId);
    const sharedId = extractId(formData.sharedTaskId);

    if (personalId) {
      const task = personalTasks.find((t: any) => t._id === personalId);
      return task?.title || 'Tâche supprimée';
    }
    if (sharedId) {
      const task = sharedTasks.find((t: any) => t._id === sharedId);
      return task?.title || 'Tâche supprimée';
    }
    return 'Sélectionner une tâche';
  };

  const getSelectedProjectName = () => {
    const projectId = extractId(formData.projectId);
    if (!projectId) return '';
    
    const project = projects.find((p: any) => p._id === projectId);
    return project?.name || '';
  };

  const handleSave = () => {
    const cleanData: any = {
      startTime: formData.startTime,
      endTime: formData.endTime,
      duration: formData.duration,
    };

    const personalId = extractId(formData.personalTaskId);
    const sharedId = extractId(formData.sharedTaskId);
    const projectId = extractId(formData.projectId);

    if (personalId) cleanData.personalTaskId = personalId;
    if (sharedId) cleanData.sharedTaskId = sharedId;
    if (projectId) cleanData.projectId = projectId;
    
    onSave(cleanData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1F2128] rounded-lg p-4 w-full max-w-[400px] max-h-[90vh] overflow-y-auto border border-[#313442] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-base font-semibold">
            {mode === 'create' ? 'Nouvelle entrée' : 'Modifier l\'entrée'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Sélecteur de tâche */}
          <div className="relative" ref={taskSelectorRef}>
            <label className="text-gray-400 text-[10px] font-medium mb-0.5 block">Tâche</label>
            <button
              type="button"
              onClick={() => setIsTaskSelectorOpen(!isTaskSelectorOpen)}
              className="w-full bg-[#0F0F12] text-white px-2 py-1.5 rounded text-xs text-left flex items-center justify-between hover:bg-[#1a1a1f] transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={mode === 'edit' && !isEditable}
            >
              <span className={formData.personalTaskId || formData.sharedTaskId ? 'text-white' : 'text-gray-500'}>
                {getSelectedTaskName()}
              </span>
              <ChevronDown size={14} className={`transition-transform ${isTaskSelectorOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTaskSelectorOpen && (
              <div className="absolute top-full left-0 right-0 mt-0.5 bg-[#1F2128] border border-[#313442] rounded shadow-2xl z-50 max-h-56 overflow-y-auto">
                <div className="p-1">
                  {personalTasks.length > 0 && (
                    <>
                      <div className="text-gray-400 text-[10px] px-2 py-1 font-semibold">TÂCHES PERSONNELLES</div>
                      {personalTasks.map((task: any) => {
                        const currentId = extractId(formData.personalTaskId);
                        const isSelected = currentId === task._id;
                        
                        return (
                          <button
                            key={task._id}
                            type="button"
                            onClick={() => handleSelectTask(task._id, 'personal')}
                            className={`w-full text-left px-2 py-1 rounded hover:bg-white/5 text-white text-xs ${
                              isSelected ? 'bg-purple-500/20' : ''
                            }`}
                          >
                            {task.title}
                          </button>
                        );
                      })}
                    </>
                  )}
                  
                  {sharedTasks.length > 0 && (
                    <>
                      <div className="text-gray-400 text-[10px] px-2 py-1 font-semibold mt-1">TÂCHES PARTAGÉES</div>
                      {sharedTasks.map((task: any) => {
                        const currentId = extractId(formData.sharedTaskId);
                        const isSelected = currentId === task._id;
                        
                        return (
                          <button
                            key={task._id}
                            type="button"
                            onClick={() => handleSelectTask(task._id, 'shared')}
                            className={`w-full text-left px-2 py-1 rounded hover:bg-white/5 text-white text-xs ${
                              isSelected ? 'bg-purple-500/20' : ''
                            }`}
                          >
                            {task.title}
                          </button>
                        );
                      })}
                    </>
                  )}
                  
                  {personalTasks.length === 0 && sharedTasks.length === 0 && (
                    <div className="px-2 py-3 text-center text-gray-400 text-xs">
                      Aucune tâche en cours
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Projet */}
          <div>
            <label className="text-gray-400 text-[10px] font-medium mb-0.5 block">Projet (optionnel)</label>
            <select
              value={extractId(formData.projectId) || ''}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value || undefined })}
              className="w-full bg-[#0F0F12] text-white px-2 py-1.5 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={mode === 'edit' && !isEditable}
            >
              <option value="">Sans projet</option>
              {projects.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Horaires */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="text-gray-400 text-[10px] font-medium mb-0.5 block">Début</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full bg-[#0F0F12] text-white px-2 py-1.5 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={mode === 'edit' && !isEditable}
              />
            </div>

            <div>
              <label className="text-gray-400 text-[10px] font-medium mb-0.5 block">Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndChange(e.target.value)}
                className="w-full bg-[#0F0F12] text-white px-2 py-1.5 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={mode === 'edit' && !isEditable}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-gray-400 text-[10px] font-medium mb-0.5 block">Durée</label>
              <input
                type="text"
                value={duration}
                disabled
                className="w-full bg-[#0F0F12] text-gray-400 px-2 py-1.5 rounded text-xs font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4">
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={!isEditable}
                className="w-full sm:w-auto px-3 py-1.5 bg-red-600/20 text-red-500 rounded hover:bg-red-600 hover:text-white transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-1.5 bg-[#313442] text-gray-300 rounded hover:bg-[#3d4150] transition-colors text-xs font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={mode === 'edit' && !isEditable}
              className="flex-1 px-3 py-1.5 bg-[#6C4EA8] text-white rounded hover:bg-purple-600 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === 'create' ? 'Créer' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
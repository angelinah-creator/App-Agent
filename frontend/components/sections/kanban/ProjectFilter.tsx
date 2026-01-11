"use client";

import { Briefcase } from "lucide-react";
import { Project } from "@/lib/project-service";

interface ProjectFilterProps {
  projects: Project[];
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
}

export default function ProjectFilter({
  projects,
  selectedProject,
  onProjectChange,
}: ProjectFilterProps) {
  return (
    <div className="relative">
      <select
        value={selectedProject}
        onChange={(e) => onProjectChange(e.target.value)}
        className="appearance-none pl-10 pr-8 py-2 bg-[#2a2a2d] border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer"
      >
        <option value="all">Tous les projets</option>
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>
      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
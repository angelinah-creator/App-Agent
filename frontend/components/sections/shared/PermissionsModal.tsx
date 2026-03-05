"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  UserCheck,
  Eye,
  Edit2,
  Trash2,
  UserPlus,
  ChevronDown,
  Crown,
  Shield,
} from "lucide-react";
import { Space } from "@/lib/space-service";
import { spaceService } from "@/lib/space-service";
import { usersService, Agent } from "@/lib/users-service";

interface SpacePermissionsModalProps {
  space: Space;
  onClose: () => void;
}

export default function SpacePermissionsModal({
  space,
  onClose,
}: SpacePermissionsModalProps) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [users, setUsers] = useState<Agent[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState("viewer");
  const [loading, setLoading] = useState(true);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPermDropdownOpen, setIsPermDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const permDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [space._id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (permDropdownRef.current && !permDropdownRef.current.contains(event.target as Node)) {
        setIsPermDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [permsData, usersData] = await Promise.all([
        spaceService.getPermissions(space._id),
        usersService.searchUsers({}),
      ]);
      setPermissions(permsData);
      setUsers(
        usersData.filter(
          (user) =>
            !permsData.some(
              (perm) => perm.userId && perm.userId._id && perm.userId._id === user._id,
            ),
        ),
      );
    } catch (error) {
      console.error("Erreur chargement permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedUserId) return;
    try {
      await spaceService.inviteUser(space._id, selectedUserId, selectedPermission);
      loadData();
      setSelectedUserId("");
    } catch (error) {
      console.error("Erreur invitation:", error);
    }
  };

  const handleUpdatePermission = async (userId: string, permissionLevel: string) => {
    try {
      await spaceService.updatePermission(space._id, userId, permissionLevel);
      loadData();
    } catch (error) {
      console.error("Erreur mise à jour permission:", error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Retirer cet utilisateur de l'espace ?")) return;
    try {
      await spaceService.removeUser(space._id, userId);
      loadData();
    } catch (error) {
      console.error("Erreur retrait utilisateur:", error);
    }
  };

  const renderAvatar = (user: any, sizeClass: string = "w-8 h-8", textClass: string = "text-xs") => {
    if (!user) return null;
    if (user.profilePhoto?.url) {
      return (
        <img
          src={user.profilePhoto.url}
          alt={`${user.prenoms} ${user.nom}`}
          className={`${sizeClass} rounded-full object-cover border border-gray-700`}
        />
      );
    }
    return (
      <div className={`${sizeClass} bg-purple-600 rounded-full flex items-center justify-center border border-gray-700`}>
        <span className={`font-semibold text-white ${textClass}`}>
          {user.prenoms?.charAt(0)?.toUpperCase() || "?"}
          {user.nom?.charAt(0)?.toUpperCase() || ""}
        </span>
      </div>
    );
  };

  const selectedUser = users.find((u) => u._id === selectedUserId);

  const permissionLabels: Record<string, string> = {
    viewer: "Visionneur",
    editor: "Éditeur",
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2">
      <div className="bg-[#1a1a1d] rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl p-3">

        {/* En-tête */}
        <div className="p-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div>
              <span className="text-lg font-extrabold">Gestion des permissions</span>
              <span className="ml-2 text-xs text-gray-500">{space.name}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">

          {/* Inviter un utilisateur */}
          <div className="bg-[#0F0F12] rounded-[6px] p-3 space-y-2">
            <label className="text-sm font-medium text-white flex items-center gap-1.5">
              <UserPlus size={18} className="text-[#6C4EA8]" />
              Inviter un utilisateur
            </label>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Dropdown utilisateur */}
              <div className="relative flex-1" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-[#1a1a1d] rounded-[6px] px-2.5 py-1.5 focus:outline-none text-left flex items-center justify-between text-xs min-h-[32px]"
                >
                  {selectedUser ? (
                    <div className="flex items-center gap-2">
                      {renderAvatar(selectedUser, "w-5 h-5", "text-[10px]")}
                      <span className="truncate text-xs">
                        {selectedUser.prenoms} {selectedUser.nom}
                        <span className="text-gray-500 ml-1">({selectedUser.email})</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs">Sélectionner un utilisateur...</span>
                  )}
                  <ChevronDown
                    size={12}
                    className={`text-white ml-2 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-[100] bg-[#0F0F12] border border-[#313442] rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-full top-full left-0 mt-1">
                    {users.length === 0 ? (
                      <div className="px-2.5 py-2 text-gray-500 text-xs text-center">
                        Aucun utilisateur disponible
                      </div>
                    ) : (
                      users.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => { setSelectedUserId(user._id); setIsDropdownOpen(false); }}
                          className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#3a3a3d] cursor-pointer transition-colors"
                        >
                          {renderAvatar(user, "w-6 h-6", "text-[10px]")}
                          <div>
                            <div className="text-xs font-medium">{user.prenoms} {user.nom}</div>
                            <div className="text-[10px] text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Dropdown permission */}
              <div className="relative" ref={permDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPermDropdownOpen(!isPermDropdownOpen)}
                  className="bg-[#1a1a1d] rounded-[6px] px-2.5 py-1.5 focus:outline-none text-left flex items-center justify-between text-xs gap-2 min-w-[110px] min-h-[32px]"
                >
                  <span className="capitalize">{permissionLabels[selectedPermission]}</span>
                  <ChevronDown
                    size={12}
                    className={`text-white transition-transform ${isPermDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isPermDropdownOpen && (
                  <div className="absolute z-[100] bg-[#0F0F12] border border-[#313442] rounded-lg shadow-xl min-w-full top-full left-0 mt-1">
                    {["viewer", "editor"].map((perm) => (
                      <button
                        key={perm}
                        type="button"
                        className="w-full px-2.5 py-1.5 text-left hover:bg-[#3a3a3d] text-xs capitalize"
                        onClick={() => { setSelectedPermission(perm); setIsPermDropdownOpen(false); }}
                      >
                        {permissionLabels[perm]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleInvite}
                disabled={!selectedUserId}
                className="px-2.5 py-1.5 bg-[#6C4EA8] hover:bg-[#443365] text-white rounded-sm text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus size={12} />
                <span className="hidden sm:inline">Inviter</span>
              </button>
            </div>
          </div>

          {/* Liste des utilisateurs */}
          <div>
            <label className="text-sm font-medium text-white flex items-center gap-1.5 mb-2">
              <UserCheck size={18} className="text-[#6C4EA8]" />
              Utilisateurs ayant accés
            </label>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <div className="w-6 h-6 border-2 border-[#6C4EA8] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-xs">Chargement...</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {permissions.map((perm) => {
                  if (!perm.userId) return null;
                  const isCreator = perm.userId._id === space.createdBy?._id;

                  return (
                    <div
                      key={perm._id}
                      className="flex items-center justify-between px-2.5 py-2 bg-[#0F0F12] rounded-[6px]"
                    >
                      <div className="flex items-center gap-2">
                        {renderAvatar(perm.userId, "w-9 h-9", "text-[10px]")}
                        <div>
                          <div className="text-xs font-medium flex items-center gap-1.5">
                            {perm.userId.prenoms || ""} {perm.userId.nom || ""}
                            {isCreator && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-[#6C4EA8]/20 text-[#a07de0] text-[10px] rounded">
                                <Crown size={9} /> Créateur
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500">{perm.userId.email || ""}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={perm.permissionLevel}
                          onChange={(e) => handleUpdatePermission(perm.userId._id, e.target.value)}
                          className="bg-[#1a1a1d] rounded-[6px] px-2 py-1 text-xs focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed appearance-none cursor-pointer"
                          disabled={isCreator}
                        >
                          <option value="viewer">Visionneur</option>
                          <option value="editor">Éditeur</option>
                        </select>

                        {!isCreator && (
                          <button
                            onClick={() => handleRemoveUser(perm.userId._id)}
                            className="p-1.5 hover:bg-red-500/10 text-red-500/60 hover:text-red-400 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Légende */}
          <div className="pt-3 border-t border-gray-800">
            <label className="text-xs font-medium text-white mb-2 block">Niveaux de permission</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-[#0F0F12] px-2.5 py-2 rounded-[6px] flex items-start gap-2">
                <Eye size={13} className="text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-white">Visionneur</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Peut voir les tâches, sans modification</div>
                </div>
              </div>
              <div className="bg-[#0F0F12] px-2.5 py-2 rounded-[6px] flex items-start gap-2">
                <Edit2 size={13} className="text-gray-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium text-white">Éditeur</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Créer, modifier et supprimer des tâches</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
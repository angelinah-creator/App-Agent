"use client";

import { useState, useEffect } from "react";
import { X, User, UserCheck, Eye, Edit2, Crown, Trash2, UserPlus } from "lucide-react";
import { Space } from "@/lib/space-service";
import { spaceService } from "@/lib/space-service";
import { usersService } from "@/lib/users-service";

interface SpacePermissionsModalProps {
  space: Space;
  onClose: () => void;
}

export default function SpacePermissionsModal({
  space,
  onClose,
}: SpacePermissionsModalProps) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [space._id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [permsData, usersData] = await Promise.all([
        spaceService.getPermissions(space._id),
        usersService.searchUsers({})
      ]);
      setPermissions(permsData);
      setUsers(usersData.filter(user => 
        !permsData.some(perm => perm.userId._id === user._id)
      ));
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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1d] rounded-xl w-full max-w-3xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Gestion des permissions</h3>
            <p className="text-sm text-gray-400">{space.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Inviter un nouvel utilisateur */}
          <div className="bg-[#2a2a2d] rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <UserPlus size={18} /> Inviter un utilisateur
            </h4>
            <div className="flex gap-3">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="">Sélectionner un utilisateur</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.prenoms} {user.nom} ({user.email})
                  </option>
                ))}
              </select>
              <select
                value={selectedPermission}
                onChange={(e) => setSelectedPermission(e.target.value)}
                className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="viewer">Visionneur</option>
                <option value="editor">Éditeur</option>
                <option value="super_editor">Super Éditeur</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={!selectedUserId}
                className="bg-[#6C4EA8] hover:bg-[#5a3d8c] text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Inviter
              </button>
            </div>
          </div>

          {/* Liste des utilisateurs avec permissions */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <UserCheck size={18} /> Utilisateurs ayant accès ({permissions.length})
            </h4>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-400">Chargement...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map(perm => (
                  <div
                    key={perm._id}
                    className="flex items-center justify-between p-3 bg-[#2a2a2d] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="font-semibold">
                          {perm.userId.prenoms?.charAt(0)}{perm.userId.nom?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">
                          {perm.userId.prenoms} {perm.userId.nom}
                          {perm.userId._id === space.createdBy._id && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                              Créateur
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">{perm.userId.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={perm.permissionLevel}
                        onChange={(e) => handleUpdatePermission(perm.userId._id, e.target.value)}
                        className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-purple-500"
                        disabled={perm.userId._id === space.createdBy._id}
                      >
                        <option value="viewer">Visionneur</option>
                        <option value="editor">Éditeur</option>
                        <option value="super_editor">Super Éditeur</option>
                      </select>

                      {perm.userId._id !== space.createdBy._id && (
                        <button
                          onClick={() => handleRemoveUser(perm.userId._id)}
                          className="p-2 hover:bg-red-900/30 text-red-400 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Légende des permissions */}
          <div className="pt-4 border-t border-gray-800">
            <h4 className="font-medium mb-3">Niveaux de permission</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/30 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye size={16} className="text-gray-400" />
                  <span className="font-medium">Visionneur</span>
                </div>
                <p className="text-sm text-gray-400">
                  Peut voir les tâches mais ne peut pas les modifier
                </p>
              </div>
              <div className="bg-blue-800/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Edit2 size={16} className="text-blue-400" />
                  <span className="font-medium">Éditeur</span>
                </div>
                <p className="text-sm text-gray-400">
                  Peut créer, modifier et supprimer des tâches
                </p>
              </div>
              <div className="bg-purple-800/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={16} className="text-purple-400" />
                  <span className="font-medium">Super Éditeur</span>
                </div>
                <p className="text-sm text-gray-400">
                  Peut gérer les permissions et les paramètres de l'espace
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
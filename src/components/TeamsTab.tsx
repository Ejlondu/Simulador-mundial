/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Team } from '../types';
import { Search, ListFilter, ArrowUpDown, ShieldAlert, Star, ShieldCheck, Zap } from 'lucide-react';

interface TeamsTabProps {
  teams: Team[];
}

type SortField = 'name' | 'group' | 'fifaRanking' | 'elo' | 'offenseRating' | 'defenseRating' | 'overallPower';
type SortDirection = 'asc' | 'desc';

export default function TeamsTab({ teams }: TeamsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedConfederation, setSelectedConfederation] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('overallPower');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Helper to categorize team dynamically
  const getCategory = (team: Team): { label: string; bg: string; text: string; icon: any } => {
    if (team.overallPower >= 90) {
      return { label: 'Favorito al Título', bg: 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400', text: 'text-emerald-400', icon: Star };
    } else if (team.overallPower >= 82) {
      return { label: 'Contendiente Fuerte', bg: 'bg-indigo-950/40 border-indigo-900/30 text-indigo-400', text: 'text-indigo-400', icon: Zap };
    } else if (team.overallPower >= 73) {
      return { label: 'Aspirante Sólido', bg: 'bg-blue-950/40 border-blue-900/30 text-blue-400', text: 'text-blue-400', icon: ShieldCheck };
    } else if (team.overallPower >= 64) {
      return { label: 'Posible Sorpresa', bg: 'bg-amber-950/40 border-amber-900/30 text-amber-400', text: 'text-amber-400', icon: Star };
    } else {
      return { label: 'Bajo Coeficiente', bg: 'bg-slate-900/60 border-slate-800 text-slate-400', text: 'text-slate-400', icon: ShieldAlert };
    }
  };

  const uniqueConfederations = useMemo(() => {
    const list = teams.map((t) => t.confederation);
    return ['ALL', ...Array.from(new Set(list))];
  }, [teams]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredTeams = useMemo(() => {
    return teams
      .filter((t) => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
        const matchesConfederation = selectedConfederation === 'ALL' || t.confederation === selectedConfederation;

        const cat = getCategory(t).label;
        const matchesCategory = selectedCategory === 'ALL' || cat === selectedCategory;

        return matchesSearch && matchesConfederation && matchesCategory;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [teams, search, selectedConfederation, selectedCategory, sortField, sortDir]);

  return (
    <div className="space-y-6" id="teams-tab">
      {/* Filtering Header Panel */}
      <div className="bg-[#0E121B] rounded-xl p-5 border border-slate-800 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Buscar selección o código de país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121620] text-xs rounded-lg border border-slate-800 pl-9 pr-3 py-2.5 text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
            />
          </div>

          {/* Confederation Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 tracking-wider">Confederación</label>
            <select
              value={selectedConfederation}
              onChange={(e) => setSelectedConfederation(e.target.value)}
              className="w-full bg-[#121620] rounded-lg border border-slate-800 p-2 text-xs font-semibold text-slate-200 outline-none font-sans"
            >
              {uniqueConfederations.map((conf) => (
                <option key={conf} value={conf}>
                  {conf === 'ALL' ? 'Todas las Confederaciones' : conf}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 tracking-wider">Categoría Potencial</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#121620] rounded-lg border border-slate-800 p-2 text-xs font-semibold text-slate-200 outline-none font-sans"
            >
              <option value="ALL">Todas las Categorías</option>
              <option value="Favorito al Título font-sans">Favorito al Título</option>
              <option value="Contendiente Fuerte font-sans">Contendiente Fuerte</option>
              <option value="Aspirante Sólido font-sans">Aspirante Sólido</option>
              <option value="Posible Sorpresa font-sans">Posible Sorpresa</option>
              <option value="Bajo Coeficiente font-sans">Bajo Coeficiente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Database Sheet Table */}
      <div className="bg-[#0E121B] rounded-xl border border-slate-800 overflow-hidden font-sans" id="teams-database-container">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-sans">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                <th className="py-3.5 px-4 cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Selección</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-800/40" onClick={() => handleSort('group')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>Grupo</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-850 hover:bg-slate-800/40" onClick={() => handleSort('fifaRanking')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>Ranking FIFA</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-850 hover:bg-slate-800/40" onClick={() => handleSort('elo')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>Elo Rating</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-850 hover:bg-slate-800/40" onClick={() => handleSort('offenseRating')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>Ataque</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-850 hover:bg-slate-800/40" onClick={() => handleSort('defenseRating')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>Defensa</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-850 hover:bg-slate-800/40" onClick={() => handleSort('overallPower')}>
                  <div className="flex items-center justify-center space-x-1">
                    <span>Potencia Global</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Categoría Competitiva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs text-slate-350">
              {filteredTeams.map((team) => {
                const cat = getCategory(team);
                const IconComp = cat.icon;

                return (
                  <tr key={team.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div className="flex items-center space-x-2.5">
                        <span className="bg-[#121620] text-slate-400 font-mono text-[10px] w-8 h-5.5 rounded flex items-center justify-center font-bold border border-slate-800">
                          {team.id}
                        </span>
                        <span className="font-sans">{team.name}</span>
                        <span className="text-[9px] text-slate-500 font-normal">({team.confederation})</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                      {team.group}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      #{team.fifaRanking}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-400">
                      {team.elo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold font-mono text-slate-300">{team.offenseRating}</span>
                        <div className="w-14 bg-slate-900 h-1 rounded-full overflow-hidden mt-0.5">
                          <div className="bg-orange-500 h-1" style={{ width: `${team.offenseRating}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold font-mono text-slate-300">{team.defenseRating}</span>
                        <div className="w-14 bg-slate-900 h-1 rounded-full overflow-hidden mt-0.5">
                          <div className="bg-emerald-500 h-1" style={{ width: `${team.defenseRating}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col items-center">
                        <span className="font-extrabold font-mono text-indigo-400">{team.overallPower}</span>
                        <div className="w-16 bg-slate-900 h-1 rounded-full overflow-hidden mt-0.5">
                          <div className="bg-indigo-500 h-1" style={{ width: `${team.overallPower}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 border rounded-md px-2 py-0.5 text-[10px] font-semibold ${cat.bg}`}>
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

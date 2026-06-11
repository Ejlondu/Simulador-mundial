/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GroupTableEntry, ThirdPlaceEntry, Team } from '../types';
import { Check, ShieldAlert, Award, Grid, List } from 'lucide-react';

interface StandingsTabProps {
  teams: Team[];
  groupStandings: Record<string, GroupTableEntry[]>;
  bestThirds: ThirdPlaceEntry[];
}

export default function StandingsTab({
  teams,
  groupStandings,
  bestThirds,
}: StandingsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const [selectedSingleGroup, setSelectedSingleGroup] = useState<string>('A');

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  const getTeamName = (id: string) => {
    return teams.find((t) => t.id === id)?.name || id;
  };

  const renderGroupTable = (grpLetter: string) => {
    const table = groupStandings[grpLetter] || [];

    return (
      <div key={grpLetter} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" id={`table-group-${grpLetter}`}>
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Grupo {grpLetter}</h4>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">Fase de Grupos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[320px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-2.5 px-3 text-center w-8">#</th>
                <th className="py-2.5 px-2">Selección</th>
                <th className="py-2.5 px-2 text-center w-8">PJ</th>
                <th className="py-2.5 px-2 text-center w-8">G</th>
                <th className="py-2.5 px-2 text-center w-8">E</th>
                <th className="py-2.5 px-2 text-center w-8">P</th>
                <th className="py-2.5 px-2 text-center w-10">GF:GC</th>
                <th className="py-2.5 px-2 text-center w-8">DG</th>
                <th className="py-2.5 px-3 text-center w-10 font-bold text-indigo-700">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {table.map((row) => {
                const isDirectQualified = row.pos <= 2;
                const isThirdAndQualified = row.pos === 3 && bestThirds.find((bt) => bt.teamId === row.teamId)?.qualified;

                let badgeColor = 'text-slate-400';
                if (isDirectQualified) {
                  badgeColor = 'bg-emerald-50 text-emerald-700 font-bold border-l-2 border-l-emerald-500';
                } else if (isThirdAndQualified) {
                  badgeColor = 'bg-amber-50 text-amber-700 font-bold border-l-2 border-l-amber-500';
                }

                return (
                  <tr key={row.teamId} className={`hover:bg-slate-50/40 transition ${badgeColor}`}>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                      {row.pos}
                    </td>
                    <td className="py-2 px-2 font-semibold">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{row.teamId}</span>
                        <span className="truncate max-w-[100px]" title={getTeamName(row.teamId)}>{getTeamName(row.teamId)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-mono">{row.pj}</td>
                    <td className="py-2 px-2 text-center font-mono">{row.pg}</td>
                    <td className="py-2 px-2 text-center font-mono">{row.pe}</td>
                    <td className="py-2 px-2 text-center font-mono">{row.pp}</td>
                    <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-500">
                      {row.gf}:{row.gc}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-600">
                      {row.dg > 0 ? `+${row.dg}` : row.dg}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-extrabold text-slate-900 bg-slate-50/30">
                      {row.pts}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="standings-tab">
      {/* Tab filter controller */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-sans">Tablas de Posiciones</h3>
          <p className="text-xs text-slate-500">Recalculadas instantáneamente basadas en los marcadores de grupos introducidos o simulados.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Ver Todo</span>
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
              viewMode === 'single'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Un Grupo</span>
          </button>
        </div>
      </div>

      {viewMode === 'single' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-wrap gap-1 justify-center">
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedSingleGroup(g)}
              className={`w-9 h-9 rounded-lg text-xs font-bold font-sans transition ${
                selectedSingleGroup === g
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Main Groups View Section */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="tables-grid">
          {groups.map((g) => renderGroupTable(g))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {renderGroupTable(selectedSingleGroup)}
        </div>
      )}

      {/* Consolidation of Best Thirds Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" id="best-thirds-container">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Ranking Consolidado de Mejores Terceros</h4>
            <p className="text-[11px] text-slate-500 font-light mt-0.5">Clasifican los 8 mejores de los 12 terceros para conformar la ronda de dieciseisavos.</p>
          </div>
          <span className="text-xs bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 rounded-full font-mono">
            8 de 12 Clasifican
          </span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-3 px-6 text-center w-14">#</th>
                <th className="py-3 px-4">Equipo</th>
                <th className="py-3 px-3 text-center">Grupo Original</th>
                <th className="py-3 px-3 text-center">PJ</th>
                <th className="py-3 px-3 text-center font-semibold">PG</th>
                <th className="py-3 px-3 text-center font-semibold">PE</th>
                <th className="py-3 px-3 text-center font-semibold">PP</th>
                <th className="py-3 px-3 text-center">GF:GC</th>
                <th className="py-3 px-3 text-center">DG</th>
                <th className="py-3 px-4 text-center font-bold text-indigo-600">Puntos</th>
                <th className="py-3 px-6 text-center">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {bestThirds.map((row, idx) => {
                const isQualified = row.qualified;

                return (
                  <tr
                    key={row.teamId}
                    className={`hover:bg-slate-50/50 transition ${
                      isQualified
                        ? 'bg-emerald-50/30 text-emerald-950 border-l-4 border-l-emerald-500'
                        : 'bg-red-50/20 text-slate-400 border-l-4 border-l-slate-300'
                    }`}
                  >
                    <td className="py-3.5 px-6 text-center font-mono font-extrabold text-slate-800">
                      {row.pos}º
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className="bg-slate-100/80 text-slate-600 font-mono text-[9px] w-7 py-0.5 rounded text-center">
                          {row.teamId}
                        </span>
                        <span>{getTeamName(row.teamId)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono">
                        Grupo {row.group}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">{row.pj}</td>
                    <td className="py-3.5 px-3 text-center font-mono">{row.pg}</td>
                    <td className="py-3.5 px-3 text-center font-mono">{row.pe}</td>
                    <td className="py-3.5 px-3 text-center font-mono">{row.pp}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-500">
                      {row.gf}:{row.gc}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-medium">
                      {row.dg > 0 ? `+${row.dg}` : row.dg}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-extrabold text-slate-900">
                      {row.pts}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-flex items-center space-x-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        isQualified ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isQualified ? 'Clasifica R32' : 'Eliminado'}
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

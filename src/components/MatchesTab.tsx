/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Match, Team, SimulatorParams } from '../types';
import { Sparkles, Trophy, HelpCircle, Swords, CheckCircle2 } from 'lucide-react';
import { predictMatch } from '../simulator';

interface MatchesTabProps {
  teams: Team[];
  groupMatches: Match[];
  params: SimulatorParams;
  onUpdateScore: (matchId: string, golesA: number | null, golesB: number | null) => void;
  onAutoForecastMatch: (matchId: string) => void;
  onAutoForecastAllGroups: () => void;
}

export default function MatchesTab({
  teams,
  groupMatches,
  params,
  onUpdateScore,
  onAutoForecastMatch,
  onAutoForecastAllGroups,
}: MatchesTabProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('A');
  const [selectedJornada, setSelectedJornada] = useState<string>('ALL');

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Filter matches based on selected group and/or journey
  const filteredMatches = useMemo(() => {
    return groupMatches.filter((m) => {
      const matchGr = m.group || '';
      const matchesGroup = selectedGroup === 'ALL' || matchGr === selectedGroup;

      let matchesJornada = true;
      if (selectedJornada !== 'ALL') {
        const pairingIdxStr = m.id.split('_').pop(); // e.g., M1, M2, ...
        const pairingIdx = parseInt(pairingIdxStr?.replace('M', '') || '1');
        const mJornada = pairingIdx <= 2 ? 'J1' : pairingIdx <= 4 ? 'J2' : 'J3';
        matchesJornada = mJornada === selectedJornada;
      }

      return matchesGroup && matchesJornada;
    });
  }, [groupMatches, selectedGroup, selectedJornada]);

  // Find Team names
  const getTeam = (id: string | null) => {
    return id ? teams.find((t) => t.id === id) : null;
  };

  return (
    <div className="space-y-6" id="matches-tab">
      {/* Selector header controls */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Group Filter Selector */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Filtrar por Grupo</label>
              <div className="flex flex-wrap gap-1">
                {groups.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGroup(g)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold font-sans transition ${
                      selectedGroup === g
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedGroup('ALL')}
                  className={`px-2.5 h-8 rounded-lg text-[10px] uppercase tracking-wider font-bold transition ${
                    selectedGroup === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  Todos
                </button>
              </div>
            </div>

            {/* Jornada Filter Selector */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Filtrar por Jornada</label>
              <div className="flex gap-1.5">
                {['ALL', 'J1', 'J2', 'J3'].map((j) => (
                  <button
                    key={j}
                    onClick={() => setSelectedJornada(j)}
                    className={`px-3 h-8 rounded-lg text-xs font-bold transition ${
                      selectedJornada === j
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {j === 'ALL' ? 'Todas' : j === 'J1' ? 'Jornada 1' : j === 'J2' ? 'Jornada 2' : 'Jornada 3'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="self-end md:self-auto shrink-0">
            <button
              onClick={onAutoForecastAllGroups}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white px-4 py-2.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simular Todos los Grupos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Matches cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="matches-grid">
        {filteredMatches.map((match) => {
          const teamA = getTeam(match.teamAId);
          const teamB = getTeam(match.teamBId);

          if (!teamA || !teamB) return null;

          // Compute prediction values on the fly to display suggested outcome
          const suggested = predictMatch(teamA, teamB, params);

          return (
            <div
              key={match.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-slate-300/80 transition p-5 flex flex-col justify-between"
              id={`match-card-${match.id}`}
            >
              {/* Card Meta details */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-[10px] uppercase font-extrabold text-indigo-700 tracking-wide font-sans">
                  Grupo {match.group} • {match.id}
                </span>

                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                    match.status === 'played' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {match.status === 'played' ? 'Jugado' : 'Pendiente'}
                  </span>

                  <button
                    onClick={() => onAutoForecastMatch(match.id)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50/50 hover:bg-indigo-50 px-2.5 py-1 rounded transition"
                    title="Calcular resultado con modelo predictivo"
                  >
                    Simular
                  </button>
                </div>
              </div>

              {/* Main Battle Line */}
              <div className="flex items-center justify-between space-x-4 mb-4" id="match-interaction-row">
                {/* Team A block */}
                <div className="flex-1 flex items-center space-x-3 text-left">
                  <div className="shrink-0 font-bold bg-slate-50 border border-slate-100 w-10 h-7 rounded flex items-center justify-center text-xs text-slate-600">
                    {teamA.id}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight text-xs md:text-sm">{teamA.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-light">Pot: {teamA.overallPower}</span>
                  </div>
                </div>

                {/* Interactive inputs */}
                <div className="flex items-center space-x-1 shrink-0" id="inputs-block">
                  <input
                    type="number"
                    min="0"
                    placeholder="-"
                    value={match.golesA !== null ? match.golesA : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value));
                      onUpdateScore(match.id, val, match.golesB);
                    }}
                    className="w-10 h-10 border border-slate-300 rounded-lg text-center font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none select-all"
                  />
                  <span className="text-slate-400 font-light text-xs font-sans px-0.5">:</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="-"
                    value={match.golesB !== null ? match.golesB : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value));
                      onUpdateScore(match.id, match.golesA, val);
                    }}
                    className="w-10 h-10 border border-slate-300 rounded-lg text-center font-bold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none select-all"
                  />
                </div>

                {/* Team B block */}
                <div className="flex-1 flex items-center justify-end space-x-3 text-right">
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight text-xs md:text-sm">{teamB.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-light">Pot: {teamB.overallPower}</span>
                  </div>
                  <div className="shrink-0 font-bold bg-slate-50 border border-slate-100 w-10 h-7 rounded flex items-center justify-center text-xs text-slate-600">
                    {teamB.id}
                  </div>
                </div>
              </div>

              {/* Bottom Prediction probabilities */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 mt-auto" id="prob-commentary-panel">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="inline-flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <strong>Sugerido:</strong> {suggested.golesA} - {suggested.golesB}
                  </span>
                  <span className="font-medium">
                    Confianza:{' '}
                    <strong className={match.confidence === 'high' ? 'text-emerald-600 font-bold' : match.confidence === 'medium' ? 'text-amber-600 font-bold' : 'text-orange-500 font-bold'}>
                      {match.confidence === 'high' ? 'Alta' : match.confidence === 'medium' ? 'Media' : 'Baja'}
                    </strong>
                  </span>
                </div>

                {/* Prob bars */}
                <div className="w-full bg-slate-200 rounded-full h-2 flex overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2"
                    style={{ width: `${suggested.probA * 100}%` }}
                    title={`Victoria ${teamA.name}: ${Math.round(suggested.probA * 100)}%`}
                  ></div>
                  <div
                    className="bg-slate-400 h-2"
                    style={{ width: `${suggested.probDraw * 100}%` }}
                    title={`Empate: ${Math.round(suggested.probDraw * 100)}%`}
                  ></div>
                  <div
                    className="bg-emerald-500 h-2"
                    style={{ width: `${suggested.probB * 100}%` }}
                    title={`Victoria ${teamB.name}: ${Math.round(suggested.probB * 100)}%`}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Vant {teamA.id}: {Math.round(suggested.probA * 100)}%</span>
                  <span>Empate: {Math.round(suggested.probDraw * 100)}%</span>
                  <span>Vant {teamB.id}: {Math.round(suggested.probB * 100)}%</span>
                </div>

                <p className="text-[11px] text-slate-600 italic leading-relaxed border-t border-slate-200/50 pt-2 font-normal">
                  {suggested.commentary}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

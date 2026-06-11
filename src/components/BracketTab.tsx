/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Match, Team, SimulatorParams } from '../types';
import { Trophy, HelpCircle, Sparkles, AlertCircle } from 'lucide-react';
import { predictMatch } from '../simulator';

interface BracketTabProps {
  teams: Team[];
  knockoutMatches: Match[];
  params: SimulatorParams;
  onUpdateKnockoutScore: (
    matchId: string,
    golesA: number | null,
    golesB: number | null,
    penaltiesA?: number | null,
    penaltiesB?: number | null
  ) => void;
  onAutoForecastMatch: (matchId: string) => void;
  onAutoForecastAllKnockouts: () => void;
}

export default function BracketTab({
  teams,
  knockoutMatches,
  params,
  onUpdateKnockoutScore,
  onAutoForecastMatch,
  onAutoForecastAllKnockouts,
}: BracketTabProps) {
  const [selectedRound, setSelectedRound] = useState<'r32' | 'r16' | 'qf' | 'sf' | 'final'>('r32');

  const getTeam = (id: string | null) => {
    return id ? teams.find((t) => t.id === id) : null;
  };

  const getMatchByRound = (round: 'r32' | 'r16' | 'qf' | 'sf' | 'final') => {
    return knockoutMatches.filter((m) => m.phase === round);
  };

  const activeMatches = getMatchByRound(selectedRound);

  // Render a single match card
  const renderMatchCard = (match: Match) => {
    const teamA = getTeam(match.teamAId);
    const teamB = getTeam(match.teamBId);

    const isDraw = match.golesA !== null && match.golesB !== null && match.golesA === match.golesB;

    let hasSuggested = false;
    let suggestedA = 0;
    let suggestedB = 0;

    if (teamA && teamB) {
      const pred = predictMatch(teamA, teamB, params);
      suggestedA = pred.golesA;
      suggestedB = pred.golesB;
      hasSuggested = true;
    }

    return (
      <div
        key={match.id}
        className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-sm space-y-3 transition flex flex-col justify-between"
        id={`ko-match-${match.id}`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wide">{match.id}</span>
          <div className="flex items-center space-x-1.5">
            {match.status === 'played' && (
              <span className="bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded text-[9px] border border-green-100 font-mono">
                JUGADO
              </span>
            )}
            {teamA && teamB && (
              <button
                onClick={() => onAutoForecastMatch(match.id)}
                className="text-[9px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 font-bold px-2 py-0.5 rounded transition"
              >
                Simular
              </button>
            )}
          </div>
        </div>

        {/* Competitors and interactive inputs */}
        <div className="space-y-2.5">
          {/* Team A */}
          <div className={`flex items-center justify-between text-xs p-1.5 rounded-lg ${match.winnerId === match.teamAId && match.winnerId ? 'bg-indigo-55 bg-indigo-50/50 text-indigo-950 font-bold' : ''}`}>
            <div className="flex items-center space-x-2">
              <span className={`w-8 h-5 rounded text-[10px] uppercase font-bold flex items-center justify-center font-mono ${teamA ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'}`}>
                {teamA ? teamA.id : '---'}
              </span>
              <span className="truncate max-w-[120px]">{teamA ? teamA.name : match.placeholderA}</span>
            </div>

            <div className="flex items-center space-x-1">
              {teamA && teamB && isDraw && (
                <input
                  type="number"
                  min="0"
                  placeholder="Pen (A)"
                  value={match.penaltiesA !== null && match.penaltiesA !== undefined ? match.penaltiesA : ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value));
                    onUpdateKnockoutScore(match.id, match.golesA, match.golesB, val, match.penaltiesB);
                  }}
                  className="w-13 h-7 text-xs border border-amber-300 rounded text-center bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                  title="Goles de penaltis"
                />
              )}
              <input
                type="number"
                min="0"
                placeholder="-"
                disabled={!teamA || !teamB}
                value={match.golesA !== null ? match.golesA : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value));
                  onUpdateKnockoutScore(match.id, val, match.golesB, match.penaltiesA, match.penaltiesB);
                }}
                className="w-8 h-8 rounded border border-slate-300 text-center font-bold text-slate-900 bg-slate-50 outline-none focus:bg-white text-xs"
              />
            </div>
          </div>

          {/* Team B */}
          <div className={`flex items-center justify-between text-xs p-1.5 rounded-lg ${match.winnerId === match.teamBId && match.winnerId ? 'bg-indigo-55 bg-indigo-50/50 text-indigo-950 font-bold' : ''}`}>
            <div className="flex items-center space-x-2">
              <span className={`w-8 h-5 rounded text-[10px] uppercase font-bold flex items-center justify-center font-mono ${teamB ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-400'}`}>
                {teamB ? teamB.id : '---'}
              </span>
              <span className="truncate max-w-[120px]">{teamB ? teamB.name : match.placeholderB}</span>
            </div>

            <div className="flex items-center space-x-1">
              {teamA && teamB && isDraw && (
                <input
                  type="number"
                  min="0"
                  placeholder="Pen (B)"
                  value={match.penaltiesB !== null && match.penaltiesB !== undefined ? match.penaltiesB : ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value));
                    onUpdateKnockoutScore(match.id, match.golesA, match.golesB, match.penaltiesA, val);
                  }}
                  className="w-13 h-7 text-xs border border-amber-300 rounded text-center bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                  title="Goles de penaltis"
                />
              )}
              <input
                type="number"
                min="0"
                placeholder="-"
                disabled={!teamA || !teamB}
                value={match.golesB !== null ? match.golesB : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Math.max(0, parseInt(e.target.value));
                  onUpdateKnockoutScore(match.id, match.golesA, val, match.penaltiesA, match.penaltiesB);
                }}
                className="w-8 h-8 rounded border border-slate-300 text-center font-bold text-slate-900 bg-slate-50 outline-none focus:bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Penalty Shooters help box */}
        {teamA && teamB && isDraw && (
          <div className="bg-amber-50 border border-amber-100 rounded text-[10px] p-2 text-amber-900 flex items-start space-x-1.5" id="penalty-callout">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
            <p className="leading-snug">
              ¡Empate! Deberás ingresar la definición por <strong>penaltis</strong> para forzar el desempate.
            </p>
          </div>
        )}

        {/* Forecast metadata footer */}
        {hasSuggested && (
          <div className="bg-slate-50 border border-slate-100 rounded p-2 text-[10px] text-slate-500 flex flex-col justify-between" id="match-suggested-score-row">
            <div className="flex justify-between items-center py-0.5">
              <span>Sugerido modelo: <strong>{suggestedA} - {suggestedB}</strong></span>
              <span className={`px-1 rounded text-[9px] font-bold ${match.confidence === 'high' ? 'bg-green-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {match.confidence === 'high' ? 'Alta' : 'Media'} Confianza
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 italic leading-tight truncate">{match.observation}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" id="bracket-tab">
      {/* Control Actions Frame */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-sans">Cuadro de Fase Eliminatoria</h3>
          <p className="text-xs text-slate-500">De las 32 selecciones clasificadas hasta coronar automáticamente al Campeón del Mundo.</p>
        </div>

        <button
          onClick={onAutoForecastAllKnockouts}
          className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white px-4 py-2.5 rounded-lg shadow-sm flex items-center space-x-1.5 transition whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Simular Eliminatorias</span>
        </button>
      </div>

      {/* Bracket Rounds Tab Selectors */}
      <div className="bg-white rounded-xl p-1 shadow-sm border border-slate-200 flex flex-wrap" id="round-nav-selectors">
        {[
          { key: 'r32', label: 'Dieciseisavos (R32)', count: 16 },
          { key: 'r16', label: 'Octavos (R16)', count: 8 },
          { key: 'qf', label: 'Cuartos (QF)', count: 4 },
          { key: 'sf', label: 'Semifinales (SF)', count: 2 },
          { key: 'final', label: 'Gran Final', count: 1 },
        ].map((rd) => (
          <button
            key={rd.key}
            onClick={() => setSelectedRound(rd.key as any)}
            className={`flex-1 py-3 text-xs font-bold transition rounded-lg flex flex-col items-center justify-center space-y-0.5 ${
              selectedRound === rd.key
                ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{rd.label}</span>
            <span className={`text-[9px] font-mono font-medium px-1.5 py-0.2 rounded-full ${selectedRound === rd.key ? 'bg-indigo-700 text-white/90' : 'bg-slate-100 text-slate-500'}`}>
              {rd.count} Partidos
            </span>
          </button>
        ))}
      </div>

      {/* Champion Podium Callout */}
      {selectedRound === 'final' && knockoutMatches.find((m) => m.id === 'FINAL')?.winnerId && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-400/10 to-amber-500/20 border border-yellow-300 rounded-2xl p-6 text-center shadow-sm relative overflow-hidden" id="champion-podium">
          <div className="relative z-10 flex flex-col items-center space-y-2">
            <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />
            <span className="text-xs uppercase tracking-widest font-black text-amber-800">¡CAMPEÓN DEL MUNDIAL 2026!</span>
            <h2 className="text-3xl font-black font-sans tracking-tight text-slate-900">
              {getTeam(knockoutMatches.find((m) => m.id === 'FINAL')!.winnerId!)?.name}
            </h2>
            <p className="text-xs text-amber-800 leading-normal max-w-md italic">
              El modelo proyectó este campeonato basándose en la acumulación de factores competitivos recientes y forma internacional impecable.
            </p>
          </div>
        </div>
      )}

      {/* Grid of active round matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" id="bracket-grid">
        {activeMatches.map((m) => renderMatchCard(m))}
      </div>
    </div>
  );
}

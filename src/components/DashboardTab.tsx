/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Team, Match } from '../types';
import { calculateTitleFavorites } from '../simulator';
import { Shield, Sparkles, AlertCircle, TrendingUp, Trophy, ArrowRight, User } from 'lucide-react';

interface DashboardTabProps {
  teams: Team[];
  matches: Match[];
  groupMatches: Match[];
  knockoutMatches: Match[];
}

export default function DashboardTab({
  teams,
  matches,
  groupMatches,
  knockoutMatches,
}: DashboardTabProps) {
  const [selectedPathTeamId, setSelectedPathTeamId] = useState<string>('ARG');

  // Stats
  const totalMatches = 72 + 32; // Standard World Cup 2026 total is 104. Let's show Played vs Remaining.
  const playedCount = useMemo(() => {
    return matches.filter((m) => m.status === 'played').length;
  }, [matches]);

  const progressPercentage = useMemo(() => {
    return Math.round((playedCount / 104) * 100);
  }, [playedCount]);

  const favorites = useMemo(() => {
    return calculateTitleFavorites(teams);
  }, [teams]);

  const championTeam = useMemo(() => {
    const finalMatch = knockoutMatches.find((m) => m.id === 'FINAL');
    if (finalMatch && finalMatch.winnerId) {
      return teams.find((t) => t.id === finalMatch.winnerId) || null;
    }
    return null;
  }, [knockoutMatches, teams]);

  const groupStats = useMemo(() => {
    // Determine toughest group ("Grupo de la Muerte") based on average power rating of teams
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const ratings = groups.map((g) => {
      const gTeams = teams.filter((t) => t.group === g);
      const avgPower = gTeams.reduce((acc, t) => acc + t.overallPower, 0) / 4;
      return { group: g, avgPower };
    });

    ratings.sort((a, b) => b.avgPower - a.avgPower);
    return {
      deathGroup: ratings[0],
      easiestGroup: ratings[ratings.length - 1],
    };
  }, [teams]);

  // Find highly competitive / uncertain matches (probability close to 33% each or low power difference)
  const highUncertaintyMatches = useMemo(() => {
    const list = groupMatches
      .filter((m) => m.teamAId && m.teamBId)
      .map((m) => {
        const teamAObj = teams.find((t) => t.id === m.teamAId)!;
        const teamBObj = teams.find((t) => t.id === m.teamBId)!;
        const diff = Math.abs(teamAObj.overallPower - teamBObj.overallPower);
        return { match: m, diff, teamAObj, teamBObj };
      });
    list.sort((a, b) => a.diff - b.diff);
    return list.slice(0, 4);
  }, [groupMatches, teams]);

  // Projected road of a selection to the final
  const selectedTeamRoad = useMemo(() => {
    const road: Array<{ stage: string; opponentPlaceholder: string; actualOpponent: string | null; description: string }> = [];
    const team = teams.find((t) => t.id === selectedPathTeamId);
    if (!team) return road;

    // Phase 1: Group matches
    const grMatches = groupMatches.filter((m) => m.teamAId === team.id || m.teamBId === team.id);
    grMatches.forEach((m, idx) => {
      const isA = m.teamAId === team.id;
      const oppId = isA ? m.teamBId : m.teamAId;
      const opp = teams.find((t) => t.id === oppId);
      road.push({
        stage: `Fase de Grupos - M${idx + 1}`,
        opponentPlaceholder: opp?.id || '',
        actualOpponent: opp?.name || null,
        description: `Enfrentamiento directo en el Grupo ${team.group}.`,
      });
    });

    // Phase 2: Search round of 32
    const r32Match = knockoutMatches.find(
      (m) => m.phase === 'r32' && (m.teamAId === team.id || m.teamBId === team.id)
    );

    if (r32Match) {
      const oppId = r32Match.teamAId === team.id ? r32Match.teamBId : r32Match.teamAId;
      const oppName = oppId ? teams.find((t) => t.id === oppId)?.name || oppId : null;
      road.push({
        stage: 'Dieciseisavos (Round of 32)',
        opponentPlaceholder: r32Match.teamAId === team.id ? r32Match.placeholderB || 'Rival' : r32Match.placeholderA || 'Rival',
        actualOpponent: oppName,
        description: r32Match.winnerId === team.id ? 'Clasificado a Octavos.' : 'Proyección de eliminación o avance.',
      });

      // R16
      const r16Match = knockoutMatches.find(
        (m) => m.phase === 'r16' && (m.teamAId === team.id || m.teamBId === team.id)
      );
      if (r16Match) {
        const oppId16 = r16Match.teamAId === team.id ? r16Match.teamBId : r16Match.teamAId;
        const oppName16 = oppId16 ? teams.find((t) => t.id === oppId16)?.name || oppId16 : null;
        road.push({
          stage: 'Octavos de Final (Round of 16)',
          opponentPlaceholder: r16Match.teamAId === team.id ? r16Match.placeholderB || 'Rival' : r16Match.placeholderA || 'Rival',
          actualOpponent: oppName16,
          description: r16Match.winnerId === team.id ? 'Clasificado a Cuartos.' : 'Cruces de llaves eliminatorias.',
        });

        // QF
        const qfMatch = knockoutMatches.find(
          (m) => m.phase === 'qf' && (m.teamAId === team.id || m.teamBId === team.id)
        );
        if (qfMatch) {
          const oppIdQF = qfMatch.teamAId === team.id ? qfMatch.teamBId : qfMatch.teamAId;
          const oppNameQF = oppIdQF ? teams.find((t) => t.id === oppIdQF)?.name || oppIdQF : null;
          road.push({
            stage: 'Cuartos de Final',
            opponentPlaceholder: qfMatch.teamAId === team.id ? qfMatch.placeholderB || 'Rival' : qfMatch.placeholderA || 'Rival',
            actualOpponent: oppNameQF,
            description: qfMatch.winnerId === team.id ? 'Clasificado a Semifinales.' : 'Últimos 8 del torneo.',
          });

          // SF
          const sfMatch = knockoutMatches.find(
            (m) => m.phase === 'sf' && (m.teamAId === team.id || m.teamBId === team.id)
          );
          if (sfMatch) {
            const oppIdSF = sfMatch.teamAId === team.id ? sfMatch.teamBId : sfMatch.teamAId;
            const oppNameSF = oppIdSF ? teams.find((t) => t.id === oppIdSF)?.name || oppIdSF : null;
            road.push({
              stage: 'Semifinal',
              opponentPlaceholder: sfMatch.teamAId === team.id ? sfMatch.placeholderB || 'Rival' : sfMatch.placeholderA || 'Rival',
              actualOpponent: oppNameSF,
              description: sfMatch.winnerId === team.id ? '¡Finalista del Mundial!' : 'Por el pase a la gran final.',
            });

            // Final
            const fnMatch = knockoutMatches.find(
              (m) => m.phase === 'final' && (m.teamAId === team.id || m.teamBId === team.id)
            );
            if (fnMatch) {
              const oppIdFn = fnMatch.teamAId === team.id ? fnMatch.teamBId : fnMatch.teamAId;
              const oppNameFn = oppIdFn ? teams.find((t) => t.id === oppIdFn)?.name || oppIdFn : null;
              road.push({
                stage: 'Gran Final',
                opponentPlaceholder: fnMatch.teamAId === team.id ? fnMatch.placeholderB || 'Rival' : fnMatch.placeholderA || 'Rival',
                actualOpponent: oppNameFn,
                description: fnMatch.winnerId === team.id ? '🏆 CAMPEÓN MUNDIAL 🏆' : 'Subcampeón del Mundo.',
              });
            }
          }
        }
      }
    }

    return road;
  }, [selectedPathTeamId, groupMatches, knockoutMatches, teams]);

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Champion Projection */}
        <div className="bg-gradient-to-br from-[#121620] to-[#0A0D14] text-slate-100 rounded-xl p-6 border border-slate-800 relative overflow-hidden" id="card-champion-projection">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5">
            <Trophy className="w-48 h-48 text-indigo-400" />
          </div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs uppercase font-semibold tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Proyección Campeón 2026</span>
          </div>

          {championTeam ? (
            <div className="space-y-3" id="inner-proj-team">
              <h3 className="text-3xl font-bold font-sans tracking-tight text-white flex items-center">
                {championTeam.name}
              </h3>
              <div className="flex items-center space-x-4 text-xs mt-1">
                <span className="bg-amber-950/60 text-amber-400 border border-amber-900/30 px-2 py-0.5 rounded font-mono text-xs">
                  Ranking FIFA #{championTeam.fifaRanking}
                </span>
                <span className="bg-indigo-950/60 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded font-mono text-xs">
                  Rating Elo: {championTeam.elo}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800 mt-2">
                Actualizado automáticamente según los resultados y fortaleza ofensiva ({championTeam.offenseRating}) / defensiva ({championTeam.defenseRating}).
              </p>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 text-sm" id="inner-no-proj">
              Procesando simulaciones para proyectar un campeón...
            </div>
          )}
        </div>

        {/* Card 2: Tournament Progress */}
        <div className="bg-[#0E121B] rounded-xl p-6 border border-slate-800 text-slate-200" id="card-tourney-progress">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Progreso del Torneo</span>
            <span className="text-xs font-mono font-medium text-indigo-455 text-indigo-400 bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 rounded">
              {playedCount} de 104 Partidos
            </span>
          </div>
          <div className="space-y-3">
            <div className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
              {progressPercentage}% <span className="text-xs text-slate-505 text-slate-500 font-light font-sans ml-1">Simulado</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden font-sans">
              <div
                className="bg-indigo-650 bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Todos los cálculos de desempate y asignación de mejores terceros se recalculan en tiempo real.
            </p>
          </div>
        </div>

        {/* Card 3: Groups Extremes */}
        <div className="bg-[#0E121B] rounded-xl p-6 border border-slate-800 text-slate-200" id="card-groups-extremes">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-3">Análisis de Grupos</span>
          <div className="space-y-3 pt-1">
            <div className="flex items-start justify-between pb-2.5 border-b border-slate-800/60">
              <div>
                <span className="text-xs text-slate-500 block">Grupo de la Muerte</span>
                <span className="font-bold text-slate-200 font-sans">Grupo {groupStats.deathGroup.group}</span>
              </div>
              <span className="text-[11px] font-mono bg-red-950/40 border border-red-900/30 text-red-400 px-2 py-0.5 rounded font-semibold shrink-0">
                Media: {Math.round(groupStats.deathGroup.avgPower)} pts
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Grupo Más Accesible</span>
                <span className="font-bold text-slate-200 font-sans">Grupo {groupStats.easiestGroup.group}</span>
              </div>
              <span className="text-[11px] font-mono bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded font-semibold shrink-0">
                Media: {Math.round(groupStats.easiestGroup.avgPower)} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Favorites Probability */}
        <div className="bg-[#0E121B] rounded-xl p-6 border border-slate-800 lg:col-span-1" id="section-prob-favorites">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-sans">Favoritos al Campeonato</h4>
          </div>
          <div className="space-y-4">
            {favorites.map((fav, idx) => {
              const percentage = Math.round(fav.prob * 100);
              return (
                <div key={fav.teamId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-350 text-slate-300">
                      #{idx + 1} {fav.teamName}
                    </span>
                    <span className="font-bold text-indigo-400 font-mono">{percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Column: Expected Matches Intensity */}
        <div className="bg-[#0E121B] rounded-xl p-6 border border-slate-800 lg:col-span-1" id="section-high-uncertainty">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-sans">Partidos de Máxima Incertidumbre</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed font-sans">
            Esquemas tácticos y coeficientes de potencia de extrema paridad estadística. Se proyecta alta volatilidad en los marcadores.
          </p>
          <div className="space-y-3.5">
            {highUncertaintyMatches.map(({ match, teamAObj, teamBObj }) => (
              <div key={match.id} className="p-3 bg-slate-900/30 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 font-mono text-[10px]">Grupo {match.group} • {match.id}</span>
                  <span className="bg-amber-950/40 border border-amber-900/30 text-amber-400 font-semibold px-2 py-0.5 rounded text-[9px]">
                    Empate {Math.round(match.probDraw * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-800/40 mb-2">
                  <span className="font-bold text-slate-200">{teamAObj.name}</span>
                  <span className="text-slate-650 text-slate-600 font-light font-sans mx-2">vs</span>
                  <span className="font-bold text-slate-200">{teamBObj.name}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Vant A: <strong className="text-slate-350 text-slate-300 font-medium">{Math.round(match.probA * 100)}%</strong></span>
                  <span>Vant B: <strong className="text-slate-350 text-slate-300 font-medium">{Math.round(match.probB * 100)}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Path projection search */}
        <div className="bg-[#0E121B] rounded-xl p-6 border border-slate-800 lg:col-span-1" id="section-road-selector">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-sans">Ruta Proyectada Selección</h4>
          </div>

          <div className="mb-4">
            <label className="text-xs block font-bold text-slate-500 mb-1.5 uppercase">Seleccionar Equipo:</label>
            <select
              value={selectedPathTeamId}
              onChange={(e) => setSelectedPathTeamId(e.target.value)}
              className="w-full bg-[#121620] rounded-md border border-slate-800 p-2 text-xs font-semibold text-slate-250 text-slate-200 border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-sans"
            >
              {[...teams]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.group})
                  </option>
                ))}
            </select>
          </div>

          <div className="relative border-l border-slate-800 pl-4 space-y-4 max-h-[300px] overflow-y-auto pr-1" id="path-road-timeline">
            {selectedTeamRoad.map((step, sIdx) => {
              const isFinishedStage = step.actualOpponent !== null;
              return (
                <div key={sIdx} className="relative text-xs">
                  <div className="absolute -left-6 top-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${isFinishedStage ? 'bg-indigo-500 border-indigo-950 shadow-md' : 'bg-[#0E121B] border-slate-800'} flex items-center justify-center`}></div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wide font-mono">{step.stage}</span>
                    <div className="font-semibold text-slate-200 text-xs flex items-center flex-wrap pt-0.5">
                      <span>vs {step.actualOpponent || step.placeholderB || step.opponentPlaceholder}</span>
                    </div>
                    <p className="text-[11px] text-slate-450 text-slate-400 leading-normal mt-0.5">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

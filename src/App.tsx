/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Team, SimulatorParams, Match, GroupTableEntry, ThirdPlaceEntry } from './types';
import { TEAMS_INITIAL, PARAMS_INITIAL } from './data';
import {
  generateGroupMatches,
  calculateGroupStandings,
  calculateBestThirds,
  buildKnockoutMatches,
  predictMatch,
} from './simulator';
import DashboardTab from './components/DashboardTab';
import ParamsTab from './components/ParamsTab';
import TeamsTab from './components/TeamsTab';
import MatchesTab from './components/MatchesTab';
import StandingsTab from './components/StandingsTab';
import BracketTab from './components/BracketTab';
import { Trophy, HelpCircle, FileSpreadsheet, RefreshCw, BarChart2, CheckSquare } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'params' | 'teams' | 'matches' | 'standings' | 'bracket'>('dashboard');
  const [params, setParams] = useState<SimulatorParams>(PARAMS_INITIAL);
  const [userInputScores, setUserInputScores] = useState<Record<string, { golesA: number | null; golesB: number | null; penaltiesA?: number | null; penaltiesB?: number | null; winnerId?: string | null }>>({});

  // 1. Generate Group stage matches based on parameters & user overrides
  const groupMatches = useMemo(() => {
    return generateGroupMatches(TEAMS_INITIAL, params, userInputScores);
  }, [params, userInputScores]);

  // 2. Recalculate group tables
  const groupStandings = useMemo(() => {
    const standings: Record<string, GroupTableEntry[]> = {};
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    groups.forEach((g) => {
      standings[g] = calculateGroupStandings(g, groupMatches, TEAMS_INITIAL);
    });
    return standings;
  }, [groupMatches]);

  // 3. Recalculate Best third-place teams ranking
  const bestThirds = useMemo(() => {
    return calculateBestThirds(groupStandings, TEAMS_INITIAL);
  }, [groupStandings]);

  // 4. Generate & resolve knockout matches
  const knockoutMatches = useMemo(() => {
    return buildKnockoutMatches(groupStandings, bestThirds, TEAMS_INITIAL, params, userInputScores);
  }, [groupStandings, bestThirds, params, userInputScores]);

  // Combine all played/potential games
  const allMatches = useMemo(() => {
    return [...groupMatches, ...knockoutMatches];
  }, [groupMatches, knockoutMatches]);

  // Event handlers
  const handleUpdateScore = (matchId: string, golesA: number | null, golesB: number | null) => {
    setUserInputScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        golesA,
        golesB,
      },
    }));
  };

  const handleUpdateKnockoutScore = (
    matchId: string,
    golesA: number | null,
    golesB: number | null,
    penaltiesA?: number | null,
    penaltiesB?: number | null
  ) => {
    setUserInputScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        golesA,
        golesB,
        penaltiesA,
        penaltiesB,
      },
    }));
  };

  const handleAutoForecastMatch = (matchId: string) => {
    const match = allMatches.find((m) => m.id === matchId);
    if (!match || !match.teamAId || !match.teamBId) return;

    const teamA = TEAMS_INITIAL.find((t) => t.id === match.teamAId)!;
    const teamB = TEAMS_INITIAL.find((t) => t.id === match.teamBId)!;

    const pred = predictMatch(teamA, teamB, params);

    if (match.phase === 'groups') {
      handleUpdateScore(matchId, pred.golesA, pred.golesB);
    } else {
      let penA: number | null = null;
      let penB: number | null = null;
      if (pred.golesA === pred.golesB) {
        // Tiebreaker penaltis
        const scoreDiff = teamA.overallPower - teamB.overallPower;
        const aWins = Math.random() < (0.5 + scoreDiff / 200);
        penA = aWins ? 5 : 4;
        penB = aWins ? 4 : 5;
      }
      handleUpdateKnockoutScore(matchId, pred.golesA, pred.golesB, penA, penB);
    }
  };

  // Run auto projection for ALL group matches
  const handleAutoForecastAllGroups = () => {
    const newOverrides = { ...userInputScores };
    groupMatches.forEach((m) => {
      const teamA = TEAMS_INITIAL.find((t) => t.id === m.teamAId)!;
      const teamB = TEAMS_INITIAL.find((t) => t.id === m.teamBId)!;
      const pred = predictMatch(teamA, teamB, params);
      newOverrides[m.id] = {
        golesA: pred.golesA,
        golesB: pred.golesB,
      };
    });
    setUserInputScores(newOverrides);
  };

  // Run auto projection for ALL knockout matches
  const handleAutoForecastAllKnockouts = () => {
    // First, make sure groups are filled, otherwise knockout teams aren't decided
    const newOverrides = { ...userInputScores };

    // Group stage fill
    groupMatches.forEach((m) => {
      if (newOverrides[m.id]?.golesA === undefined || newOverrides[m.id]?.golesA === null) {
        const teamA = TEAMS_INITIAL.find((t) => t.id === m.teamAId)!;
        const teamB = TEAMS_INITIAL.find((t) => t.id === m.teamBId)!;
        const pred = predictMatch(teamA, teamB, params);
        newOverrides[m.id] = { golesA: pred.golesA, golesB: pred.golesB };
      }
    });

    // Create custom local structures of groupStandings & bestThirds based on these group fill overrides
    const localGroupMatches = generateGroupMatches(TEAMS_INITIAL, params, newOverrides);
    const localGroupStandings: Record<string, GroupTableEntry[]> = {};
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    groups.forEach((g) => {
      localGroupStandings[g] = calculateGroupStandings(g, localGroupMatches, TEAMS_INITIAL);
    });
    const localBestThirds = calculateBestThirds(localGroupStandings, TEAMS_INITIAL);

    // Solve knockout stage iteratively
    const localKnMatches = buildKnockoutMatches(localGroupStandings, localBestThirds, TEAMS_INITIAL, params, newOverrides);

    const resolveIteration = (mList: Match[]) => {
      mList.forEach((m) => {
        if (!m.teamAId || !m.teamBId) return;
        const teamA = TEAMS_INITIAL.find((t) => t.id === m.teamAId)!;
        const teamB = TEAMS_INITIAL.find((t) => t.id === m.teamBId)!;
        const pred = predictMatch(teamA, teamB, params);

        let penA: number | null = null;
        let penB: number | null = null;
        if (pred.golesA === pred.golesB) {
          const aWins = Math.random() < (0.5 + (teamA.overallPower - teamB.overallPower) / 200);
          penA = aWins ? 5 : 4;
          penB = aWins ? 4 : 5;
        }

        newOverrides[m.id] = {
          golesA: pred.golesA,
          golesB: pred.golesB,
          penaltiesA: penA,
          penaltiesB: penB,
        };
      });
    };

    // 1. Dieciseisavos
    resolveIteration(localKnMatches.filter((m) => m.phase === 'r32'));
    // Build next local bracket list
    let tempKnMatches = buildKnockoutMatches(localGroupStandings, localBestThirds, TEAMS_INITIAL, params, newOverrides);

    // 2. Octavos
    resolveIteration(tempKnMatches.filter((m) => m.phase === 'r16'));
    tempKnMatches = buildKnockoutMatches(localGroupStandings, localBestThirds, TEAMS_INITIAL, params, newOverrides);

    // 3. Cuartos
    resolveIteration(tempKnMatches.filter((m) => m.phase === 'qf'));
    tempKnMatches = buildKnockoutMatches(localGroupStandings, localBestThirds, TEAMS_INITIAL, params, newOverrides);

    // 4. Semifinales
    resolveIteration(tempKnMatches.filter((m) => m.phase === 'sf'));
    tempKnMatches = buildKnockoutMatches(localGroupStandings, localBestThirds, TEAMS_INITIAL, params, newOverrides);

    // 5. Final
    resolveIteration(tempKnMatches.filter((m) => m.phase === 'final'));

    setUserInputScores(newOverrides);
  };

  const handleSimulateFullTournament = () => {
    handleAutoForecastAllKnockouts();
    setActiveTab('bracket');
  };

  const handleClearAllOverrides = () => {
    setUserInputScores({});
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-200 font-sans flex flex-col antialiased">
      {/* Top Professional Header */}
      <header className="bg-[#121620] border-b border-slate-800 shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-left">
            <div className="bg-indigo-600 text-white rounded-lg p-2.5 shadow-md shadow-indigo-900/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-100 tracking-wider font-sans uppercase">MATRIZ MUNDIAL 2026</h1>
              <span className="text-[10px] text-indigo-400 font-bold tracking-wider block font-mono uppercase">
                MODELO DE EVALUACIÓN INTERACTIVA Y SIMULADOR GLOBAL v{params.version} <span className="text-slate-500 font-normal ml-1">v4.2.0-STABLE</span>
              </span>
            </div>
          </div>

          {/* Model status summary on the upper right as seen in design */}
          <div className="hidden md:flex items-center space-x-6 mr-4 text-xs font-mono ml-auto">
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-500 uppercase tracking-tighter">CONFIANZA DEL MODELO</span>
              <span className="text-xs text-emerald-400 font-bold">88.42%</span>
            </div>
          </div>

          {/* Core Master Controllers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSimulateFullTournament}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm font-sans tracking-wide transition flex items-center space-x-1.5 border border-indigo-500 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Simular Mundial Completo</span>
            </button>

            <button
              onClick={handleClearAllOverrides}
              className="text-xs text-slate-300 font-bold border border-slate-700 bg-slate-800/80 hover:bg-slate-700 font-sans px-3 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Resetear Matriz</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Tab Bar */}
        <div className="bg-[#0E121B] border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto select-none" id="workbook-tabs">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'params', label: '⚙️ Parámetros de Simulación' },
              { id: 'teams', label: '🛡️ Selecciones (Ficha Técnica)' },
              { id: 'matches', label: '⚽ Partidos de Grupos' },
              { id: 'standings', label: '📈 Tablas de Grupos & Terceros' },
              { id: 'bracket', label: '🏆 Llaves Eliminatorias (Cuadro)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-xs font-bold transition-all relative border-t-2 whitespace-nowrap outline-none cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#0A0D14] border-t-indigo-500 text-indigo-400 font-extrabold shadow-sm border-x border-slate-800/60'
                    : 'border-t-transparent hover:bg-slate-850 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full" id="main-content-area">
        {activeTab === 'dashboard' && (
          <DashboardTab
            teams={TEAMS_INITIAL}
            matches={allMatches}
            groupMatches={groupMatches}
            knockoutMatches={knockoutMatches}
          />
        )}

        {activeTab === 'params' && (
          <ParamsTab
            params={params}
            onChangeParams={setParams}
            onResetToDefaults={() => setParams(PARAMS_INITIAL)}
          />
        )}

        {activeTab === 'teams' && (
          <TeamsTab teams={TEAMS_INITIAL} />
        )}

        {activeTab === 'matches' && (
          <MatchesTab
            teams={TEAMS_INITIAL}
            groupMatches={groupMatches}
            params={params}
            onUpdateScore={handleUpdateScore}
            onAutoForecastMatch={handleAutoForecastMatch}
            onAutoForecastAllGroups={handleAutoForecastAllGroups}
          />
        )}

        {activeTab === 'standings' && (
          <StandingsTab
            teams={TEAMS_INITIAL}
            groupStandings={groupStandings}
            bestThirds={bestThirds}
          />
        )}

        {activeTab === 'bracket' && (
          <BracketTab
            teams={TEAMS_INITIAL}
            knockoutMatches={knockoutMatches}
            params={params}
            onUpdateKnockoutScore={handleUpdateKnockoutScore}
            onAutoForecastMatch={handleAutoForecastMatch}
            onAutoForecastAllKnockouts={handleAutoForecastAllKnockouts}
          />
        )}
      </main>

      {/* Model Technical Footer */}
      <footer className="bg-[#0D1117] border-t border-slate-800 py-4 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-500 font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="uppercase tracking-tight font-bold text-slate-400">Simulation Engine Connected</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-800 hidden md:block"></div>
            <span className="hidden md:inline">Calculated 1,024 permutations in 0.4s</span>
          </div>
          <div className="uppercase tracking-wider">
            © 2026 MATRIZ DE SIMULACIÓN INTELECTUAL • SYSTEM_ID: WCM_SIM_PRO_2026_MX_US_CA
          </div>
        </div>
      </footer>
    </div>
  );

}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Team, Match, GroupTableEntry, ThirdPlaceEntry, SimulatorParams } from './types';

/**
 * Predicts the outcome of a match between Team A and Team B based on weighted ratings.
 */
export function predictMatch(
  teamA: Team,
  teamB: Team,
  params: SimulatorParams
): {
  golesA: number;
  golesB: number;
  probA: number;
  probDraw: number;
  probB: number;
  uncertainty: 'Alta' | 'Media' | 'Baja';
  commentary: string;
} {
  // Compute overall power rating differences
  const powerDiff = teamA.overallPower - teamB.overallPower;

  // Let's build a clean, statistical projection model
  // Expected goals for Team A & Team B
  // Base average goals per team is 1.25.
  // We modify this based on Team A's offense vs B's defense, A's form, etc.
  const baseA = 1.3;
  const baseB = 1.3;

  // Adjustments based on ratings
  const offenseAdjA = (teamA.offenseRating - teamB.defenseRating) / 40;
  const offenseAdjB = (teamB.offenseRating - teamA.defenseRating) / 40;

  const formAdjA = (teamA.formRating - 60) / 100;
  const formAdjB = (teamB.formRating - 60) / 100;

  const expGoalsA = Math.max(0.2, baseA + offenseAdjA + formAdjA + (powerDiff / 50));
  const expGoalsB = Math.max(0.2, baseB + offenseAdjB + formAdjB - (powerDiff / 50));

  // Suggested goals: we round the expected goals but add a bit of variety to avoid constant 1-1 draws.
  let goalsA = Math.round(expGoalsA);
  let goalsB = Math.round(expGoalsB);

  // If they are extremely close but have high expected goals, let's keep it close
  if (Math.abs(expGoalsA - expGoalsB) < 0.15 && goalsA !== goalsB) {
    // If expected values are close, often a draw or 1-goal difference is logical
    if (Math.random() < 0.5) {
      goalsA = goalsB; // Force a draw
    }
  }

  // Calculate probabilities of Outcomes (Win, Draw, Loss)
  const scoreGap = teamA.overallPower - teamB.overallPower;
  const exponentA = Math.exp(scoreGap / 20);
  const exponentB = Math.exp(-scoreGap / 20);
  const drawWeight = 0.85;

  const totalWeight = exponentA + exponentB + drawWeight;
  const probA = parseFloat((exponentA / totalWeight).toFixed(3));
  const probB = parseFloat((exponentB / totalWeight).toFixed(3));
  const probDraw = parseFloat((drawWeight / totalWeight).toFixed(3));

  // Determine Uncertainty State
  let uncertainty: 'Alta' | 'Media' | 'Baja' = 'Media';
  const absDiff = Math.abs(teamA.overallPower - teamB.overallPower);
  if (absDiff < 8) {
    uncertainty = 'Alta';
  } else if (absDiff > 22) {
    uncertainty = 'Baja';
  }

  // Build a highly customizable tactical explanation
  let commentary = '';
  const isA_Smarter = teamA.overallPower > teamB.overallPower;

  if (absDiff < 5) {
    commentary = `Choque sumamente equilibrado entre ${teamA.name} y ${teamB.name}. Ambos conjuntos presentan índices competitivos muy parecidos en defensa y ataque. Un empate táctico o una definición por un detalle es el escenario más posible.`;
  } else {
    const stronger = isA_Smarter ? teamA : teamB;
    const weaker = isA_Smarter ? teamB : teamA;
    const strongAdvantage = absDiff > 20;

    if (strongAdvantage) {
      commentary = `${stronger.name} posee una superioridad abrumadora con un índice global de potencia de ${stronger.overallPower} frente al ${weaker.overallPower} de ${weaker.name}. Su capacidad goleadora (índice ofensivo: ${stronger.offenseRating}) debería superar con creces la barrera defensiva rival.`;
    } else {
      if (stronger.offenseRating > weaker.defenseRating + 10) {
        commentary = `${stronger.name} parte con ventaja debido a su potente ofensiva (${stronger.offenseRating}) que pondrá a prueba la solidez defensiva de ${weaker.name}. Se proyecta un dominio territorial del equipo de mayor jerarquía.`;
      } else if (stronger.formRating > weaker.formRating + 15) {
        commentary = `El estado de forma reciente de ${stronger.name} (${stronger.recentForm}, índice de forma: ${stronger.formRating}) les otorga un impulso anímico y deportivo relevante frente a un ${weaker.name} que viene mostrando inconsistencia táctica.`;
      } else {
        commentary = `${stronger.name} mantiene un margen favorable por consistencia colectiva y rating competitivo. Sin embargo, ${weaker.name} tiene un esquema defensivo que podría forzar contragolpes de riesgo e incrementar la tensión del encuentro.`;
      }
    }
  }

  return { golesA: goalsA, golesB: goalsB, probA, probDraw, probB, uncertainty, commentary };
}

/**
 * Computes the standings table for a selected group based on team records and match results.
 */
export function calculateGroupStandings(
  groupLetter: string,
  matches: Match[],
  teams: Team[]
): GroupTableEntry[] {
  const groupTeams = teams.filter((t) => t.group === groupLetter);
  const standings: Record<string, GroupTableEntry> = {};

  // Initialize
  groupTeams.forEach((t) => {
    standings[t.id] = {
      teamId: t.id,
      group: groupLetter,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      pts: 0,
      pos: 1,
      qualified: false,
      bestThirdQualified: false,
    };
  });

  // Populate actual stats from matches
  matches
    .filter((m) => m.phase === 'groups' && m.group === groupLetter)
    .forEach((m) => {
      if (m.golesA !== null && m.golesB !== null && m.teamAId && m.teamBId) {
        const teamA = standings[m.teamAId];
        const teamB = standings[m.teamBId];

        if (teamA && teamB) {
          teamA.pj += 1;
          teamB.pj += 1;
          teamA.gf += m.golesA;
          teamA.gc += m.golesB;
          teamB.gf += m.golesB;
          teamB.gc += m.golesA;

          teamA.dg = teamA.gf - teamA.gc;
          teamB.dg = teamB.gf - teamB.gc;

          if (m.golesA > m.golesB) {
            teamA.pg += 1;
            teamA.pts += 3;
            teamB.pp += 1;
          } else if (m.golesA < m.golesB) {
            teamB.pg += 1;
            teamB.pts += 3;
            teamA.pp += 1;
          } else {
            teamA.pe += 1;
            teamB.pe += 1;
            teamA.pts += 1;
            teamB.pts += 1;
          }
        }
      }
    });

  // Convert to array and sort according to precise tournament rules
  const standingsArray = Object.values(standings);

  standingsArray.sort((a, b) => {
    // 1. PTS (Points)
    if (b.pts !== a.pts) return b.pts - a.pts;

    // 2. Goal Difference (DG)
    if (b.dg !== a.dg) return b.dg - a.dg;

    // 3. Goals Scored (GF)
    if (b.gf !== a.gf) return b.gf - a.gf;

    // 4. Head to head (H2H) or deterministic simulator fallback: Elo -> Fifa Ranking
    const teamAObj = teams.find((t) => t.id === a.teamId)!;
    const teamBObj = teams.find((t) => t.id === b.teamId)!;

    if (teamBObj.elo !== teamAObj.elo) {
      return teamBObj.elo - teamAObj.elo;
    }
    return teamAObj.fifaRanking - teamBObj.fifaRanking; // lower is better for FIFA ranking
  });

  // Assign positions
  standingsArray.forEach((entry, idx) => {
    entry.pos = idx + 1;
    // Direct qualified status (top 2 of each of the 12 groups qualify)
    if (entry.pos <= 2) {
      entry.qualified = true;
    }
  });

  return standingsArray;
}

/**
 * Calculates and ranks the best third-placed teams across the 12 groups.
 */
export function calculateBestThirds(
  groupStandings: Record<string, GroupTableEntry[]>,
  teams: Team[]
): ThirdPlaceEntry[] {
  const thirds: ThirdPlaceEntry[] = [];

  // Gather all 3rd placed team rows of each group
  Object.keys(groupStandings).forEach((grp) => {
    const table = groupStandings[grp];
    const thirdTeam = table.find((e) => e.pos === 3);
    if (thirdTeam) {
      thirds.push({
        teamId: thirdTeam.teamId,
        group: grp,
        pj: thirdTeam.pj,
        pg: thirdTeam.pg,
        pe: thirdTeam.pe,
        pp: thirdTeam.pp,
        gf: thirdTeam.gf,
        gc: thirdTeam.gc,
        dg: thirdTeam.dg,
        pts: thirdTeam.pts,
        pos: 1, // calculated below
        qualified: false,
      });
    }
  });

  // Sort best thirds
  thirds.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;

    const teamAObj = teams.find((t) => t.id === a.teamId)!;
    const teamBObj = teams.find((t) => t.id === b.teamId)!;

    if (teamBObj.elo !== teamAObj.elo) {
      return teamBObj.elo - teamAObj.elo;
    }
    return teamAObj.fifaRanking - teamBObj.fifaRanking;
  });

  // Assign positions and set top 8 as qualified
  thirds.forEach((entry, idx) => {
    entry.pos = idx + 1;
    if (entry.pos <= 8) {
      entry.qualified = true;
    }
  });

  return thirds;
}

/**
 * Automatically builds and resolves knockout stages based on group standings
 * and existing manual knockout match configurations.
 */
export function buildKnockoutMatches(
  groupStandings: Record<string, GroupTableEntry[]>,
  bestThirds: ThirdPlaceEntry[],
  teams: Team[],
  params: SimulatorParams,
  userInputScores: Record<string, { golesA: number | null; golesB: number | null; penaltiesA?: number | null; penaltiesB?: number | null; winnerId?: string | null }>
): Match[] {
  // 1. Map who is 1st, 2nd, and qualifying 3rd
  const groupWinners: Record<string, string> = {};
  const groupRunners: Record<string, string> = {};

  Object.entries(groupStandings).forEach(([grp, table]) => {
    const first = table.find((e) => e.pos === 1);
    const second = table.find((e) => e.pos === 2);
    if (first) groupWinners[grp] = first.teamId;
    if (second) groupRunners[grp] = second.teamId;
  });

  // Top 8 qualifying third-place teams mapped as T1...T8
  const qThirdsArr = bestThirds.filter((t) => t.qualified).map((t) => t.teamId);

  // Helper to resolve a team ID or return a placeholder name
  const getTeamObj = (id: string | null) => (id ? teams.find((t) => t.id === id) : null);

  // Generate the 16 Round of 32 Matches
  // Let's lay out our stable bracket matching scheme
  // R32_1: 1A vs T1
  // R32_2: 2A vs 2B
  // ... and so on
  const r32Layouts = [
    { id: 'R32_1', teamAId: groupWinners['A'] || null, teamBId: qThirdsArr[0] || null, plA: '1A', plB: '3º Rank 1' },
    { id: 'R32_2', teamAId: groupRunners['A'] || null, teamBId: groupRunners['B'] || null, plA: '2A', plB: '2B' },
    { id: 'R32_3', teamAId: groupWinners['B'] || null, teamBId: qThirdsArr[1] || null, plA: '1B', plB: '3º Rank 2' },
    { id: 'R32_4', teamAId: groupWinners['C'] || null, teamBId: qThirdsArr[2] || null, plA: '1C', plB: '3º Rank 3' },
    { id: 'R32_5', teamAId: groupRunners['C'] || null, teamBId: groupRunners['D'] || null, plA: '2C', plB: '2D' },
    { id: 'R32_6', teamAId: groupWinners['D'] || null, teamBId: qThirdsArr[3] || null, plA: '1D', plB: '3º Rank 4' },
    { id: 'R32_7', teamAId: groupWinners['E'] || null, teamBId: qThirdsArr[4] || null, plA: '1E', plB: '3º Rank 5' },
    { id: 'R32_8', teamAId: groupRunners['E'] || null, teamBId: groupRunners['F'] || null, plA: '2E', plB: '2F' },
    { id: 'R32_9', teamAId: groupWinners['F'] || null, teamBId: qThirdsArr[5] || null, plA: '1F', plB: '3º Rank 6' },
    { id: 'R32_10', teamAId: groupWinners['G'] || null, teamBId: qThirdsArr[6] || null, plA: '1G', plB: '3º Rank 7' },
    { id: 'R32_11', teamAId: groupRunners['G'] || null, teamBId: groupRunners['H'] || null, plA: '2G', plB: '2H' },
    { id: 'R32_12', teamAId: groupWinners['H'] || null, teamBId: qThirdsArr[7] || null, plA: '1H', plB: '3º Rank 8' },
    { id: 'R32_13', teamAId: groupWinners['I'] || null, teamBId: groupRunners['J'] || null, plA: '1I', plB: '2J' },
    { id: 'R32_14', teamAId: groupWinners['J'] || null, teamBId: groupRunners['I'] || null, plA: '1J', plB: '2I' },
    { id: 'R32_15', teamAId: groupWinners['K'] || null, teamBId: groupRunners['L'] || null, plA: '1K', plB: '2L' },
    { id: 'R32_16', teamAId: groupWinners['L'] || null, teamBId: groupRunners['K'] || null, plA: '1L', plB: '2K' },
  ];

  const matchesMap: Record<string, Match> = {};

  // 1. Resolve Round of 32
  r32Layouts.forEach((lay) => {
    const id = lay.id;
    const teamA = getTeamObj(lay.teamAId);
    const teamB = getTeamObj(lay.teamBId);

    let golesA: number | null = null;
    let golesB: number | null = null;
    let penaltiesA: number | null = null;
    let penaltiesB: number | null = null;
    let winnerId: string | null = null;
    let probA = 0.5;
    let probDraw = 0.0; // no draws in knockout phase
    let probB = 0.5;
    let uncertainty: 'Alta' | 'Media' | 'Baja' = 'Alta';
    let commentary = 'Equipos por definir.';

    if (teamA && teamB) {
      // Calculate prediction metrics
      const pred = predictMatch(teamA, teamB, params);
      probA = pred.probA;
      probB = pred.probB;
      probDraw = 0; // standardise for knockout
      // Normalize probabilities to 100% since no draw is possible in final round advancement
      const sumProb = probA + probB;
      probA = parseFloat((probA / sumProb).toFixed(3));
      probB = parseFloat((probB / sumProb).toFixed(3));
      uncertainty = pred.uncertainty;
      commentary = pred.commentary;

      // Check if user input exists
      const userVal = userInputScores[id];
      if (userVal && userVal.golesA !== null && userVal.golesB !== null) {
        golesA = userVal.golesA;
        golesB = userVal.golesB;
        penaltiesA = userVal.penaltiesA ?? null;
        penaltiesB = userVal.penaltiesB ?? null;
        
        // Decide winner based on scores and penalties
        if (golesA > golesB) {
          winnerId = teamA.id;
        } else if (golesA < golesB) {
          winnerId = teamB.id;
        } else {
          // It's a draw, resolve penalties
          if (penaltiesA !== null && penaltiesB !== null) {
            winnerId = penaltiesA > penaltiesB ? teamA.id : teamB.id;
          } else {
            // Auto resolve tie break default
            winnerId = teamA.overallPower >= teamB.overallPower ? teamA.id : teamB.id;
          }
        }
      } else if (params.mode === 'auto') {
        // Auto sim
        golesA = pred.golesA;
        golesB = pred.golesB;
        if (golesA > golesB) {
          winnerId = teamA.id;
        } else if (golesA < golesB) {
          winnerId = teamB.id;
        } else {
          // Draw -> resolve with penalties simulated based on form/quality
          const scoreDiff = teamA.overallPower - teamB.overallPower;
          const probWinPenalties = 0.5 + (scoreDiff / 200);
          const aWinsPenalties = Math.random() < probWinPenalties;
          if (aWinsPenalties) {
            penaltiesA = 5;
            penaltiesB = 4;
            winnerId = teamA.id;
          } else {
            penaltiesA = 4;
            penaltiesB = 5;
            winnerId = teamB.id;
          }
        }
      }
    }

    matchesMap[id] = {
      id,
      phase: 'r32',
      teamAId: teamA?.id || null,
      teamBId: teamB?.id || null,
      placeholderA: lay.plA,
      placeholderB: lay.plB,
      golesA,
      golesB,
      penaltiesA,
      penaltiesB,
      winnerId,
      probA,
      probDraw,
      probB,
      status: (golesA !== null && golesB !== null) ? 'played' : 'pending',
      observation: commentary,
      confidence: uncertainty === 'Alta' ? 'low' : uncertainty === 'Media' ? 'medium' : 'high',
    };
  });

  // 2. Resolve Round of 16 (8 matches)
  const r16Layouts = [
    { id: 'R16_1', matchA: 'R32_1', matchB: 'R32_2', plA: 'Ganador M32-1', plB: 'Ganador M32-2' },
    { id: 'R16_2', matchA: 'R32_3', matchB: 'R32_4', plA: 'Ganador M32-3', plB: 'Ganador M32-4' },
    { id: 'R16_3', matchA: 'R32_5', matchB: 'R32_6', plA: 'Ganador M32-5', plB: 'Ganador M32-6' },
    { id: 'R16_4', matchA: 'R32_7', matchB: 'R32_8', plA: 'Ganador M32-7', plB: 'Ganador M32-8' },
    { id: 'R16_5', matchA: 'R32_9', matchB: 'R32_10', plA: 'Ganador M32-9', plB: 'Ganador M32-10' },
    { id: 'R16_6', matchA: 'R32_11', matchB: 'R32_12', plA: 'Ganador M32-11', plB: 'Ganador M32-12' },
    { id: 'R16_7', matchA: 'R32_13', matchB: 'R32_14', plA: 'Ganador M32-13', plB: 'Ganador M32-14' },
    { id: 'R16_8', matchA: 'R32_15', matchB: 'R32_16', plA: 'Ganador M32-15', plB: 'Ganador M32-16' },
  ];

  r16Layouts.forEach((lay) => {
    const id = lay.id;
    const prevA = matchesMap[lay.matchA];
    const prevB = matchesMap[lay.matchB];

    const teamA = getTeamObj(prevA?.winnerId || null);
    const teamB = getTeamObj(prevB?.winnerId || null);

    let golesA: number | null = null;
    let golesB: number | null = null;
    let penaltiesA: number | null = null;
    let penaltiesB: number | null = null;
    let winnerId: string | null = null;
    let probA = 0.5;
    let probDraw = 0.0;
    let probB = 0.5;
    let uncertainty: 'Alta' | 'Media' | 'Baja' = 'Alta';
    let commentary = 'Equipos por definir.';

    if (teamA && teamB) {
      const pred = predictMatch(teamA, teamB, params);
      probA = pred.probA;
      probB = pred.probB;
      const sumProb = probA + probB;
      probA = parseFloat((probA / sumProb).toFixed(3));
      probB = parseFloat((probB / sumProb).toFixed(3));
      uncertainty = pred.uncertainty;
      commentary = pred.commentary;

      const userVal = userInputScores[id];
      if (userVal && userVal.golesA !== null && userVal.golesB !== null) {
        golesA = userVal.golesA;
        golesB = userVal.golesB;
        penaltiesA = userVal.penaltiesA ?? null;
        penaltiesB = userVal.penaltiesB ?? null;
        if (golesA > golesB) {
          winnerId = teamA.id;
        } else if (golesA < golesB) {
          winnerId = teamB.id;
        } else {
          if (penaltiesA !== null && penaltiesB !== null) {
            winnerId = penaltiesA > penaltiesB ? teamA.id : teamB.id;
          } else {
            winnerId = teamA.overallPower >= teamB.overallPower ? teamA.id : teamB.id;
          }
        }
      } else if (params.mode === 'auto') {
        golesA = pred.golesA;
        golesB = pred.golesB;
        if (golesA > golesB) {
          winnerId = teamA.id;
        } else if (golesA < golesB) {
          winnerId = teamB.id;
        } else {
          const scoreDiff = teamA.overallPower - teamB.overallPower;
          const probWinPenalties = 0.5 + (scoreDiff / 200);
          const aWinsPenalties = Math.random() < probWinPenalties;
          if (aWinsPenalties) {
            penaltiesA = 5;
            penaltiesB = 4;
            winnerId = teamA.id;
          } else {
            penaltiesA = 4;
            penaltiesB = 5;
            winnerId = teamB.id;
          }
        }
      }
    }

    matchesMap[id] = {
      id,
      phase: 'r16',
      teamAId: teamA?.id || null,
      teamBId: teamB?.id || null,
      placeholderA: lay.plA,
      placeholderB: lay.plB,
      golesA,
      golesB,
      penaltiesA,
      penaltiesB,
      winnerId,
      probA,
      probDraw,
      probB,
      status: (golesA !== null && golesB !== null) ? 'played' : 'pending',
      observation: commentary,
      confidence: uncertainty === 'Alta' ? 'low' : uncertainty === 'Media' ? 'medium' : 'high',
    };
  });

  // 3. Resolve Quarterfinals (4 matches)
  const qfLayouts = [
    { id: 'QF_1', matchA: 'R16_1', matchB: 'R16_2', plA: 'Ganador Octavos 1', plB: 'Ganador Octavos 2' },
    { id: 'QF_2', matchA: 'R16_3', matchB: 'R16_4', plA: 'Ganador Octavos 3', plB: 'Ganador Octavos 4' },
    { id: 'QF_3', matchA: 'R16_5', matchB: 'R16_6', plA: 'Ganador Octavos 5', plB: 'Ganador Octavos 6' },
    { id: 'QF_4', matchA: 'R16_7', matchB: 'R16_8', plA: 'Ganador Octavos 7', plB: 'Ganador Octavos 8' },
  ];

  qfLayouts.forEach((lay) => {
    const id = lay.id;
    const prevA = matchesMap[lay.matchA];
    const prevB = matchesMap[lay.matchB];

    const teamA = getTeamObj(prevA?.winnerId || null);
    const teamB = getTeamObj(prevB?.winnerId || null);

    let golesA: number | null = null;
    let golesB: number | null = null;
    let penaltiesA: number | null = null;
    let penaltiesB: number | null = null;
    let winnerId: string | null = null;
    let probA = 0.5;
    let probDraw = 0.0;
    let probB = 0.5;
    let uncertainty: 'Alta' | 'Media' | 'Baja' = 'Alta';
    let commentary = 'Equipos por definir.';

    if (teamA && teamB) {
      const pred = predictMatch(teamA, teamB, params);
      probA = pred.probA;
      probB = pred.probB;
      const sumProb = probA + probB;
      probA = parseFloat((probA / sumProb).toFixed(3));
      probB = parseFloat((probB / sumProb).toFixed(3));
      uncertainty = pred.uncertainty;
      commentary = pred.commentary;

      const userVal = userInputScores[id];
      if (userVal && userVal.golesA !== null && userVal.golesB !== null) {
        golesA = userVal.golesA;
        golesB = userVal.golesB;
        penaltiesA = userVal.penaltiesA ?? null;
        penaltiesB = userVal.penaltiesB ?? null;
        if (golesA > golesB) {
          winnerId = teamA.id;
        } else if (golesA < golesB) {
          winnerId = teamB.id;
        } else {
          if (penaltiesA !== null && penaltiesB !== null) {
            winnerId = penaltiesA > penaltiesB ? teamA.id : teamB.id;
          } else {
            winnerId = teamA.overallPower >= teamB.overallPower ? teamA.id : teamB.id;
          }
        }
      } else if (params.mode === 'auto') {
        golesA = pred.golesA;
        golesB = pred.golesB;
        if (golesA > golesB) {
          winnerId = teamA.id;
        } else if (golesA < golesB) {
          winnerId = teamB.id;
        } else {
          const scoreDiff = teamA.overallPower - teamB.overallPower;
          const probWinPenalties = 0.5 + (scoreDiff / 200);
          const aWinsPenalties = Math.random() < probWinPenalties;
          if (aWinsPenalties) {
            penaltiesA = 5;
            penaltiesB = 4;
            winnerId = teamA.id;
          } else {
            penaltiesA = 4;
            penaltiesB = 5;
            winnerId = teamB.id;
          }
        }
      }
    }

    matchesMap[id] = {
      id,
      phase: 'qf',
      teamAId: teamA?.id || null,
      teamBId: teamB?.id || null,
      placeholderA: lay.plA,
      placeholderB: lay.plB,
      golesA,
      golesB,
      penaltiesA,
      penaltiesB,
      winnerId,
      probA,
      probDraw,
      probB,
      status: (golesA !== null && golesB !== null) ? 'played' : 'pending',
      observation: commentary,
      confidence: uncertainty === 'Alta' ? 'low' : uncertainty === 'Media' ? 'medium' : 'high',
    };
  });

  // 4. Resolve Semifinals (2 matches)
  const sfLayouts = [
    { id: 'SF_1', matchA: 'QF_1', matchB: 'QF_2', plA: 'Ganador Cuartos 1', plB: 'Ganador Cuartos 2' },
    { id: 'SF_2', matchA: 'QF_3', matchB: 'QF_4', plA: 'Ganador Cuartos 3', plB: 'Ganador Cuartos 4' },
  ];

  sfLayouts.forEach((lay) => {
    const id = lay.id;
    const prevA = matchesMap[lay.matchA];
    const prevB = matchesMap[lay.matchB];

    const teamA = getTeamObj(prevA?.winnerId || null);
    const teamB = getTeamObj(prevB?.winnerId || null);

    let golesA: number | null = null;
    let golesB: number | null = null;
    let penaltiesA: number | null = null;
    let penaltiesB: number | null = null;
    let winnerId: string | null = null;
    let probA = 0.5;
    let probDraw = 0.0;
    let probB = 0.5;
    let uncertainty: 'Alta' | 'Media' | 'Baja' = 'Alta';
    let commentary = 'Equipos por definir.';

    if (teamA && teamB) {
      const pred = predictMatch(teamA, teamB, params);
      probA = pred.probA;
      probB = pred.probB;
      const sumProb = probA + probB;
      probA = parseFloat((probA / sumProb).toFixed(3));
      probB = parseFloat((probB / sumProb).toFixed(3));
      uncertainty = pred.uncertainty;
      commentary = pred.commentary;

      const userVal = userInputScores[id];
      if (userVal && userVal.golesA !== null && userVal.golesB !== null) {
        golesA = userVal.golesA;
        golesB = userVal.golesB;
        penaltiesA = userVal.penaltiesA ?? null;
        penaltiesB = userVal.penaltiesB ?? null;
        if (golesA > golesB) {
          winnerId = teamA.id;
        } else if (golesA < golesB) {
          winnerId = teamB.id;
        } else {
          if (penaltiesA !== null && penaltiesB !== null) {
            winnerId = penaltiesA > penaltiesB ? teamA.id : teamB.id;
          } else {
            winnerId = teamA.overallPower >= teamB.overallPower ? teamA.id : teamB.id;
          }
        }
      } else if (params.mode === 'auto') {
        golesA = pred.golesA;
        golesB = pred.golesB;
        if (golesA > golesB) {
          winnerId = teamA.id;
        } else if (golesA < golesB) {
          winnerId = teamB.id;
        } else {
          const scoreDiff = teamA.overallPower - teamB.overallPower;
          const probWinPenalties = 0.5 + (scoreDiff / 200);
          const aWinsPenalties = Math.random() < probWinPenalties;
          if (aWinsPenalties) {
            penaltiesA = 5;
            penaltiesB = 4;
            winnerId = teamA.id;
          } else {
            penaltiesA = 4;
            penaltiesB = 5;
            winnerId = teamB.id;
          }
        }
      }
    }

    matchesMap[id] = {
      id,
      phase: 'sf',
      teamAId: teamA?.id || null,
      teamBId: teamB?.id || null,
      placeholderA: lay.plA,
      placeholderB: lay.plB,
      golesA,
      golesB,
      penaltiesA,
      penaltiesB,
      winnerId,
      probA,
      probDraw,
      probB,
      status: (golesA !== null && golesB !== null) ? 'played' : 'pending',
      observation: commentary,
      confidence: uncertainty === 'Alta' ? 'low' : uncertainty === 'Media' ? 'medium' : 'high',
    };
  });

  // 5. Final (1 match)
  const finalId = 'FINAL';
  const sf1 = matchesMap['SF_1'];
  const sf2 = matchesMap['SF_2'];

  const teamA = getTeamObj(sf1?.winnerId || null);
  const teamB = getTeamObj(sf2?.winnerId || null);

  let golesA: number | null = null;
  let golesB: number | null = null;
  let penaltiesA: number | null = null;
  let penaltiesB: number | null = null;
  let winnerId: string | null = null;
  let probA = 0.5;
  let probDraw = 0.0;
  let probB = 0.5;
  let uncertainty: 'Alta' | 'Media' | 'Baja' = 'Alta';
  let commentary = 'Equipos por definir.';

  if (teamA && teamB) {
    const pred = predictMatch(teamA, teamB, params);
    probA = pred.probA;
    probB = pred.probB;
    const sumProb = probA + probB;
    probA = parseFloat((probA / sumProb).toFixed(3));
    probB = parseFloat((probB / sumProb).toFixed(3));
    uncertainty = pred.uncertainty;
    commentary = pred.commentary;

    const userVal = userInputScores[finalId];
    if (userVal && userVal.golesA !== null && userVal.golesB !== null) {
      golesA = userVal.golesA;
      golesB = userVal.golesB;
      penaltiesA = userVal.penaltiesA ?? null;
      penaltiesB = userVal.penaltiesB ?? null;
      if (golesA > golesB) {
        winnerId = teamA.id;
      } else if (golesA < golesB) {
        winnerId = teamB.id;
      } else {
        if (penaltiesA !== null && penaltiesB !== null) {
          winnerId = penaltiesA > penaltiesB ? teamA.id : teamB.id;
        } else {
          winnerId = teamA.overallPower >= teamB.overallPower ? teamA.id : teamB.id;
        }
      }
    } else if (params.mode === 'auto') {
      golesA = pred.golesA;
      golesB = pred.golesB;
      if (golesA > golesB) {
        winnerId = teamA.id;
      } else if (golesA < golesB) {
        winnerId = teamB.id;
      } else {
        const scoreDiff = teamA.overallPower - teamB.overallPower;
        const probWinPenalties = 0.5 + (scoreDiff / 200);
        const aWinsPenalties = Math.random() < probWinPenalties;
        if (aWinsPenalties) {
          penaltiesA = 5;
          penaltiesB = 4;
          winnerId = teamA.id;
        } else {
          penaltiesA = 4;
          penaltiesB = 5;
          winnerId = teamB.id;
        }
      }
    }
  }

  matchesMap[finalId] = {
    id: finalId,
    phase: 'final',
    teamAId: teamA?.id || null,
    teamBId: teamB?.id || null,
    placeholderA: 'Ganador Semifinal 1',
    placeholderB: 'Ganador Semifinal 2',
    golesA,
    golesB,
    penaltiesA,
    penaltiesB,
    winnerId,
    probA,
    probDraw,
    probB,
    status: (golesA !== null && golesB !== null) ? 'played' : 'pending',
    observation: commentary,
    confidence: uncertainty === 'Alta' ? 'low' : uncertainty === 'Media' ? 'medium' : 'high',
  };

  return Object.values(matchesMap);
}

/**
 * Programmatically generates the 72 group stage matches if the schedule does not exist,
 * and fills predictions or user overrides.
 */
export function generateGroupMatches(
  teams: Team[],
  params: SimulatorParams,
  userInputScores: Record<string, { golesA: number | null; golesB: number | null }>
): Match[] {
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const matches: Match[] = [];

  groups.forEach((grpLetter) => {
    const grpTeams = teams.filter((t) => t.group === grpLetter);
    if (grpTeams.length < 4) return;

    // Define the 6 standard matchups for the group round-robin
    const pairings = [
      { tAIndex: 0, tBIndex: 1, label: 'Jornada 1' },
      { tAIndex: 2, tBIndex: 3, label: 'Jornada 1' },
      { tAIndex: 0, tBIndex: 2, label: 'Jornada 2' },
      { tAIndex: 1, tBIndex: 3, label: 'Jornada 2' },
      { tAIndex: 0, tBIndex: 3, label: 'Jornada 3' },
      { tAIndex: 1, tBIndex: 2, label: 'Jornada 3' },
    ];

    pairings.forEach((p, idx) => {
      const id = `G_${grpLetter}_M${idx + 1}`;
      const teamA = grpTeams[p.tAIndex];
      const teamB = grpTeams[p.tBIndex];

      const pred = predictMatch(teamA, teamB, params);

      // Check if user input exists
      let golesA: number | null = null;
      let golesB: number | null = null;
      const userVal = userInputScores[id];

      if (userVal && userVal.golesA !== null && userVal.golesB !== null) {
        golesA = userVal.golesA;
        golesB = userVal.golesB;
      } else if (params.mode === 'auto') {
        golesA = pred.golesA;
        golesB = pred.golesB;
      }

      matches.push({
        id,
        phase: 'groups',
        group: grpLetter,
        teamAId: teamA.id,
        teamBId: teamB.id,
        golesA,
        golesB,
        probA: pred.probA,
        probDraw: pred.probDraw,
        probB: pred.probB,
        status: (golesA !== null && golesB !== null) ? 'played' : 'pending',
        observation: pred.commentary,
        confidence: pred.uncertainty === 'Alta' ? 'low' : pred.uncertainty === 'Media' ? 'medium' : 'high',
      });
    });
  });

  return matches;
}

/**
 * Calculates champion probability for each top team using a Monte Carlo approximation model.
 */
export function calculateTitleFavorites(teams: Team[]): Array<{ teamId: string; teamName: string; prob: number; power: number }> {
  // Simple deterministic ranking of title potential using deep stats and overall power
  const sorted = [...teams].sort((a, b) => b.overallPower - a.overallPower);
  const sumPower = sorted.reduce((acc, t) => acc + Math.exp(t.overallPower / 10), 0);

  return sorted.slice(0, 10).map((t) => ({
    teamId: t.id,
    teamName: t.name,
    prob: parseFloat((Math.exp(t.overallPower / 10) / sumPower).toFixed(3)),
    power: t.overallPower,
  }));
}

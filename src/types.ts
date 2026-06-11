/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Team {
  id: string;
  name: string;
  group: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'
  confederation: string;
  fifaRanking: number;
  elo: number;
  recentForm: string; // e.g. "WWDLD"
  recentGF: number; // Goals scored per recent match
  recentGC: number; // Goals conceded per recent match
  offenseRating: number; // 1-100 scale
  defenseRating: number; // 1-100 scale (lower is better or higher is better, let's do higher is better: e.g. 100 = impenetrable defense)
  formRating: number; // 1-100 scale
  overallPower: number; // calculated index based on Elo/FIFA/Offense/Defense/Form
}

export interface Match {
  id: string; // e.g. "M1", "M2", ..., or "R32_1", etc.
  phase: 'groups' | 'r32' | 'r16' | 'qf' | 'sf' | 'final';
  group?: string; // only for group stage
  teamAId: string | null; // Null if not decided yet (for knockout phase)
  teamBId: string | null;
  placeholderA?: string; // e.g. "1A", "2B"
  placeholderB?: string; // e.g. "3C/D/E"
  golesA: number | null; // NULL if not played yet
  golesB: number | null;
  penaltiesA?: number | null; // For knockout ties
  penaltiesB?: number | null;
  winnerId?: string | null; // The team ID that advances
  probA: number; // 0 to 1
  probDraw: number; // 0 to 1
  probB: number; // 0 to 1
  status: 'pending' | 'played';
  observation: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface GroupTableEntry {
  teamId: string;
  group: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  pos: number;
  qualified: boolean; // Direct qualification (1st or 2nd)
  bestThirdQualified: boolean; // Qualified as a best 3rd
}

export interface ThirdPlaceEntry {
  teamId: string;
  group: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  pos: number;
  qualified: boolean;
}

export interface SimulatorParams {
  version: string;
  updateDate: string;
  mode: 'manual' | 'auto'; // Manual means user edits are preserved, Auto means predicted markers are populated
  weightFifa: number; // Predictive weight percentage
  weightElo: number; // Predictive weight percentage
  weightOffense: number; // Predictive weight percentage
  weightDefense: number; // Predictive weight percentage
  weightForm: number; // Predictive weight percentage
  tieBreakCriteria: 'pts_dg_gf_head' | 'pts_dg_gf_fair_random'; // Tie breaks: PTS, GD, GF, H2H, FairPlay, Draw
  extraTimeRules: 'always_penalties' | 'et_then_penalties' | 'manual_picker';
}

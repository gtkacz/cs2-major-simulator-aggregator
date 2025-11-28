import type { Team, Match, TournamentState } from '../types';
import teamsData from '../assets/teams.json';

// Initialize tournament
export function initializeTournament(): TournamentState {
  const teams: Team[] = Object.entries(teamsData).map(([name, seed]) => ({
    id: name,
    name,
    seed,
    initial_seed: seed,
    wins: 0,
    losses: 0,
    opponents: [],
    buchholz_score: 0,
    status: 'active'
  }));

  // Sort by seed initially
  teams.sort((a, b) => a.seed - b.seed);

  return {
    current_round: 1,
    matches: [],
    teams,
    is_started: false,
    is_finished: false
  };
}

// Calculate Buchholz scores
export function calculateBuchholz(teams: Team[]) {
  const teamMap = new Map(teams.map(t => [t.id, t]));
  
  teams.forEach(team => {
    let score = 0;
    team.opponents.forEach(oppId => {
      const opp = teamMap.get(oppId);
      if (opp) {
        score += (opp.wins - opp.losses);
      }
    });
    team.buchholz_score = score;
  });
}

// Generate Pairings
export function generatePairings(state: TournamentState): Match[] {
  const { teams, current_round } = state;
  const activeTeams = teams.filter(t => t.status === 'active');

  // Calculate Buchholz before pairing (for Round 3+)
  calculateBuchholz(teams);

  // Group by score (Wins - Losses)
  const groups: Record<string, Team[]> = {};
  
  activeTeams.forEach(t => {
    const key = `${t.wins}-${t.losses}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const newMatches: Match[] = [];
  const groupKeys = Object.keys(groups);

  for (const key of groupKeys) {
    const group = groups[key] || [];
    if (group.length === 0) continue;

    if (current_round <= 2) {
      group.sort((a, b) => a.initial_seed - b.initial_seed);
    } else {
      group.sort((a, b) => {
        if (b.buchholz_score !== a.buchholz_score) {
          return b.buchholz_score - a.buchholz_score;
        }
        return a.initial_seed - b.initial_seed;
      });
    }

    const groupMatches = pairGroup(group, current_round);
    newMatches.push(...groupMatches);
  }
  
  return newMatches;
}

function pairGroup(group: Team[], round: number): Match[] {
  if (!group || group.length === 0) return [];
  const unmatched = [...group];
  
  // Recursive solver
  const solvedMatches = solvePairing(unmatched);
  if (solvedMatches) {
    return solvedMatches.map(m => ({
      id: `R${round}-${m[0].id}-${m[1].id}`,
      round,
      team1: m[0],
      team2: m[1],
      winner_id: null
    }));
  }
  
  console.warn(`Could not find valid pairings for group size ${group.length}. Rematches might be inevitable.`);
  
  // Simple fallback pairing
  const fallbackMatches: Match[] = [];
  for(let i=0; i<group.length; i+=2) {
    const t1 = group[i];
    const t2 = group[i+1];
    if (t1 && t2) {
        fallbackMatches.push({
        id: `R${round}-${t1.id}-${t2.id}`,
        round,
        team1: t1,
        team2: t2,
        winner_id: null
        });
    }
  }
  return fallbackMatches;
}

function solvePairing(teams: Team[]): [Team, Team][] | null {
  if (teams.length === 0) return [];
  
  const t1 = teams[0];
  if (!t1) return null;

  for (let i = teams.length - 1; i >= 1; i--) {
    const t2 = teams[i];
    if (!t2) continue;
    
    // Check rematch
    if (hasPlayed(t1, t2)) continue;
    
    // Valid pair. Recurse.
    const remaining = teams.filter((_, idx) => idx !== 0 && idx !== i);
    const result = solvePairing(remaining);
    
    if (result) {
      return [[t1, t2], ...result];
    }
  }
  
  return null;
}

function hasPlayed(t1: Team, t2: Team): boolean {
  return t1.opponents.includes(t2.id);
}

export function advanceRound(state: TournamentState): TournamentState {
  const { matches, teams, current_round } = state;
  
  if (matches.some(m => !m.winner_id)) {
    throw new Error("All matches must be decided before advancing.");
  }

  matches.forEach(match => {
    if (match.round !== current_round) return; 
    
    const t1 = teams.find(t => t.id === match.team1.id);
    const t2 = teams.find(t => t.id === match.team2.id);
    
    if (!t1 || !t2) return;
    
    if (!t1.opponents.includes(t2.id)) t1.opponents.push(t2.id);
    if (!t2.opponents.includes(t1.id)) t2.opponents.push(t1.id);
    
    if (match.winner_id === t1.id) {
      t1.wins++;
      t2.losses++;
    } else {
      t2.wins++;
      t1.losses++;
    }
  });
  
  teams.forEach(t => {
    if (t.wins >= 3) t.status = 'qualified';
    else if (t.losses >= 3) t.status = 'eliminated';
  });
  
  const activeTeams = teams.filter(t => t.status === 'active');
  if (activeTeams.length === 0) {
    return {
      ...state,
      is_finished: true,
      matches: []
    };
  }
  
  const nextRound = current_round + 1;
  const nextMatches = generatePairings({
      ...state,
      current_round: nextRound,
      matches: [],
      teams: teams
  });
  
  return {
    current_round: nextRound,
    matches: nextMatches,
    teams,
    is_started: true,
    is_finished: false
  };
}

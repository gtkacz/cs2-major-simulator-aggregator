export interface Team {
  id: string;
  name: string;
  seed: number;
  wins: number;
  losses: number;
  opponents: string[]; // IDs of teams played against
  buchholz_score: number;
  status: 'active' | 'qualified' | 'eliminated';
  initial_seed: number; // For Buchholz calculation referencing initial seed if needed, but usually it uses live scores.
  // CS2 Majors uses Buchholz score (Sum of opponents' scores).
  // But for seeding rounds 3-5, it uses Buchholz.
}

export interface Match {
  id: string;
  round: number;
  team1: Team;
  team2: Team;
  winner_id: string | null; // null if not decided
}

export interface TournamentState {
  current_round: number;
  matches: Match[];
  teams: Team[];
  is_started: boolean;
  is_finished: boolean;
}


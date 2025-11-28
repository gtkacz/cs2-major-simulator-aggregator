// Type definitions for Swiss Tournament Simulator

export interface Team {
  name: string
  seed: number
  wins: number
  losses: number
  buchholz: number
  opponents: string[]
  status: 'active' | 'advanced' | 'eliminated'
}

export interface Match {
  id: string
  round: number
  team1: string
  team2: string
  winner: string | null
  pool: string // e.g., "0-0", "1-0", "2-0", "1-1", "2-1", "0-1", "0-2", "1-2"
}

export interface TournamentState {
  teams: Record<string, Team>
  matches: Match[]
  currentRound: number
  roundMatches: Match[]
  isComplete: boolean
  advancedTeams: string[]
  eliminatedTeams: string[]
}

export type TeamSeedData = Record<string, number>

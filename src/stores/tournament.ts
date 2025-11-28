import type { Match, Team, TeamSeedData, TournamentState } from '@/types/tournament'
// Tournament store with Swiss system and Buchholz tiebreaker
import { defineStore } from 'pinia'
import teamsData from '@/data/teams.json'

function generateMatchId (): string {
  return Math.random().toString(36).slice(2, 11)
}

export const useTournamentStore = defineStore('tournament', {
  state: (): TournamentState => ({
    teams: {},
    matches: [],
    currentRound: 0,
    roundMatches: [],
    isComplete: false,
    advancedTeams: [],
    eliminatedTeams: [],
  }),

  getters: {
    activeTeams: (state): Team[] => {
      return Object.values(state.teams).filter(team => team.status === 'active')
    },

    teamsByPool: (state): Record<string, Team[]> => {
      const pools: Record<string, Team[]> = {}
      for (const team of Object.values(state.teams)
        .filter(team => team.status === 'active')) {
        const poolKey = `${team.wins}-${team.losses}`
        if (!pools[poolKey]) {
          pools[poolKey] = []
        }
        pools[poolKey].push(team)
      }
      return pools
    },

    standingsSorted: (state): Team[] => {
      return Object.values(state.teams).toSorted((a, b) => {
        // Sort by status (advanced first, then active, then eliminated)
        const statusOrder = { advanced: 0, active: 1, eliminated: 2 }
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status]
        }
        // Then by wins
        if (b.wins !== a.wins) {
          return b.wins - a.wins
        }
        // Then by losses (fewer is better)
        if (a.losses !== b.losses) {
          return a.losses - b.losses
        }
        // Then by Buchholz score (higher is better)
        if (b.buchholz !== a.buchholz) {
          return b.buchholz - a.buchholz
        }
        // Then by seed (lower is better)
        return a.seed - b.seed
      })
    },

    currentRoundPendingMatches: (state): Match[] => {
      return state.roundMatches.filter(m => m.winner === null)
    },

    canAdvanceRound: (state): boolean => {
      return state.roundMatches.length > 0
        && state.roundMatches.every(m => m.winner !== null)
        && !state.isComplete
    },
  },

  actions: {
    initializeTournament (customTeams?: TeamSeedData) {
      const data = customTeams || (teamsData as TeamSeedData)
      this.teams = {}
      this.matches = []
      this.currentRound = 0
      this.roundMatches = []
      this.isComplete = false
      this.advancedTeams = []
      this.eliminatedTeams = []

      // Initialize teams
      for (const [name, seed] of Object.entries(data)) {
        this.teams[name] = {
          name,
          seed,
          wins: 0,
          losses: 0,
          buchholz: 0,
          opponents: [],
          status: 'active',
        }
      }

      // Generate first round matches
      this.generateRoundMatches()
    },

    calculateBuchholz () {
      // Calculate Buchholz score for each team
      // Buchholz = sum of opponents' wins
      for (const team of Object.values(this.teams)) {
        team.buchholz = team.opponents.reduce((sum, oppName) => {
          const opponent = this.teams[oppName]
          return sum + (opponent ? opponent.wins : 0)
        }, 0)
      }
    },

    generateRoundMatches () {
      this.currentRound++
      this.roundMatches = []

      // Group active teams by their current record (pool)
      const pools: Record<string, Team[]> = {}
      for (const team of Object.values(this.teams)
        .filter(team => team.status === 'active')) {
        const poolKey = `${team.wins}-${team.losses}`
        if (!pools[poolKey]) {
          pools[poolKey] = []
        }
        pools[poolKey].push(team)
      }

      // Define pool order for Swiss system
      // Round 1: 0-0
      // Round 2: 1-0, 0-1
      // Round 3: 2-0, 1-1, 0-2
      // Round 4: 2-1, 1-2
      // Round 5: 2-2

      const poolOrder = this.getPoolOrder()

      for (const poolKey of poolOrder) {
        if (pools[poolKey] && pools[poolKey].length > 0) {
          const poolTeams = [...pools[poolKey]]

          // Sort teams within pool by Buchholz (higher first), then seed (lower first)
          poolTeams.sort((a, b) => {
            if (b.buchholz !== a.buchholz) {
              return b.buchholz - a.buchholz
            }
            return a.seed - b.seed
          })

          // Pair teams avoiding rematches if possible
          const paired = this.pairTeamsInPool(poolTeams, poolKey)
          this.roundMatches.push(...paired)
        }
      }
    },

    getPoolOrder (): string[] {
      // Returns pool keys in order based on current round
      // This ensures higher record pools are processed first
      const allPools = new Set<string>()

      for (const team of Object.values(this.teams)
        .filter(team => team.status === 'active')) {
        allPools.add(`${team.wins}-${team.losses}`)
      }

      // Sort pools: higher wins first, then lower losses
      return Array.from(allPools).toSorted((a, b) => {
        const aParts = a.split('-').map(Number)
        const bParts = b.split('-').map(Number)
        const aWins = aParts[0] ?? 0
        const aLosses = aParts[1] ?? 0
        const bWins = bParts[0] ?? 0
        const bLosses = bParts[1] ?? 0

        if (bWins !== aWins) {
          return bWins - aWins
        }
        return aLosses - bLosses
      })
    },

    pairTeamsInPool (teams: Team[], poolKey: string): Match[] {
      const matches: Match[] = []
      const paired = new Set<string>()

      // Try to pair teams avoiding rematches
      for (let i = 0; i < teams.length; i++) {
        const team1 = teams[i]
        if (!team1 || paired.has(team1.name)) {
          continue
        }

        for (let j = i + 1; j < teams.length; j++) {
          const team2 = teams[j]
          if (!team2 || paired.has(team2.name)) {
            continue
          }

          // Check if these teams have already played
          const havePlayedBefore = team1.opponents.includes(team2.name)

          // Try to avoid rematches, but allow if necessary
          if (!havePlayedBefore || this.isLastResortPairing(teams, paired, team1, team2)) {
            matches.push({
              id: generateMatchId(),
              round: this.currentRound,
              team1: team1.name,
              team2: team2.name,
              winner: null,
              pool: poolKey,
            })
            paired.add(team1.name)
            paired.add(team2.name)
            break
          }
        }
      }

      // Handle any remaining unpaired teams (shouldn't happen with 16 teams)
      // But in case of odd pools, they might need to be paired across pools
      const unpaired = teams.filter(t => !paired.has(t.name))
      for (let i = 0; i < unpaired.length - 1; i += 2) {
        const unpairedTeam1 = unpaired[i]
        const unpairedTeam2 = unpaired[i + 1]
        if (unpairedTeam1 && unpairedTeam2) {
          matches.push({
            id: generateMatchId(),
            round: this.currentRound,
            team1: unpairedTeam1.name,
            team2: unpairedTeam2.name,
            winner: null,
            pool: poolKey,
          })
        }
      }

      return matches
    },

    isLastResortPairing (allTeams: Team[], paired: Set<string>, team1: Team, _team2: Team): boolean {
      // Check if this is the only possible pairing left for team1
      const availableOpponents = allTeams.filter(t =>
        t.name !== team1.name
        && !paired.has(t.name)
        && !team1.opponents.includes(t.name),
      )
      return availableOpponents.length === 0
    },

    setMatchWinner (matchId: string, winnerName: string) {
      const match = this.roundMatches.find(m => m.id === matchId)
      if (!match) {
        return
      }

      match.winner = winnerName

      // Update team records
      const winner = this.teams[winnerName]
      const loserName = match.team1 === winnerName ? match.team2 : match.team1
      const loser = this.teams[loserName]

      if (winner && loser) {
        winner.wins++
        loser.losses++

        // Track opponents
        winner.opponents.push(loserName)
        loser.opponents.push(winnerName)

        // Check for advancement/elimination
        if (winner.wins >= 3) {
          winner.status = 'advanced'
          this.advancedTeams.push(winnerName)
        }
        if (loser.losses >= 3) {
          loser.status = 'eliminated'
          this.eliminatedTeams.push(loserName)
        }
      }

      // Recalculate Buchholz after each match
      this.calculateBuchholz()

      // Save match to history
      this.matches.push({ ...match })

      // Check if tournament is complete
      this.checkTournamentComplete()
    },

    checkTournamentComplete () {
      const activeTeams = Object.values(this.teams).filter(t => t.status === 'active')
      if (activeTeams.length === 0) {
        this.isComplete = true
      }
    },

    advanceRound () {
      if (!this.canAdvanceRound) {
        return
      }

      // Clear current round matches
      this.roundMatches = []

      // Check if tournament should continue
      const activeTeams = Object.values(this.teams).filter(t => t.status === 'active')

      if (activeTeams.length === 0) {
        this.isComplete = true
        return
      }

      // Generate next round matches
      this.generateRoundMatches()
    },

    simulateMatch (matchId: string) {
      const match = this.roundMatches.find(m => m.id === matchId)
      if (!match || match.winner) {
        return
      }

      const team1 = this.teams[match.team1]
      const team2 = this.teams[match.team2]

      if (!team1 || !team2) {
        return
      }

      // Simple simulation based on seed (lower seed = better chance)
      // Add some randomness for excitement
      const seed1Factor = 1 / team1.seed
      const seed2Factor = 1 / team2.seed
      const totalFactor = seed1Factor + seed2Factor

      const team1WinProbability = seed1Factor / totalFactor
      const random = Math.random()

      const winner = random < team1WinProbability ? team1.name : team2.name
      this.setMatchWinner(matchId, winner)
    },

    simulateRound () {
      for (const match of this.roundMatches
        .filter(m => m.winner === null)) {
        this.simulateMatch(match.id)
      }
    },

    simulateTournament () {
      while (!this.isComplete) {
        this.simulateRound()
        if (this.canAdvanceRound) {
          this.advanceRound()
        }
      }
    },

    resetTournament () {
      this.initializeTournament()
    },
  },
})

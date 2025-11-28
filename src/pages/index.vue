<template>
  <v-container class="py-6" max-width="1400">
    <!-- Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="text-center">
          <h1 class="text-h3 font-weight-bold mb-2">
            <v-icon class="mr-2" color="primary" size="40">mdi-trophy</v-icon>
            CS2 Major Swiss Tournament Simulator
          </h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            Buchholz System • 3 Wins to Advance • 3 Losses to Eliminate
          </p>
        </div>
      </v-col>
    </v-row>

    <!-- Controls -->
    <v-row class="mb-4">
      <v-col class="d-flex justify-center gap-4 flex-wrap" cols="12">
        <v-btn
          v-if="!store.isComplete && store.currentRound === 0"
          color="primary"
          prepend-icon="mdi-play"
          size="large"
          @click="startTournament"
        >
          Start Tournament
        </v-btn>

        <v-btn
          v-if="store.currentRound > 0 && !store.isComplete"
          color="secondary"
          :disabled="store.currentRoundPendingMatches.length === 0"
          prepend-icon="mdi-fast-forward"
          size="large"
          @click="simulateRemainingMatches"
        >
          Simulate Remaining Matches
        </v-btn>

        <v-btn
          v-if="store.canAdvanceRound"
          color="success"
          prepend-icon="mdi-arrow-right"
          size="large"
          @click="advanceToNextRound"
        >
          Advance to Round {{ store.currentRound + 1 }}
        </v-btn>

        <v-btn
          v-if="store.currentRound > 0"
          color="warning"
          :disabled="store.isComplete"
          prepend-icon="mdi-lightning-bolt"
          size="large"
          @click="simulateEntireTournament"
        >
          Simulate Entire Tournament
        </v-btn>

        <v-btn
          color="error"
          prepend-icon="mdi-refresh"
          size="large"
          @click="resetTournament"
        >
          Reset
        </v-btn>
      </v-col>
    </v-row>

    <!-- Tournament Status -->
    <v-row v-if="store.currentRound > 0" class="mb-4">
      <v-col cols="12">
        <v-alert
          class="text-center"
          :icon="store.isComplete ? 'mdi-flag-checkered' : 'mdi-information'"
          :type="store.isComplete ? 'success' : 'info'"
          variant="tonal"
        >
          <template v-if="store.isComplete">
            <strong>Tournament Complete!</strong>
            {{ store.advancedTeams.length }} teams have advanced to the playoffs.
          </template>
          <template v-else>
            <strong>Round {{ store.currentRound }}</strong> •
            {{ store.currentRoundPendingMatches.length }} matches remaining •
            {{ store.activeTeams.length }} teams active
          </template>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row v-if="store.currentRound > 0">
      <!-- Current Round Matches -->
      <v-col cols="12" md="6">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center bg-primary text-white">
            <v-icon class="mr-2">mdi-sword-cross</v-icon>
            Round {{ store.currentRound }} Matches
          </v-card-title>

          <v-card-text class="pa-0">
            <v-list v-if="store.roundMatches.length > 0">
              <template v-for="(match, index) in sortedRoundMatches" :key="match.id">
                <v-list-item class="py-3">
                  <div class="d-flex align-center justify-space-between w-100">
                    <!-- Team 1 -->
                    <div
                      class="team-slot text-right flex-grow-1"
                      :class="{
                        'winner': match.winner === match.team1,
                        'loser': match.winner && match.winner !== match.team1,
                        'clickable': !match.winner,
                      }"
                      @click="!match.winner && selectWinner(match.id, match.team1)"
                    >
                      <span class="font-weight-medium">{{ match.team1 }}</span>
                      <v-chip class="ml-2" size="x-small" variant="outlined">
                        #{{ store.teams[match.team1]?.seed }}
                      </v-chip>
                    </div>

                    <!-- VS Badge -->
                    <div class="mx-4 text-center">
                      <v-chip
                        :color="match.winner ? 'success' : 'primary'"
                        size="small"
                        variant="elevated"
                      >
                        {{ match.winner ? 'DONE' : 'VS' }}
                      </v-chip>
                      <div class="text-caption text-medium-emphasis mt-1">
                        {{ match.pool }}
                      </div>
                    </div>

                    <!-- Team 2 -->
                    <div
                      class="team-slot text-left flex-grow-1"
                      :class="{
                        'winner': match.winner === match.team2,
                        'loser': match.winner && match.winner !== match.team2,
                        'clickable': !match.winner,
                      }"
                      @click="!match.winner && selectWinner(match.id, match.team2)"
                    >
                      <v-chip class="mr-2" size="x-small" variant="outlined">
                        #{{ store.teams[match.team2]?.seed }}
                      </v-chip>
                      <span class="font-weight-medium">{{ match.team2 }}</span>
                    </div>
                  </div>
                </v-list-item>
                <v-divider v-if="index < sortedRoundMatches.length - 1" />
              </template>
            </v-list>
            <v-alert v-else class="ma-4" type="info" variant="tonal">
              No matches in this round yet.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Standings -->
      <v-col cols="12" md="6">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center bg-secondary text-white">
            <v-icon class="mr-2">mdi-format-list-numbered</v-icon>
            Tournament Standings
          </v-card-title>

          <v-card-text class="pa-0">
            <v-table density="compact">
              <thead>
                <tr>
                  <th class="text-left">Team</th>
                  <th class="text-center">W-L</th>
                  <th class="text-center">Buchholz</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="team in store.standingsSorted" :key="team.name">
                  <td>
                    <div class="d-flex align-center">
                      <v-chip class="mr-2" size="x-small" variant="outlined">
                        #{{ team.seed }}
                      </v-chip>
                      {{ team.name }}
                    </div>
                  </td>
                  <td class="text-center">
                    <span class="text-success font-weight-medium">{{ team.wins }}</span>
                    -
                    <span class="text-error font-weight-medium">{{ team.losses }}</span>
                  </td>
                  <td class="text-center">
                    {{ team.buchholz }}
                  </td>
                  <td class="text-center">
                    <v-chip
                      :color="getStatusColor(team.status)"
                      size="small"
                      variant="tonal"
                    >
                      {{ getStatusText(team.status) }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Advanced Teams -->
        <v-card v-if="store.advancedTeams.length > 0" class="mt-4" elevation="2">
          <v-card-title class="d-flex align-center bg-success text-white">
            <v-icon class="mr-2">mdi-trophy</v-icon>
            Qualified Teams ({{ store.advancedTeams.length }}/8)
          </v-card-title>
          <v-card-text>
            <v-chip
              v-for="teamName in store.advancedTeams"
              :key="teamName"
              class="ma-1"
              color="success"
              variant="elevated"
            >
              <v-icon size="small" start>mdi-check</v-icon>
              {{ teamName }}
            </v-chip>
          </v-card-text>
        </v-card>

        <!-- Eliminated Teams -->
        <v-card v-if="store.eliminatedTeams.length > 0" class="mt-4" elevation="2">
          <v-card-title class="d-flex align-center bg-error text-white">
            <v-icon class="mr-2">mdi-close-circle</v-icon>
            Eliminated Teams ({{ store.eliminatedTeams.length }}/8)
          </v-card-title>
          <v-card-text>
            <v-chip
              v-for="teamName in store.eliminatedTeams"
              :key="teamName"
              class="ma-1"
              color="error"
              variant="tonal"
            >
              <v-icon size="small" start>mdi-close</v-icon>
              {{ teamName }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Initial Teams Display -->
    <v-row v-else>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="d-flex align-center bg-primary text-white">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            Participating Teams
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                v-for="(team, index) in initialTeamsList"
                :key="team.name"
                cols="6"
                md="3"
                sm="4"
              >
                <v-card class="pa-3" variant="outlined">
                  <div class="d-flex align-center">
                    <v-avatar class="mr-3" color="primary" size="32">
                      {{ index + 1 }}
                    </v-avatar>
                    <div>
                      <div class="font-weight-medium">{{ team.name }}</div>
                      <div class="text-caption text-medium-emphasis">Seed #{{ team.seed }}</div>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Match History -->
    <v-row v-if="store.matches.length > 0" class="mt-4">
      <v-col cols="12">
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-2">mdi-history</v-icon>
              Match History ({{ store.matches.length }} matches)
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Pool</th>
                    <th>Team 1</th>
                    <th>Team 2</th>
                    <th>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="match in store.matches" :key="match.id">
                    <td>{{ match.round }}</td>
                    <td>{{ match.pool }}</td>
                    <td :class="{ 'text-success font-weight-bold': match.winner === match.team1 }">
                      {{ match.team1 }}
                    </td>
                    <td :class="{ 'text-success font-weight-bold': match.winner === match.team2 }">
                      {{ match.team2 }}
                    </td>
                    <td class="text-success font-weight-bold">{{ match.winner }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import type { TeamSeedData } from '@/types/tournament'
  import { computed, onMounted } from 'vue'
  import teamsData from '@/data/teams.json'
  import { useTournamentStore } from '@/stores/tournament'

  const store = useTournamentStore()

  const initialTeamsList = computed(() => {
    const data = teamsData as TeamSeedData
    return Object.entries(data)
      .map(([name, seed]) => ({ name, seed }))
      .toSorted((a, b) => a.seed - b.seed)
  })

  const sortedRoundMatches = computed(() => {
    return [...store.roundMatches].toSorted((a, b) => {
      // Sort by pool (higher record pools first)
      const aParts = a.pool.split('-').map(Number)
      const bParts = b.pool.split('-').map(Number)
      const aWins = aParts[0] ?? 0
      const aLosses = aParts[1] ?? 0
      const bWins = bParts[0] ?? 0
      const bLosses = bParts[1] ?? 0
      if (bWins !== aWins) return bWins - aWins
      return aLosses - bLosses
    })
  })

  function startTournament () {
    store.initializeTournament()
  }

  function selectWinner (matchId: string, winnerName: string) {
    store.setMatchWinner(matchId, winnerName)
  }

  function simulateRemainingMatches () {
    store.simulateRound()
  }

  function advanceToNextRound () {
    store.advanceRound()
  }

  function simulateEntireTournament () {
    store.simulateTournament()
  }

  function resetTournament () {
    store.resetTournament()
  }

  function getStatusColor (status: string): string {
    switch (status) {
      case 'advanced': { return 'success'
      }
      case 'eliminated': { return 'error'
      }
      default: { return 'primary'
      }
    }
  }

  function getStatusText (status: string): string {
    switch (status) {
      case 'advanced': { return 'Qualified'
      }
      case 'eliminated': { return 'Eliminated'
      }
      default: { return 'Active'
      }
    }
  }

  onMounted(() => {
    // Initialize with teams but don't start tournament yet
    const data = teamsData as TeamSeedData
    for (const [name, seed] of Object.entries(data)) {
      store.teams[name] = {
        name,
        seed,
        wins: 0,
        losses: 0,
        buchholz: 0,
        opponents: [],
        status: 'active',
      }
    }
  })
</script>

<style scoped>
.team-slot {
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.team-slot.clickable {
  cursor: pointer;
}

.team-slot.clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.team-slot.winner {
  background-color: rgba(var(--v-theme-success), 0.2);
  color: rgb(var(--v-theme-success));
}

.team-slot.loser {
  background-color: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
  opacity: 0.7;
}

.w-100 {
  width: 100%;
}
</style>

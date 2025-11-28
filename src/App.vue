<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>CS2 Major Swiss Simulator</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn 
        v-if="!tournamentState.is_started" 
        @click="start" 
        variant="elevated" 
        color="secondary"
      >
        Start Tournament
      </v-btn>
      <v-btn 
        v-else-if="!tournamentState.is_finished" 
        @click="nextRound" 
        :disabled="!canAdvance" 
        variant="elevated" 
        color="secondary"
      >
        Next Round
      </v-btn>
      <v-btn 
        v-if="tournamentState.is_started" 
        @click="reset" 
        color="error" 
        variant="text" 
        class="ml-2"
      >
        Reset
      </v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="fill-height align-start pa-0">
        <v-row no-gutters class="fill-height">
          <!-- Bracket Area -->
          <v-col cols="12" md="9" class="fill-height overflow-auto">
            <BracketView 
              v-if="rounds.length > 0"
              :rounds="rounds" 
              @select-winner="handleWinnerSelection"
            />
            <div v-else class="d-flex justify-center align-center fill-height text-grey">
              Click Start to begin the tournament
            </div>
          </v-col>

          <!-- Sidebar Standings -->
          <v-col cols="12" md="3" class="border-s fill-height bg-white overflow-y-auto">
             <v-card flat>
               <v-card-title>Standings</v-card-title>
               
               <!-- Qualified -->
               <v-list density="compact">
                 <v-list-subheader class="text-success font-weight-bold">
                   Qualified (3-X) - {{ qualifiedTeams.length }}
                 </v-list-subheader>
                 <v-list-item v-for="team in qualifiedTeams" :key="team.id">
                    <template v-slot:prepend>
                      <v-chip size="x-small" color="success" class="mr-2">{{ team.initial_seed }}</v-chip>
                    </template>
                    <v-list-item-title>{{ team.name }}</v-list-item-title>
                    <v-list-item-subtitle>Buchholz: {{ team.buchholz_score }}</v-list-item-subtitle>
                 </v-list-item>
                 
                 <v-divider class="my-2"></v-divider>
                 
                 <!-- Active -->
                 <v-list-subheader class="text-primary font-weight-bold">
                   Active - {{ activeTeams.length }}
                 </v-list-subheader>
                 <v-list-item v-for="team in activeTeams" :key="team.id">
                    <template v-slot:prepend>
                      <v-chip size="x-small" class="mr-2">{{ team.initial_seed }}</v-chip>
                    </template>
                    <v-list-item-title>{{ team.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Record: {{ team.wins }}-{{ team.losses }} | Buchholz: {{ team.buchholz_score }}
                    </v-list-item-subtitle>
                 </v-list-item>

                 <v-divider class="my-2"></v-divider>
                 
                 <!-- Eliminated -->
                 <v-list-subheader class="text-error font-weight-bold">
                   Eliminated (X-3) - {{ eliminatedTeams.length }}
                 </v-list-subheader>
                 <v-list-item v-for="team in eliminatedTeams" :key="team.id">
                    <template v-slot:prepend>
                      <v-chip size="x-small" color="error" class="mr-2">{{ team.initial_seed }}</v-chip>
                    </template>
                    <v-list-item-title>{{ team.name }}</v-list-item-title>
                    <v-list-item-subtitle>Record: {{ team.wins }}-{{ team.losses }}</v-list-item-subtitle>
                 </v-list-item>
               </v-list>
             </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TournamentState, Match } from './types';
import { initializeTournament, generatePairings, advanceRound } from './utils/swiss';
import BracketView from './components/BracketView.vue';

// State
const tournamentState = ref<TournamentState>(initializeTournament());
const rounds = ref<Match[][]>([]);

// Computed Properties for Standings
const qualifiedTeams = computed(() => 
  tournamentState.value.teams
    .filter(t => t.status === 'qualified')
    .sort((a, b) => b.buchholz_score - a.buchholz_score)
);

const eliminatedTeams = computed(() => 
  tournamentState.value.teams
    .filter(t => t.status === 'eliminated')
    .sort((a, b) => b.wins - a.wins)
);

const activeTeams = computed(() => 
  tournamentState.value.teams
    .filter(t => t.status === 'active')
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.buchholz_score !== a.buchholz_score) return b.buchholz_score - a.buchholz_score;
      return a.initial_seed - b.initial_seed;
    })
);

const canAdvance = computed(() => {
  if (!tournamentState.value.is_started || tournamentState.value.is_finished) return false;
  const currentMatches = rounds.value[rounds.value.length - 1];
  return !!currentMatches && currentMatches.every(m => m.winner_id !== null);
});

// Actions
function start() {
  tournamentState.value = initializeTournament();
  tournamentState.value.is_started = true;
  
  // Generate Round 1
  const r1Matches = generatePairings(tournamentState.value);
  tournamentState.value.matches = r1Matches;
  rounds.value = [r1Matches];
}

function nextRound() {
  if (!canAdvance.value) return;

  try {
    // Advance state
    const newState = advanceRound(tournamentState.value);
    tournamentState.value = newState;
    
    if (!newState.is_finished && newState.matches.length > 0) {
      rounds.value.push(newState.matches);
    }
  } catch (e) {
    console.error(e);
    alert((e as Error).message);
  }
}

function reset() {
  tournamentState.value = initializeTournament();
  rounds.value = [];
}

function handleWinnerSelection(matchId: string, winnerId: string) {
  const currentRoundMatches = rounds.value[rounds.value.length - 1];
  if (!currentRoundMatches) return;
  const match = currentRoundMatches.find(m => m.id === matchId);
  if (match) {
    match.winner_id = winnerId;
  }
}
</script>

<style>
html, body {
  overflow: hidden; 
}
</style>

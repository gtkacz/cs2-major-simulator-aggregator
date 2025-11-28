<template>
  <v-card class="mb-2" variant="outlined" density="compact">
    <v-card-text>
      <div class="d-flex flex-column gap-2">
        <v-btn 
          class="justify-start"
          :color="match.winner_id === match.team1.id ? 'success' : undefined"
          :variant="match.winner_id === match.team1.id ? 'flat' : 'text'"
          @click="selectWinner(match.team1.id)"
          block
          size="small"
        >
          <span class="text-truncate">{{ match.team1.name }}</span>
          <v-spacer></v-spacer>
          <span class="text-caption ml-1">({{ match.team1.wins }}-{{ match.team1.losses }})</span>
        </v-btn>
        
        <div class="text-center text-caption text-disabled my-1">VS</div>
        
        <v-btn 
          class="justify-start"
          :color="match.winner_id === match.team2.id ? 'success' : undefined"
          :variant="match.winner_id === match.team2.id ? 'flat' : 'text'"
          @click="selectWinner(match.team2.id)"
          block
          size="small"
        >
          <span class="text-truncate">{{ match.team2.name }}</span>
          <v-spacer></v-spacer>
          <span class="text-caption ml-1">({{ match.team2.wins }}-{{ match.team2.losses }})</span>
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Match } from '../types';

const props = defineProps<{ match: Match }>();
const emit = defineEmits<{ (e: 'select-winner', matchId: string, winnerId: string): void }>();

function selectWinner(winnerId: string) {
  emit('select-winner', props.match.id, winnerId);
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>

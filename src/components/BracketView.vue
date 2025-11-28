<template>
  <div class="d-flex flex-row overflow-x-auto fill-height pa-4 bracket-container">
    <div 
      v-for="(roundMatches, index) in rounds" 
      :key="index" 
      class="round-column mr-4 flex-shrink-0"
      style="width: 250px;"
    >
      <h3 class="text-h6 text-center mb-4 font-weight-bold">Round {{ index + 1 }}</h3>
      <div v-for="match in roundMatches" :key="match.id">
        <MatchCard 
          :match="match" 
          @select-winner="(mId, wId) => $emit('select-winner', mId, wId)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Match } from '../types';
import MatchCard from './MatchCard.vue';

defineProps<{ rounds: Match[][] }>();
defineEmits<{ (e: 'select-winner', matchId: string, winnerId: string): void }>();
</script>

<style scoped>
.bracket-container {
  min-height: 600px;
}
</style>

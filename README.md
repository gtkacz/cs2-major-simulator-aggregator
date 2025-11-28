# CS2 Major Swiss Tournament Simulator

A Vue 3/Vuetify/TypeScript application that simulates a Swiss tournament using the Buchholz system, as used in CS2 Major Championships.

## Features

- **Swiss System**: Teams are paired based on their current record (wins-losses)
- **Buchholz Tiebreaker**: Teams are ranked by the sum of their opponents' wins
- **3 Wins to Advance**: Teams qualifying for playoffs after 3 victories
- **3 Losses to Eliminate**: Teams are eliminated after 3 defeats
- **Interactive Match Selection**: Click on a team to select them as the winner
- **Auto Simulation**: Simulate matches, rounds, or the entire tournament
- **Real-time Standings**: Live updates of team standings and status

## How the Swiss/Buchholz System Works

1. **Round 1**: All teams start 0-0 and are paired based on seed
2. **Subsequent Rounds**: Teams are grouped by their record (e.g., 1-0, 0-1, 2-0, 1-1, etc.)
3. **Pairing within pools**: Teams are matched against opponents with the same record
4. **Buchholz Score**: Calculated as the sum of all opponents' wins - used for tiebreaking
5. **Advancement**: Win 3 matches to advance to playoffs
6. **Elimination**: Lose 3 matches to be eliminated

## Team Data

Teams are loaded from `src/data/teams.json` in the format:
```json
{
  "Team Name": seed_number
}
```

## Tech Stack

- **Vue 3** - Progressive JavaScript Framework
- **Vuetify 3** - Material Design Component Framework
- **TypeScript** - Type-safe JavaScript
- **Pinia** - State Management
- **Vite** - Build Tool
- **pnpm** - Fast, disk space efficient package manager

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Usage

1. Click **Start Tournament** to begin
2. For each match, either:
   - Click on a team to manually select them as the winner
   - Use **Simulate Remaining Matches** to auto-complete the round
3. When all matches in a round are complete, click **Advance to Next Round**
4. Use **Simulate Entire Tournament** to complete all remaining matches automatically
5. **Reset** to start over with a fresh tournament

## License

MIT

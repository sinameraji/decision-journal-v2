# Decision Journal

A macOS desktop app that helps you make better decisions by tracking them over time. Built with the [Farnam Street decision-making methodology](https://fs.blog/decision-journal/) in mind.

## What is this?

Ever made a decision and wondered later why it seemed like such a good idea at the time? This app helps you document your decisions in the moment—what you were thinking, how you felt, what alternatives you considered—and then review them later to learn from the outcomes.

It's basically a diary for your choices, with an AI assistant to help you think things through.

## Features

- **Local-first**: All your data stays on your machine. Uses SQLite for storage, no cloud required.
- **AI coaching**: Integrates with [Ollama](https://ollama.com) to run local LLMs that can help you think through decisions (no data sent to external servers).
- **Review scheduling**: Automatically reminds you to check back on decisions after 1 week, 1 month, 3 months, and 1 year.
- **Decision framework**: Prompts you to capture the stuff that matters—your mental state, emotional flags, alternatives, pros/cons, confidence level, and predicted outcomes.
- **Export**: Get your decisions out as JSON, PDF, or ZIP archives.
- **Search & analytics**: Filter decisions by outcome, review status, or date range. See patterns in your decision-making over time.

## Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router, Zustand, Radix UI, Tailwind CSS
- **Backend**: Rust/Tauri v2 for the native desktop shell
- **Database**: SQLite (via Tauri plugin)
- **AI**: Local Ollama integration (default model: gemma3:1b)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Rust (for building Tauri apps)
- [Ollama](https://ollama.com) (optional, for AI features)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/decision-journal.git
cd decision-journal/v2

# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Using with Ollama

If you want the AI coaching features:

1. Install Ollama from [ollama.com](https://ollama.com)
2. Pull a model: `ollama pull gemma3:1b`
3. Make sure Ollama is running (it should start automatically)
4. The app will detect it and enable AI features

## Project Structure

Check out [CLAUDE.md](./CLAUDE.md) for detailed architecture docs and development guidance.

Key directories:
- `src/` - React frontend code
- `src-tauri/` - Rust backend code
- `src/components/` - UI components
- `src/services/` - Database, LLM, and export services
- `src/store/` - Zustand state management

## Development Commands

```bash
npm run dev              # Frontend dev server only
npm run tauri:dev        # Full Tauri app in dev mode
npm run build            # Build frontend
npm run tauri:build      # Build production app
npm run lint             # Run ESLint
```

## Contributing

This is a personal project, but if you find bugs or have ideas, feel free to open an issue or PR.

## License

MIT - See [LICENSE](./LICENSE) for details.

## Inspiration

This project is inspired by the decision journal methodology from Farnam Street. If you're interested in better decision-making, check out their [Decision Journal guide](https://fs.blog/decision-journal/).

## Why I Built This

I've always cared to optimize my decisions, since our life quality is a function of the quality of the decisions we make, the quality of the outcomes of those decisions, and luck. Some life/work questions are extremely consequential and not super easy to make, and the best we can do is make them given the best information/resources at hand, and come back and review them in the future to learn whether we did a good job or not. and hopefully make more good decisions and make less bad decisions in the long run.

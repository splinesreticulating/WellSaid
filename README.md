<h1 align="center">WellSaid</h1>
<p align="center"><b>Empathy. Upgraded.</b></p>

WellSaid is an empathy-focused communication tool that helps you craft better responses by providing conversation summaries and tone-based reply suggestions. With a clean, modern UI and straightforward experience, WellSaid helps improve your communication with meaningful, contextually appropriate responses.

## Features

- **Conversation Summaries**: Analyze your Messages app conversations with a partner from the last 1-24 hours
- **Smart Reply Suggestions**: Get AI-generated reply options based on conversation context
- **Tone Selection**: Choose from five different tones for your replies:
  - Gentle 
  - Honest 
  - Funny 
  - Reassuring 
  - Concise 
- **Context Addition**: Add additional context to help generate more relevant replies
- **Message Database Integration**: Connects to your macOS Messages app database
- **Real-time Updates**: Dynamic UI with loading indicators and real-time feedback

## Getting Started

### Prerequisites

- macOS (required for Messages database access)
- Node.js 18+ and Yarn
- OpenAI API key for generating suggestions

**Note**: This application is designed to run exclusively on macOS as it requires direct access to the Messages app database.

### Installation

1. Clone the repository

```bash
git clone https://github.com/splinesreticulating/WellSaid.git
cd WellSaid
```

2. Install dependencies

```bash
yarn
```

3. Configure environment variables

Create a `.env` file in the root directory with the following variables:

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4  # or any other OpenAI model
OPENAI_TEMPERATURE=0.5
PARTNER_PHONE=+1234567890  # Your partner's phone number in the Messages app
```

4. Start the development server

```bash
yarn dev
```

## Usage

1. Select a time frame to analyze (1-24 hours)
2. Click the "go" button to generate a conversation summary
3. Review the summary of your recent conversation
4. Choose a tone for suggested replies
5. View and copy suggested replies to use in your conversation

## How It Works

WellSaid connects to your macOS Messages database to fetch your conversations with a specific contact (set via the `PARTNER_PHONE` environment variable). It then uses OpenAI's API to analyze the conversation and generate:

1. A summary of the conversation, including emotional tone and key topics
2. Three suggested replies in your chosen tone

## Technical Details

- **Frontend**: Svelte 5 with SvelteKit
- **State Management**: Svelte's built-in $state system
- **Styling**: Custom CSS with variables for theming
- **Database**: SQLite (connecting to macOS Messages database)
- **AI Integration**: OpenAI API (GPT-4 or other models)
- **Logging**: Pino for structured logging

## Development and Local Usage

```bash
# Run in development mode with hot-reloading
yarn dev

# Lint code
yarn lint

# Format code
yarn format

# Build optimized version
yarn build

# Run the optimized build locally
yarn preview

# Run tests
yarn test

# Run tests with watch mode
yarn test:watch

# Run tests with coverage report
yarn test:coverage
```

**Note**: Since this application only runs on macOS and accesses local system resources, there is no traditional "production deployment" - the built version is simply run locally on your macbook. The `yarn build` and `yarn preview` commands create and run an optimized version that may provide better performance than development mode.

## Accessing WellSaid from Anywhere

If you'd like to securely access **WellSaid** remotely, consider using [Tailscale](https://tailscale.com). Tailscale sets up a secure private network (a mesh VPN) that connects your devices, making it simple and safe to access your app.

To enable this, set the `ALLOWED_HOST` variable in your `.env` file to the domain provided by Tailscale (e.g., `yourhost.tailabe386.ts.net`).

For more details, visit [Tailscale's documentation](https://tailscale.com/kb/).

## Privacy and Security Considerations

- All conversation analysis happens through OpenAI's API, so your data is subject to their privacy policy

## Troubleshooting

### Common Issues

- **Messages Not Loading**: Ensure you've set the correct `PARTNER_PHONE` in your `.env` file
- **Permission Issues**: WellSaid needs access to your Messages database. Make sure Terminal/your editor has Full Disk Access in System Preferences > Security & Privacy
- **OpenAI API Errors**: Check that your API key is valid and you have sufficient credits
- **No Partner Messages**: The app will only show conversations where your partner has responded

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Svelte](https://svelte.dev/) - The web framework used
- [OpenAI](https://openai.com/) - AI model provider
- [SQLite](https://sqlite.org/) - Database engine


## Box Covers

<p align="center" style="display: flex; gap: 20px; justify-content: center;">
  <img src="./assets/box-art-front.png" alt="WellSaid Front Cover" width="45%" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3); border-radius: 8px;"/>
  <img src="./assets/box-art-back.png" alt="WellSaid Back Cover" width="45%" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3); border-radius: 8px;"/>
</p>

---

# Well Said

Well Said is an empathy-focused communication tool built with Svelte 5 that helps you craft better responses by providing conversation summaries and tone-based reply suggestions.

![Well Said - Empathy. Upgraded.](https://i.imgur.com/placeholder.png)

## 🌟 Features

- **Conversation Summaries**: Analyze your Messages app conversations with a partner from the last 1-24 hours
- **Smart Reply Suggestions**: Get AI-generated reply options based on conversation context
- **Tone Selection**: Choose from five different tones for your replies:
  - Gentle 🍃
  - Honest 💯
  - Funny 😂
  - Reassuring 🤗
  - Concise ✓
- **Context Addition**: Add additional context to help generate more relevant replies
- **Message Database Integration**: Connects to your macOS Messages app database
- **Real-time Updates**: Dynamic UI with loading indicators and real-time feedback

## 🚀 Getting Started

### Prerequisites

- macOS (required for Messages database access)
- Node.js 18+ and Yarn
- OpenAI API key for generating suggestions

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/well-said.git
cd well-said
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

## 💻 Usage

1. Select a time frame to analyze (1-24 hours)
2. Click the "go" button to generate a conversation summary
3. Review the summary of your recent conversation
4. Choose a tone for suggested replies
5. View and copy suggested replies to use in your conversation

## 🧠 How It Works

Well Said connects to your macOS Messages database to fetch your conversations with a specific contact (set via the `PARTNER_PHONE` environment variable). It then uses OpenAI's API to analyze the conversation and generate:

1. A summary of the conversation, including emotional tone and key topics
2. Three suggested replies in your chosen tone

## 🔧 Technical Details

- **Frontend**: Svelte 5 with SvelteKit
- **State Management**: Svelte's built-in $state system
- **Styling**: Custom CSS with variables for theming
- **Database**: SQLite (connecting to macOS Messages database)
- **AI Integration**: OpenAI API (GPT-4 or other models)

## 🛠️ Development

```bash
# Lint code
yarn lint

# Format code
yarn format

# Build for production
yarn build

# Preview production build
yarn preview
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Svelte](https://svelte.dev/) - The web framework used
- [OpenAI](https://openai.com/) - AI model provider
- [SQLite](https://sqlite.org/) - Database engine

---

**Note**: This application requires access to your Messages database. Make sure you understand the privacy implications before using it.

<h1><img src="static/apple-touch-icon.png" alt="WellSaid Logo" width="60" height="60"> WellSaid</h1>
<h3>Empathy. Upgraded.</h3>

WellSaid is an empathy-focused communication tool that helps you craft better responses by providing conversation summaries and tone-based suggestions. It enhances your communication, and by extension your life, with meaningful, contextually appropriate replies.

## Features

- **Conversation Summaries**: Analyze your Messages app conversations with a partner from the last 1-24 hours
- **Smart Reply Suggestions**: Get AI-generated reply options (via OpenAI or a local Khoj server) based on conversation context
- **Tone Selection**: Choose from four different tones for your replies:
  - Gentle 
  - Funny 
  - Reassuring 
  - Concise 
- **Context Addition**: Add additional context to help generate more relevant replies
- **Message Database Integration**: Connects to your macOS Messages app database
- **Real-time Updates**: Dynamic UI with loading indicators and real-time feedback

## Getting Started

### Requirements

- iMessages database access -- designed to run from a Mac logged into your iCloud
- OpenAI API key (if using OpenAI) or a running local Khoj instance (if using Khoj)

### Obtaining an OpenAI API Key

To use WellSaid with OpenAI's models, you'll need an API key. Here's how to get one:

1. **Sign up for an account**
   - Go to [OpenAI's website](https://platform.openai.com/signup)
   - Create an account or sign in if you already have one

2. **Access the API key section**
   - After logging in, click on your profile icon in the top-right corner
   - Select "View API keys" from the dropdown menu

3. **Create a new secret key**
   - Click on "Create new secret key"
   - Give your key a name (e.g., "WellSaid Development")
   - Click "Create secret key"
   - **Important**: Copy the key immediately - you won't be able to see it again!

4. **Add the key to your environment**
   - Paste the key as the value for `OPENAI_API_KEY` in your `.env` file

**Note**: OpenAI API usage is not free. You'll be charged based on the number of tokens processed. Check [OpenAI's pricing page](https://openai.com/pricing) for current rates.

### Installation

1. Clone the repository

```bash
git clone https://github.com/splinesreticulating/WellSaid.git
cd WellSaid
```

2. Install dependencies

```bash
yarn install
```

3. Generate SvelteKit types (required for testing)

```bash
yarn prepare
```

4. Configure environment variables

Create a `.env` file in the root directory by copying the `.env.example` file (`cp .env.example .env`) and then update the values. The following variables are needed:

```
# --- AI Provider Configuration ---
# OpenAI (Default)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4  # or any other OpenAI model
OPENAI_TEMPERATURE=0.5
OPENAI_TOP_P=
OPENAI_FREQUENCY_PENALTY=
OPENAI_PRESENCE_PENALTY=

The following optional variables help shape the tone of the AI's replies:

- `OPENAI_TOP_P` – lets the responses be a little more adventurous
- `OPENAI_FREQUENCY_PENALTY` – keeps the suggestions from repeating themselves
- `OPENAI_PRESENCE_PENALTY` – nudges the AI to bring up fresh ideas

# Local Khoj Server
# If you happen to have a local Khoj server, set these variables.
KHOJ_API_URL=http://127.0.0.1:42110/api/chat # Your Khoj server API URL
KHOJ_AGENT=your_khoj_agent_name          # The Khoj agent to use

# --- General Configuration ---
PARTNER_PHONE=+1234567890  # Your partner's phone number in the Messages app

# --- Authentication (CRITICAL for security) ---
BASIC_AUTH_USERNAME=your_username
BASIC_AUTH_PASSWORD=your_strong_password
JWT_SECRET=your_super_strong_random_jwt_secret # See note on JWT_SECRET generation below

# --- Optional Settings ---
# Logging level (info, debug, warn, error)
LOG_LEVEL=info

# For remote access via Tailscale (see 'Accessing from Anywhere' section)
ALLOWED_HOST=your-tailscale-hostname.your-tailscale-domain.ts.net
```

**Important Note on `JWT_SECRET`**: 
The `JWT_SECRET` is critical for securing your application's authentication. It should be a long, random, and unpredictable string. **Do not use a weak or easily guessable secret.**

You can generate a strong secret using OpenSSL with the following command in your terminal:

```bash
openssl rand -base64 64
```
Copy the output of this command and use it as the value for `JWT_SECRET` in your `.env` file. Ensure it's on a single line.

4. Start the development server

```bash
yarn dev
```

## Usage

1. Select a time frame to analyze (1-24 hours)
1. Choose a tone for suggested replies
1. Click the "go" button to generate a conversation summary
1. Review the summary of your recent conversation
1. View and copy suggested replies to use in your conversation

## How It Works

WellSaid connects to your macOS Messages database to fetch your conversations with a specific contact (set via the `PARTNER_PHONE` environment variable). It then uses an AI provider (OpenAI's API by default, or a configured local Khoj server if `KHOJ_API_URL` is set) to analyze the conversation and generate:

1. A summary of the conversation, including emotional tone and key topics
1. Three suggested replies in your chosen tone

## Technical Details

- **Frontend**: Svelte 5 with SvelteKit
- **State Management**: Svelte's built-in $state system
- **Styling**: Custom CSS with variables for theming
- **Database**: SQLite (connecting to macOS Messages database)
- **AI Integration**: OpenAI API (GPT-4 or other models) or a local Khoj server
- **Logging**: Pino for structured logging

## Development and Local Usage

```bash
# Install dependencies first
yarn install
yarn prepare

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

## Accessing from Anywhere

If you'd like to securely access WellSaid remotely, consider using a service like [Tailscale](https://tailscale.com). Tailscale sets up a secure private network (a mesh VPN) that connects your devices, making it simple and safe to access your app.

All that's required in the app is that you set the `ALLOWED_HOST` variable in your `.env` file to the address provided by Tailscale.

For more details, visit [Tailscale's documentation](https://tailscale.com/kb/).

### iOS Home Screen Icons (and HTTPS Gotchas)

To make your WellSaid app look great when saved to your iPhone's Home Screen, iOS requires a **valid HTTPS certificate**:

1. **Install mkcert (if not already installed)**

```bash
brew install mkcert
mkcert -install
```

2. **Generate a local trusted cert and run your app with HTTPS**

```bash
mkcert <your-tailscale-hostname>.<tailscale-subdomain>.ts.net localhost
```
This will create a cert/key pair like `rootCA.pem` and `rootCA-key.pem`.

3. **Trust the cert on your iPhone**

- Convert the root CA to iOS-compatible format:
```bash
openssl x509 -inform PEM -in "$(mkcert -CAROOT)/rootCA.pem" -outform DER -out mkcert-rootCA.cer
```

- AirDrop or email the `mkcert-rootCA.cer` file to your iPhone
- Open it, then go to:
  - **Settings → General → VPN & Device Management → Install Profile**
  - **Settings → General → About → Certificate Trust Settings → Enable full trust** for mkcert root

Now when you visit your app over HTTPS (via Safari), iOS will trust the cert, and your manifest and icon will load properly — giving your app a real custom icon when added to the Home Screen.

## Privacy and Security Considerations

- All conversation analysis happens through OpenAI's API, so your data is subject to their privacy policy

## Troubleshooting

### Common Issues

- **Messages Not Loading**: Ensure you've set the correct `PARTNER_PHONE` in your `.env` file
- **Permission Issues**: WellSaid needs access to your Messages database. Make sure Terminal/your editor has Full Disk Access in System Preferences > Security & Privacy
- **OpenAI API Errors**: Check that your API key is valid and you have sufficient credits
- **No Partner Messages**: The app will only show conversations where your partner has responded

## Acknowledgements

- [Svelte](https://svelte.dev/) - The web framework used
- [OpenAI](https://openai.com/) - AI model provider
- [Khoj](https://khoj.dev/) - Alternative local AI model provider and search
- [SQLite](https://sqlite.org/) - Database engine
- [Tailscale](https://tailscale.com/) - For making secure remote access easy
- [Apple](https://www.apple.com/) - For not securing the iMessages database

## Box Art

<p align="center" style="display: flex; gap: 20px; justify-content: center;">
  <img src="./box-art/front.png" alt="WellSaid Front Cover" width="45%" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3); border-radius: 8px;"/>
  <img src="./box-art/back.png" alt="WellSaid Back Cover" width="45%" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3); border-radius: 8px;"/>
</p>

## License

This project is licensed under the MIT License - see the LICENSE file for details.

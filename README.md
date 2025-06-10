<h1><img src="static/apple-touch-icon.png" alt="WellSaid Logo" width="60" height="60"> WellSaid</h1>
<h3>Empathy. Upgraded.</h3>

WellSaid helps you communicate with more empathy and clarity by offering conversation summaries and tone-based reply suggestions.

## Features

- **Conversation Summaries**: Analyze your Messages app conversations with a partner from the last 1-24 hours
- **Smart Reply Suggestions**: Get short, medium, and long AI-generated reply options based on recent and and historical conversation context
- **Tone Selection**: Set the tone for your replies with (eg: gentle, funny, reassuring, concise)
- **Context Addition**: Add additional context to help generate more relevant replies
- **Message Database Integration**: Connects to your macOS Messages app database

## Getting Started

### Requirements

- iMessages database access -- designed to run from a Mac logged into your iCloud
- OpenAI API key
- (optional) Local [Khoj](https://khoj.dev/) instance, for a second opinion

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

- **Customization**
    - `PARTNER_PHONE`: Your partner's phone number in the Messages app
    - `HISTORY_LOOKBACK_HOURS`: How many hours of prior conversation history to search for extra context
    - `CUSTOM_CONTEXT`: To guide the AI's personality and behavior (Example: "Act as my therapist suggesting replies to my partner" or "You are a helpful assistant")

- **Open AI**
    - `OPENAI_API_KEY`: Your OpenAI API key
    - `OPENAI_MODEL`: gpt-4 or any other OpenAI model
    - `OPENAI_TEMPERATURE`: Controls the randomness of the responses
    - `OPENAI_TOP_P`: Lets the responses be a little more adventurous
    - `OPENAI_FREQUENCY_PENALTY`: Keeps the suggestions from repeating themselves
    - `OPENAI_PRESENCE_PENALTY`: Nudges the AI to bring up fresh ideas

- **Khoj**
    - `KHOJ_API_URL`: Your khoj server API URL if you have one
    - `KHOJ_AGENT`: The khoj agent to use if you have one

- **Logging**
    - `LOG_LEVEL`: Logging level (info, debug, warn, error)

- **Remote Access**
    - `ALLOWED_HOST`: For remote access via Tailscale (see 'Accessing from Anywhere' section)

- **Security**
    - `BASIC_AUTH_USERNAME`: Your username
    - `BASIC_AUTH_PASSWORD`: Your password
    - `JWT_SECRET`: Should be a long, random, and unpredictable string. 
    You can generate one using OpenSSL with the following command in your terminal:
    ```bash
    openssl rand -base64 64
    ```
    - Copy the output of this command and use it as the value for `JWT_SECRET` in your `.env` file. Ensure it's on a single line.

5. Start the development server

```bash
yarn dev
```

## Usage

1. Select a time frame to analyze
1. Choose a tone for the reply suggestions 
1. Click "go" to generate a conversation summary and some suggested replies of varying length
1. Copy and paste a suggested reply into your conversation

## How It Works

WellSaid connects to your macOS Messages database to fetch your conversations with a specific contact (set via the `PARTNER_PHONE` environment variable). It then uses an AI provider (OpenAI's API by default) to analyze the conversation and generate:

1. A summary of the conversation, including emotional tone and key topics
1. Three suggested replies (short, medium, and long) in your chosen tone

## Technical Details

- **Frontend**: Svelte 5 with SvelteKit
- **State Management**: Svelte's built-in $state system
- **Styling**: Custom CSS with variables for theming
- **Database**: SQLite (connecting to macOS Messages database)
- **AI Integration**: OpenAI API (GPT-4 or other models) plus optional local [Khoj](https://khoj.dev/) server
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

**Note**: Since this application only runs on macOS and accesses local system resources, there is no traditional "production deployment" - the built version is simply run locally on your Mac. The `yarn build` and `yarn preview` commands create and run an optimized version that may provide better performance than development mode.

## Accessing from Anywhere

If you'd like to securely access WellSaid remotely, consider using a service like [Tailscale](https://tailscale.com) to set up a secure private network that connects your devices.

All that's required in the app is that you set the `ALLOWED_HOST` variable in your `.env` file to the address provided by Tailscale. For more details, visit [Tailscale's documentation](https://tailscale.com/kb/).

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

- All conversation analysis happens through OpenAI's API, so your data is subject to their privacy policy.

## Troubleshooting

### Common Issues

- **Messages Not Loading**: Ensure you've set the correct `PARTNER_PHONE` in your `.env` file
- **Permission Issues**: WellSaid needs access to your Messages database. Make sure Terminal/your editor has Full Disk Access in System Preferences > Security & Privacy
- **No Partner Messages**: The app will only show conversations where your partner has responded

## Acknowledgements

- [Svelte](https://svelte.dev/) - The web framework used
- [OpenAI](https://openai.com/) - AI model provider
- [Khoj](https://khoj.dev/) - Alternative local AI model provider and search
- [SQLite](https://sqlite.org/) - Database engine
- [Tailscale](https://tailscale.com/) - For making secure remote access easy

## Box Art

<p align="center" style="display: flex; gap: 20px; justify-content: center;">
  <img src="./box-art/front.png" alt="WellSaid Front Cover" width="45%" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3); border-radius: 8px;"/>
  <img src="./box-art/back.png" alt="WellSaid Back Cover" width="45%" style="box-shadow: 0 4px 8px rgba(0,0,0,0.3); border-radius: 8px;"/>
</p>

## License

This project is licensed under the MIT License - see the LICENSE file for details.

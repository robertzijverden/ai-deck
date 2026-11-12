# AI Deck privacy

AI Deck is a local Stream Deck plug-in by KeyPilot Labs. There is no KeyPilot server, analytics, advertising, or telemetry.

- Basic actions open the selected service in its desktop app or your default browser. Sign in through that service normally.
- Usage connectors are opt-in per key. When enabled, they read the existing official Claude Code, Codex CLI or GitHub CLI login on your computer. Credentials are only sent to the relevant provider's own endpoint. They are not copied into Stream Deck settings, exported, logged or uploaded to GitHub.
- The experimental connectors use internal endpoints, which can change. Claude may refresh its OAuth token in memory. No inference request is made and no paid API key is required.
- Text prompts, themes, manual percentages and optional custom images are stored in your Stream Deck profile. Profile exports can contain them. Do not put passwords or other secrets in prompt presets.
- Copy Prompt replaces your clipboard when you press the button. It never submits a message.
- Close requests a normal window close for the selected desktop process. It does not force termination or close browser processes.
- Disable "Verbruik koppelen" or remove usage keys to stop fetching. Sign out through the official service to revoke its login. Removing this plug-in does not sign you out of the provider.
- Issue reports are public on GitHub. Do not attach credential files, private prompts or unreviewed logs.

Support: https://github.com/robertzijverden/ai-deck/issues

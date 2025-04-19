# LeetCode AI Assistant Chrome Extension

A powerful Chrome extension that helps you solve LeetCode problems using AI models like OpenAI, Google Gemini.

![LeetCode AI Assistant](assets/icon128.png)

## Features

- **Multiple AI Models**: Choose between OpenAI, Google Gemini, for different problem-solving approaches
- **Various Assistance Types**: Get hints, approaches, full solutions, or code optimization
- **Code Debugging**: Get help debugging your code when it doesn't work
- **Error Explanation**: Understand compilation and runtime errors
- **Beautiful Markdown Rendering**: AI responses are rendered in beautiful markdown format
- **One-Click Code Copy**: Copy code solutions with a single click
- **Code Insertion**: Insert AI-generated code directly into the LeetCode editor
- **Problem Analysis**: Extract and analyze problem details automatically

## Installation

### From Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (link will be updated when published)
2. Search for "LeetCode AI Assistant"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now be installed and visible in your Chrome toolbar

## Setup

1. Click on the extension icon in your Chrome toolbar
2. Enter your API key for your preferred AI provider:
   - For OpenAI: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - For Google Gemini: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - For Claude: Get your API key from [Anthropic Console](https://console.anthropic.com/)
3. Save your settings

## How to Use

1. Navigate to a LeetCode problem page
2. Click the extension icon to open the popup
3. Select your preferred AI provider and assistance type
4. Click one of the action buttons:
   - **Get Help**: Get assistance based on the selected type
   - **Optimize My Code**: Optimize your current code
   - **Debug My Code**: Help fix issues in your code
   - **Explain Error**: Understand compilation or runtime errors
5. The AI response will be displayed with proper markdown formatting
6. Use the copy button to copy code snippets with one click
7. Click "Insert Code to Editor" to automatically insert the solution into the LeetCode editor

## Assistance Types

- **Hint**: Get a subtle hint without revealing the full solution
- **Approach**: Get a detailed explanation of the approach without code
- **Solution**: Get a complete solution with code
- **Optimize**: Get help optimizing your existing code
- **Explain**: Get a simple explanation of the problem

## API Configuration

### OpenAI

- Uses GPT-4 Turbo model by default
- Requires an OpenAI API key

### Google Gemini

- Uses Gemini Pro model by default
- Requires a Google AI Studio API key

### Claude

- Uses Claude Sonnet model by default
- Requires an Anthropic API key

## Privacy

This extension:

- Does not collect or store your code or problem data on any server
- Only sends data to the AI provider you choose when you explicitly request help
- Stores your API key locally in your browser's storage
- Does not track your browsing activity

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Developer

**Rahees Ahmed**

- GitHub: [RaheesAhmed](https://github.com/RaheesAhmed/LeetCode-AI-Assistant.git)
- Portfolio: [raheesahmed.vercel.app](https://raheesahmed.vercel.app)
- LinkedIn: [raheesahmed](https://www.linkedin.com/in/raheesahmed/)

## Disclaimer

This extension is not affiliated with, maintained, authorized, endorsed, or sponsored by LeetCode or any of its affiliates or subsidiaries.

---

Made with ❤️ for the coding community

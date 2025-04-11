# 🔗 LinkedGist

**LinkedGist** is a browser extension that enriches LinkedIn posts by summarizing their core ideas, explaining complex terms, and providing contextual insights — all powered by an LLM (OpenAI API Compatibility).

## 🚀 What it does

When a user clicks on any LinkedIn post, a button appears allowing them to generate a smart summary. Behind the scenes, the content is sent to a language model that returns:

- A concise and contextualized **summary**
- Clear **explanations** of technical terms (if any)
- Relevant **background information** or connections to related topics
- Suggestions for **further exploration**

All responses are returned in the selected language.

## 🛠️ Installation (Development)

```bash
git clone https://github.com/prodesk98/LinkedGist.git
cd LinkedGist
```

1. Load the extension into your browser:
    - Extract the project folder
    - Go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked" and select the project folder

2. Go options page and enter your OpenAI API key.

## 📦 Project Structure

```
LinkedGist/
│
├── manifest.json     # Extension config
├── content.js        # Injects the button into LinkedIn posts
└── styles.css        # Styling for the injected UI
```

## 🧪 Roadmap

- [x] Inject button into LinkedIn post
- [x] Send content to OpenAI API Compatibility
- [x] Display enriched summary in a styled popup
- [x] Add options page for API key config
- [ ] Add support for Firefox
- [ ] Highlight keywords or terms in original post

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
document.addEventListener('DOMContentLoaded', () => {
  const systemPromptInput = document.getElementById('systemPrompt');
  const apiKeyInput = document.getElementById('apiKey');
  const baseUrlInput = document.getElementById('baseUrl');
  const modelNameInput = document.getElementById('modelName');
  const languageInput = document.getElementById('language');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  chrome.storage.sync.get(['systemPromptInput', 'apiKey', 'baseUrl', 'modelName', 'language'], (result) => {
    if (result.systemPromptInput) {
      systemPromptInput.value = result.systemPromptInput;
    }
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.baseUrl) {
      baseUrlInput.value = result.baseUrl;
    }
    if (result.modelName) {
      modelNameInput.value = result.modelName;
    }
    if (result.language) {
      languageInput.value = result.language;
    }
  });

  saveBtn.addEventListener('click', () => {
    const systemPrompt = systemPromptInput.value.trim();
    const baseUrl = baseUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const modelName = modelNameInput.value.trim();
    const language = languageInput.value;
    chrome.storage.sync.set({ systemPrompt, baseUrl, apiKey, modelName, language }, () => {
      status.textContent = 'Credentials saved successfully!';
      setTimeout(() => (status.textContent = ''), 2000);
    });
  });
});

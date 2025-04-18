document.addEventListener('DOMContentLoaded', () => {
    const systemPromptAnalyticsInput = document.getElementById('systemPrompt_analytics');
    const systemPromptCommentInput = document.getElementById('systemPrompt_comment');
    const apiKeyInput = document.getElementById('apiKey');
    const baseUrlInput = document.getElementById('baseUrl');
    const modelNameInput = document.getElementById('modelName');
    const temperatureInput = document.getElementById('temperature');
    const languageInput = document.getElementById('language');
    const saveBtn = document.getElementById('saveBtn');
    const status = document.getElementById('status');
    const temperatureStatus = document.getElementById('temperatureStatus');

    const temperatureValue = function (input) {
        return `${input.value}/1.0 = ${(input.value * 100).toFixed(0)}%`;
    }
    temperatureInput.addEventListener('change', () => {
        temperatureStatus.innerHTML = temperatureValue(temperatureInput);
    })

    browser.storage.sync
        .get(['systemPromptAnalytics', 'systemPromptComment', 'apiKey', 'baseUrl', 'modelName', 'temperature', 'language'])
        .then((result) => {

            if (result.systemPromptAnalytics) {
                systemPromptAnalyticsInput.value = result.systemPromptAnalytics;
            }
            if (result.systemPromptComment) {
                systemPromptCommentInput.value = result.systemPromptComment;
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
            if (result.temperature) {
                temperatureInput.value = result.temperature;
                temperatureStatus.innerHTML = temperatureValue(temperatureInput);
            }
            if (result.language) {
                languageInput.value = result.language;
            }
        })
        .catch((error) => {
            console.error('Erro ao recuperar configurações:', error);
        });

    saveBtn.addEventListener('click', () => {
        const systemPromptAnalytics = systemPromptAnalyticsInput.value.trim();
        const systemPromptComment = systemPromptCommentInput.value.trim();
        const baseUrl = baseUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        const modelName = modelNameInput.value.trim();
        const temperature = parseFloat(temperatureInput.value.trim());
        const language = languageInput.value;
        browser.storage.sync.set({
            systemPromptAnalytics,
            systemPromptComment,
            baseUrl,
            apiKey,
            modelName,
            temperature,
            language
        })
        .then(() => {
            status.textContent = 'Saved successfully!';
            setTimeout(() => (status.textContent = ''), 2000);
        })
        .catch((error) => {
            console.error('Erro ao salvar configurações:', error);
            status.textContent = 'Erro ao salvar!';
        });
    });
});

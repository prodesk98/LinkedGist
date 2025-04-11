const config = {};

function convertElementToMarkdown(element) {
    if (!element) return '';

    let markdown = '';

    element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            markdown += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tag = node.tagName.toLowerCase();

            switch (tag) {
                case 'strong':
                case 'b':
                    markdown += `**${convertElementToMarkdown(node)}**`;
                    break;
                case 'em':
                case 'i':
                    markdown += `*${convertElementToMarkdown(node)}*`;
                    break;
                case 'a':
                    break;
                case 'ul':
                case 'ol':
                    const isOrdered = tag === 'ol';
                    node.querySelectorAll('li').forEach((li, index) => {
                        const prefix = isOrdered ? `${index + 1}.` : '-';
                        markdown += `${prefix} ${convertElementToMarkdown(li).trim()} `;
                    });
                    break;
                case 'img':
                    break;
                case 'br':
                    markdown += ' ';
                    break;
                case 'h1':
                case 'h2':
                case 'h3':
                    const level = parseInt(tag[1]);
                    markdown += `${'#'.repeat(level)} ${convertElementToMarkdown(node)} `;
                    break;
                case 'p':
                case 'div':
                    markdown += `${convertElementToMarkdown(node)} `;
                    break;
                default:
                    markdown += convertElementToMarkdown(node);
            }
        }
    });

    return markdown;
}

function convertMarkdownToHTML(markdown) {
    return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/__(.*?)__/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/_(.*?)_/gim, '<em>$1</em>')
        .replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>')
        .replace(/\n$/gim, '<br />');
}

function cleanText(text) {
    return text
        .replace(/\\n/g, '\n')
        .replace(/^\s+|\s+$/gm, '')
        .replace(/\n{2,}/g, '\n\n');
}

async function handlerGenerateComment(content) {
    if (!content) {
        alert('No content found in the post.');
        return;
    }
    if (!config.apiKey) {
        alert('API key is missing. Please check the extension settings.');
        return;
    }
    if (!config.baseUrl) {
        alert('Base URL is missing. Please check the extension settings.');
        return;
    }
    if (!config.modelName) {
        alert('Model name is missing. Please check the extension settings.');
        return;
    }
    const url = `${config.baseUrl}/chat/completions`;
    const systemPrompt = config.systemPrompt.replace("{{language}}", config.language);

    const model = config.modelName;
    const messages = [
        {
            role: "system",
            content: systemPrompt
        },
        {
            role: "user",
            content: content
        }
    ]

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: .2
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error generating comment: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (data.error) {
        console.error('Error in response:', data.error);
        throw new Error(`Error generating comment: ${data.error.message}`);
    }
    return data;
}

function addButtonToEditor(container) {
    if (container.classList.contains('linked-gist-comment-btn-focus')) {
        return;
    }
    const button = document.createElement('button');
    button.innerText = '💡 Generate explanation with LinkedGist';
    button.className = 'linked-gist-comment-btn comments-quick-comments__reply-button  artdeco-button artdeco-button--muted artdeco-button--2 artdeco-button--secondary ember-view';
    button.style.marginLeft = '10px';
    button.style.cursor = 'pointer';
    button.title = 'Gerando Resumo...';
    container.classList.add('linked-gist-comment-btn-focus');

    button.addEventListener('click', (e) => {
        e.stopPropagation();

        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = 'Generating...';

        const markdown = convertElementToMarkdown(container).trim();

        const markdownClean = cleanText(markdown);

        handlerGenerateComment(markdownClean).then((response) => {
            if (response && response.choices && response.choices.length > 0) {
                const regex = /\(.*?\)/g;
                const divResponse = document.createElement('div');
                divResponse.innerHTML = convertMarkdownToHTML(response.choices[0].message.content.replace(regex, ''));
                divResponse.className = 'linked-gist-comment-response';
                button.remove();
                const removeResponseButton = document.createElement('button');
                removeResponseButton.innerText = '❌ Remove comment';
                removeResponseButton.className = 'linked-gist-comment-remove-btn artdeco-button artdeco-button--muted artdeco-button--2 artdeco-button--secondary ember-view';
                removeResponseButton.style.marginLeft = '10px';
                removeResponseButton.style.cursor = 'pointer';
                removeResponseButton.title = 'Remove comment';
                removeResponseButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    divResponse.remove();
                    removeResponseButton.remove();
                    button.remove();
                    addButtonToEditor(container);
                });
                container.appendChild(divResponse);
                container.appendChild(removeResponseButton);
            } else {
                alert('No comment generated.');
            }
        }).catch((err) => {
            console.error('Error generating comment:', err);
            alert('Error generating comment. Please try again.');
        }).finally(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        });
    });

    container.parentElement.appendChild(button);
}

document.addEventListener('click', (e) => {
    const container = e.target.closest('.update-components-text');
    if (container) {
        setTimeout(() => addButtonToEditor(container), 100);
    }
});


function loadConfig() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['systemPrompt', 'baseUrl', 'apiKey', 'modelName', 'language'], (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                config.systemPrompt = result.systemPrompt || 'You are a LinkedIn post generator. Generate a comment based on the content provided.';
                config.baseUrl = result.baseUrl || '';
                config.apiKey = result.apiKey || '';
                config.modelName = result.modelName || 'gpt-4o-mini';
                config.language = result.language || 'English';
                resolve(config);
            }
        });
    });
}


loadConfig().then(() => console.log(`LinkedGist initialized...`)).catch((err) => {
    console.error('Error loading config:', err);
    alert('Error loading configuration. Please check the extension settings.');
});

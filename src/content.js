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

async function handlerGenerate(content, element, instruct = '', isComment = false) {
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
    let systemPrompt = isComment ? config.systemPromptComment : config.systemPromptAnalytics;
    systemPrompt = systemPrompt
        .replace("{{language}}", config.language)
        .replace("{{instruct}}", instruct);

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
            temperature: config.temperature,
            stream: true,
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error generating comment: ${response.status} ${response.statusText}`);
    }
    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
    const processStream = async () => {
        const {done, value} = await reader.read();
        if (done) {
            return result;
        }

        const chunkText = decoder.decode(value, {stream: true});

        const lines = chunkText.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.replace(/^data: /, '');
            if (data === '[DONE]') return result;

            try {
                const jsonChunk = JSON.parse(data);
                const delta = jsonChunk?.choices?.[0]?.delta?.content;
                if (delta) {
                    result += delta;
                    element.innerHTML = result;
                }
            } catch (err) {
                console.error('Erro ao parsear JSON chunk:', data, err);
            }
        }

        return processStream();
    };
    return await processStream();
}

function addButtonToEditor(element) {
    if (element.parentElement.querySelector('.linked-gist-comment-focus')!==null) return;

    const button = document.createElement('button');
    button.innerText = '💡 Generate comment with LinkedGist';
    button.title = 'Generate a comment...';
    button.className = 'linked-gist-comment-btn comments-quick-comments__reply-button  artdeco-button artdeco-button--muted artdeco-button--2 artdeco-button--secondary ember-view';
    button.style.marginLeft = '10px';
    button.style.cursor = 'pointer';

    button.addEventListener('click', (e) => {
        e.stopPropagation();

        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = 'Generating...';
        button.style.cursor = 'not-allowed';

        const postContainer = element.closest('[data-urn^="urn:li:activity"]') || element.closest('.update-components-update');

        const instruct = convertElementToMarkdown(element).trim();

        if (postContainer) {
            const impressionDivs = postContainer.querySelectorAll('.fie-impression-container');

            if (impressionDivs.length > 0) {
                let fullMarkdown = '';

                impressionDivs.forEach((div) => {
                    const markdown = convertElementToMarkdown(div).trim();
                    fullMarkdown += markdown;
                });

                fullMarkdown = cleanText(fullMarkdown);

                handlerGenerate(fullMarkdown, element, instruct, true).then((response) => {
                    if (response) {
                        const matches = [...response.matchAll(/"(.*?)"/g)].map(m => m[1]);
                        let cleanResponse = response;
                        if (matches.length > 0) {
                            const regex = /\(.*?\)/g;
                            cleanResponse = response.replace(regex, '');
                            element.innerHTML = cleanResponse;
                        }
                        element.innerHTML = cleanResponse;
                        element.dispatchEvent(new Event('input', {bubbles: true}));
                    } else {
                        alert('No comment generated.');
                    }
                }).catch((err) => {
                    console.error('Error generating comment:', err);
                    alert('Error generating comment. Please try again.');
                }).finally(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    button.style.cursor = 'pointer';
                });
            } else {
                alert('No content found in .fie-impression-container')
            }
        } else {
            alert('Could not find publication container.');
        }
    });
    element.classList.add('linked-gist-comment-focus');
    element.parentElement.appendChild(button);
}

function addButtonSummarization(element) {
    if (element.parentElement.querySelector('.linked-gist-insight-focus')!==null) return;

    const button = document.createElement('button');
    button.innerText = '💡 Generate explanation with LinkedGist';
    button.title = 'Generate summary...';
    button.className = 'linked-gist-comment-btn comments-quick-comments__reply-button  artdeco-button artdeco-button--muted artdeco-button--2 artdeco-button--secondary ember-view';
    button.style.marginLeft = '10px';
    button.style.cursor = 'pointer';

    button.addEventListener('click', (e) => {
        e.stopPropagation();

        button.disabled = true;
        const originalText = button.innerHTML;
        button.innerHTML = 'Generating...';
        button.style.cursor = 'not-allowed';

        const markdown = convertElementToMarkdown(element).trim();

        const markdownClean = cleanText(markdown);

        const regex = /\(.*?\)/g;
        const divResponse = document.createElement('div');
        divResponse.className = 'linked-gist-comment-response';
        element.appendChild(divResponse);

        handlerGenerate(markdownClean, divResponse, '', false).then((response) => {
            if (response) {
                divResponse.innerHTML = convertMarkdownToHTML(response.replace(regex, ''));
                button.remove();
                const removeResponseButton = document.createElement('button');
                removeResponseButton.innerText = '❌ Remove summary';
                removeResponseButton.className = 'linked-gist-comment-remove-btn artdeco-button artdeco-button--muted artdeco-button--2 artdeco-button--secondary ember-view';
                removeResponseButton.style.marginLeft = '10px';
                removeResponseButton.style.cursor = 'pointer';
                removeResponseButton.title = 'Remove summary';
                removeResponseButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    divResponse.remove();
                    removeResponseButton.remove();
                    button.remove();
                });
                element.appendChild(removeResponseButton);
            } else {
                alert('No comment generated.');
            }
        }).catch((err) => {
            console.error('Error generating comment:', err);
            alert('Error generating comment. Please try again.');
        }).finally(() => {
            button.innerHTML = originalText;
            button.disabled = false;
            button.style.cursor = 'pointer';
        });
    });
    element.classList.add('linked-gist-insight-focus');
    element.parentElement.appendChild(button);
}

document.addEventListener('click', (e) => {
    const posts_container = e.target.closest('.update-components-text');
    const editor_input = e.target.closest('.ql-editor');
    if (posts_container === null && editor_input === null) return;
    if (posts_container !== null) {
        setTimeout(() => addButtonSummarization(posts_container), 100);
    }
    if (editor_input !== null) {
        setTimeout(() => addButtonToEditor(editor_input), 100);
    }
});


function loadConfig() {
    return browser.storage.sync
        .get(['systemPromptAnalytics', 'systemPromptComment', 'baseUrl', 'apiKey', 'modelName', 'language'])
        .then((result) => {
            config.systemPromptAnalytics = result.systemPromptAnalytics || 'You are LinkedGist, an AI assistant specialized in summarizing LinkedIn posts.';
            config.systemPromptComment = result.systemPromptComment || 'You are LinkedGist, an AI assistant specialized in generating comments for LinkedIn posts.';
            config.baseUrl = result.baseUrl || '';
            config.apiKey = result.apiKey || '';
            config.modelName = result.modelName || 'gpt-4o-mini';
            config.temperature = result.temperature || 0.2;
            config.language = result.language || 'English';
            return config;
        })
        .catch((error) => {
            console.error('Error loading config:', error);
            throw error;
        });
}


loadConfig().then(() => console.log(`LinkedGist initialized...`)).catch((err) => {
    console.error('Error loading config:', err);
    alert('Error loading configuration. Please check the extension settings.');
});

const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

function getApiKey() {
  const encoded = localStorage.getItem('gx_deepseek_api_key');
  return encoded ? atob(encoded) : null;
}

function saveApiKey(key) {
  if (key) {
    localStorage.setItem('gx_deepseek_api_key', btoa(key));
  }
}

function getApiProvider() {
  return localStorage.getItem('gx_api_provider') || 'deepseek';
}

function saveApiProvider(provider) {
  localStorage.setItem('gx_api_provider', provider);
}

async function sendChatRequest(messages, onChunk, onDone, onError) {
  const apiKey = getApiKey();
  if (!apiKey) {
    onError && onError(new Error('请先配置DeepSeek API Key'));
    return;
  }

  const controller = new AbortController();

  try {
    const response = await fetch(DEEPSEEK_BASE + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败(${response.status}): ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') continue;

        try {
          const json = JSON.parse(dataStr);
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            onChunk && onChunk(content, fullContent);
          }
        } catch (e) { /* skip parse errors */ }
      }
    }

    onDone && onDone(fullContent);
  } catch (err) {
    if (err.name !== 'AbortError') {
      onError && onError(err);
    }
  }

  return controller; // For abort
}

async function sendSimpleRequest(messages) {
  return new Promise((resolve, reject) => {
    let fullContent = '';
    sendChatRequest(messages,
      (chunk) => { fullContent += chunk; },
      () => resolve(fullContent),
      reject
    );
  });
}

window.DeepSeekAPI = { getApiKey, saveApiKey, getApiProvider, saveApiProvider, sendChatRequest, sendSimpleRequest };

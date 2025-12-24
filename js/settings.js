import { encryptWithPublicKey } from './encryption.js';

const SETTINGS_KEY = 'codeflow_app_settings';

// Default state
let currentSettings = {
	geminiEncrypted: '',
	ollama: {
		url: 'http://localhost:11434',
		snippetModel: '',
		alignmentModel: ''
	},
	llama: {
		url: 'http://localhost:8080',
		snippetModel: '',
		alignmentModel: ''
	}
};

export function initSettings(container) {
	loadSettings();
	renderSettings(container);
	attachEventListeners();
}

function loadSettings() {
	const saved = localStorage.getItem(SETTINGS_KEY);
	if (saved) {
		const parsed = JSON.parse(saved);
		currentSettings = {
			...currentSettings,
			...parsed,
			ollama: { ...currentSettings.ollama, ...parsed.ollama },
			llama: { ...currentSettings.llama, ...parsed.llama }
		};
	}
}

async function saveSettings() {
	const rawKeyInput = document.getElementById('gemini-key').value.trim();
	const pemFileInput = document.getElementById('pem-key-file');

	if (rawKeyInput && !rawKeyInput.startsWith('•')) {
		try {
			if (window.showToast) window.showToast("Securing key...", "info");

			let pemContent = "";

			if (pemFileInput && pemFileInput.files.length > 0) {
				const file = pemFileInput.files[0];
				pemContent = await new Promise((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = (e) => resolve(e.target.result);
					reader.onerror = (e) => reject(e);
					reader.readAsText(file);
				});
			}

			const encryptedKey = await encryptWithPublicKey(rawKeyInput, pemContent);
			// TODO: Save IV and encrypted key for transfer later
			currentSettings.geminiEncrypted = encryptedKey.ciphertext;

			document.getElementById('gemini-key').value = "";

			// Clear file input UI
			if (pemFileInput) pemFileInput.value = "";
			const display = document.getElementById('pem-file-display');
			if (display) {
				display.textContent = "No file selected";
				display.classList.remove('has-file');
			}

		} catch (error) {
			console.error(error);
			if (window.showToast) window.showToast("Encryption failed.", "error");
			return;
		}
	}

	currentSettings.ollama.url = document.getElementById('ollama-url').value;
	currentSettings.llama.url = document.getElementById('llama-url').value;

	localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));

	if (window.showToast) window.showToast('Settings saved successfully', 'success');
	document.getElementById('save-bar').classList.remove('visible');

	renderSettings(document.getElementById('settings-view'));
	attachEventListeners();
}

function renderSettings(container) {
	if (!container) return;

	const keyPlaceholder = currentSettings.geminiEncrypted
		? "•••••••• [Encrypted Key Saved] ••••••••"
		: "sk-................................";

	const inputClass = currentSettings.geminiEncrypted ? "settings-input saved" : "settings-input";

	container.innerHTML = `
        <div class="settings-container">
            
            <div class="settings-card">
                <div class="settings-header">
                    <div class="settings-header-left">
                        <div class="settings-icon">
                            <img src="../assets/gemini.svg"></img>
                        </div>
                        <div>
                            <h3 class="settings-title">Google Gemini</h3>
                            <span style="font-size: 0.8rem; color: var(--text-sub);">Cloud Provider</span>
                        </div>
                    </div>
                    <span class="status-badge ${currentSettings.geminiEncrypted ? 'connected' : 'default'}">
                        ${currentSettings.geminiEncrypted ? 'Securely Stored' : 'Not Configured'}
                    </span>
                </div>
                <div class="settings-body">
                    <div class="input-group">
                        <label class="input-label">API Key</label>
                        <div class="input-wrapper">
                            <input type="password" id="gemini-key" class="${inputClass}" placeholder="${keyPlaceholder}">
                            <button class="btn-action" id="btn-clear-key" style="display:${currentSettings.geminiEncrypted ? 'block' : 'none'}">Clear</button>
                        </div>
                        <p class="settings-helper-text">
                            Key is encrypted in the browser before storage using public-key cryptography.
                        </p>
                    </div>

                    <div class="input-group" style="margin-top: 15px;">
                        <label class="input-label">Public Key (PEM File)</label>
                        
                        <input type="file" id="pem-key-file" accept=".pem" class="hidden-file-input">
                        
                        <label for="pem-key-file" class="file-upload-label">
                            <span id="pem-file-display" class="file-name-display">No file selected</span>
                            <span class="file-custom-btn">Browse PEM</span>
                        </label>

                        <p class="settings-helper-text">
                            Upload a <code>.pem</code> file containing the public key to encrypt your API key.
                        </p>
                    </div>
                </div>
            </div>

            <div class="settings-card" id="ollama-card">
                <div class="settings-header">
                    <div class="settings-header-left">
                        <div class="settings-icon">
                            <img src="../assets/ollama.svg"></img>
                        </div>
                        <div>
                            <h3 class="settings-title">Ollama</h3>
                            <span style="font-size: 0.8rem; color: var(--text-sub);">Local Inference</span>
                        </div>
                    </div>
                    <span id="ollama-status" class="status-badge default">Disconnected</span>
                </div>
                <div class="settings-body">
                    <div class="input-group">
                        <label class="input-label">Server URL</label>
                        <div class="input-wrapper">
                            <input type="text" id="ollama-url" class="settings-input" placeholder="http://localhost:11434" value="${currentSettings.ollama.url}">
                            <button class="btn-action" id="btn-check-ollama">Connect</button>
                        </div>
                    </div>
                    
                    <div id="ollama-models-area" class="model-selection-area">
                        <div class="radio-group-container">
                            <span class="radio-group-label">Snippet Analysis Model</span>
                            <div class="radio-options" id="ollama-snippet-options"></div>
                        </div>
                        <div class="radio-group-container">
                            <span class="radio-group-label">Alignment Analysis Model</span>
                            <div class="radio-options" id="ollama-alignment-options"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="settings-card" id="llama-card">
                <div class="settings-header">
                    <div class="settings-header-left">
                        <div class="settings-icon">
                            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                        </div>
                        <div>
                            <h3 class="settings-title">Llama.cpp Server</h3>
                            <span style="font-size: 0.8rem; color: var(--text-sub);">Local Inference</span>
                        </div>
                    </div>
                    <span id="llama-status" class="status-badge default">Disconnected</span>
                </div>
                <div class="settings-body">
                    <div class="input-group">
                        <label class="input-label">Server URL</label>
                        <div class="input-wrapper">
                            <input type="text" id="llama-url" class="settings-input" placeholder="http://localhost:8080" value="${currentSettings.llama.url}">
                            <button class="btn-action" id="btn-check-llama">Connect</button>
                        </div>
                    </div>

                     <div id="llama-models-area" class="model-selection-area">
                        <div class="radio-group-container">
                            <span class="radio-group-label">Snippet Analysis Model</span>
                            <div class="radio-options" id="llama-snippet-options"></div>
                        </div>
                        <div class="radio-group-container">
                            <span class="radio-group-label">Alignment Analysis Model</span>
                            <div class="radio-options" id="llama-alignment-options"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="save-bar" class="save-bar">
            <span>You have unsaved changes</span>
            <button id="btn-save-settings" class="btn-save">Save Changes</button>
        </div>
    `;

	// Auto-connect attempts
	if (currentSettings.ollama.url) checkConnection('ollama', currentSettings.ollama.url, true);
	if (currentSettings.llama.url) checkConnection('llama', currentSettings.llama.url, true);
}

function attachEventListeners() {
	const saveBar = document.getElementById('save-bar');
	const showSave = () => saveBar.classList.add('visible');

	const clearBtn = document.getElementById('btn-clear-key');
	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			currentSettings.geminiEncrypted = "";
			document.getElementById('gemini-key').value = "";
			document.getElementById('gemini-key').classList.remove('saved');
			document.getElementById('gemini-key').placeholder = "Enter your Gemini API Key";
			clearBtn.style.display = 'none';
			showSave();
		});
	}

	document.getElementById('gemini-key').addEventListener('input', showSave);

	// PEM File Input Listener
	const pemInput = document.getElementById('pem-key-file');
	const pemDisplay = document.getElementById('pem-file-display');

	if (pemInput) {
		pemInput.addEventListener('change', (e) => {
			if (e.target.files.length > 0) {
				pemDisplay.textContent = e.target.files[0].name;
				pemDisplay.classList.add('has-file');
			} else {
				pemDisplay.textContent = "No file selected";
				pemDisplay.classList.remove('has-file');
			}
			showSave();
		});
	}

	document.getElementById('btn-check-ollama').addEventListener('click', () => {
		const url = document.getElementById('ollama-url').value.trim();
		currentSettings.ollama.url = url;
		checkConnection('ollama', url);
		showSave();
	});

	document.getElementById('btn-check-llama').addEventListener('click', () => {
		const url = document.getElementById('llama-url').value.trim();
		currentSettings.llama.url = url;
		checkConnection('llama', url);
		showSave();
	});

	document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
}

async function checkConnection(type, url, silent = false) {
	const statusBadge = document.getElementById(`${type}-status`);
	const area = document.getElementById(`${type}-models-area`);

	if (!statusBadge || !area) return;

	statusBadge.textContent = "Connecting...";
	statusBadge.className = "status-badge default";

	try {
		let endpoint = type === 'ollama' ? '/api/tags' : '/v1/models';
		const cleanUrl = url.replace(/\/$/, '');

		const res = await fetch(`${cleanUrl}${endpoint}`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();

		let models = [];
		if (type === 'ollama') {
			models = data.models?.map(m => m.name) || [];
		} else {
			models = data.data?.map(m => m.id) || [];
		}

		statusBadge.textContent = "Connected";
		statusBadge.className = "status-badge connected";
		area.classList.add('active');

		renderModelRadios(type, models);

		if (!silent && window.showToast) window.showToast(`Connected to ${type}`, 'success');

	} catch (err) {
		console.error(err);
		statusBadge.textContent = "Connection Failed";
		statusBadge.className = "status-badge error";
		area.classList.remove('active');
		if (!silent && window.showToast) window.showToast(`Could not connect to ${type}`, 'error');
	}
}

function renderModelRadios(type, models) {
	const snippetContainer = document.getElementById(`${type}-snippet-options`);
	const alignContainer = document.getElementById(`${type}-alignment-options`);

	if (!snippetContainer || !alignContainer) return;

	const createRadio = (modelName, category) => {
		const label = document.createElement('label');
		label.className = 'model-radio-label';

		const input = document.createElement('input');
		input.type = 'radio';
		input.name = `${type}-${category}`;
		input.value = modelName;

		if (currentSettings[type][`${category}Model`] === modelName) {
			input.checked = true;
		}

		input.addEventListener('change', () => {
			currentSettings[type][`${category}Model`] = modelName;
			document.getElementById('save-bar').classList.add('visible');
		});

		const span = document.createElement('span');
		span.textContent = modelName;

		label.appendChild(input);
		label.appendChild(span);
		return label;
	};

	snippetContainer.innerHTML = '';
	alignContainer.innerHTML = '';

	if (models.length === 0) {
		snippetContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-sub)">No models found</span>';
		return;
	}

	models.forEach(m => {
		snippetContainer.appendChild(createRadio(m, 'snippet'));
		alignContainer.appendChild(createRadio(m, 'alignment'));
	});
}

export function getSettingsHeaders() {
	return {
		'x-gemini-key': currentSettings.geminiEncrypted || '',
		'x-ollama-url': currentSettings.ollama.url || '',
		'x-ollama-snippet-model': currentSettings.ollama.snippetModel || '',
		'x-ollama-alignment-model': currentSettings.ollama.alignmentModel || '',
		'x-llama-url': currentSettings.llama.url || '',
		'x-llama-snippet-model': currentSettings.llama.snippetModel || '',
		'x-llama-alignment-model': currentSettings.llama.alignmentModel || ''
	};
}

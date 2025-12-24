export function initFlowEditor({ container, selectedNodeIds, flowState }) {

	const toolbar = document.createElement('div');
	toolbar.className = 'flow-toolbar';
	toolbar.id = 'flowEditorToolbar';

	// Start hidden or visible
	toolbar.style.display = 'none';

	const renameBtn = document.createElement('button');
	renameBtn.className = 'toolbar-btn';
	renameBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Rename
    `;

	toolbar.appendChild(renameBtn);
	container.appendChild(toolbar);

	const observer = new MutationObserver(() => {
		const hasSelection = container.querySelectorAll('.flow-node.selected').length > 0;

		if (hasSelection) {
			toolbar.style.display = 'flex';
		} else {
			toolbar.style.display = 'none';
		}
	});

	observer.observe(container, {
		subtree: true,
		attributes: true,
		attributeFilter: ['class']
	});

	renameBtn.addEventListener('click', (e) => {
		e.stopPropagation();

		if (selectedNodeIds.size !== 1) {
			if (window.showToast) window.showToast("Select exactly one node to rename", "error");
			return;
		}

		const nodeId = Array.from(selectedNodeIds)[0];
		const nodeEl = document.getElementById(nodeId);

		if (nodeEl) {
			startRenaming(nodeEl, nodeId, flowState);
		}
	});
}

function startRenaming(nodeEl, nodeId, flowState) {
	const titleEl = nodeEl.querySelector('.node-title');
	if (!titleEl) return;

	const currentLabel = titleEl.textContent;

	const input = document.createElement('input');
	input.type = 'text';
	input.className = 'node-title-input';
	input.value = currentLabel;

	titleEl.style.display = 'none';
	titleEl.parentNode.insertBefore(input, titleEl);

	input.focus();
	input.select();

	input.addEventListener('mousedown', (e) => e.stopPropagation());

	const save = () => {
		const newLabel = input.value.trim();

		if (newLabel) {
			titleEl.textContent = newLabel;

			const nodeData = flowState.nodes.find(n => n.id === nodeId);
			if (nodeData) {
				nodeData.label = newLabel;
			}
		}

		input.remove();
		titleEl.style.display = '';
	};

	input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			window.showToast("Node renamed successfully!", "success");
			save();
		} else if (e.key === 'Escape') {
			input.remove();
			titleEl.style.display = '';
		}
	});

	input.addEventListener('blur', () => {
		save();
	});
}

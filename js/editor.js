import { updateFlowItem, saveConfig } from './flow.js';

const panel = document.getElementById('editor-content');
const tplNode = document.getElementById('tpl-node-editor');
const tplEdge = document.getElementById('tpl-edge-editor');


export function initEditor() {

    document.getElementById('btn-save-config').addEventListener('click', () => {
        saveConfig();

        const btn = document.getElementById('btn-save-config');
        const originalText = btn.innerText;
        btn.innerText = "Saved!";
        btn.style.backgroundColor = "#10b981";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = "";
        }, 2000);
    });
}



export function onSelectionChange(type, item) {
    panel.innerHTML = '';

    if (!item) {
        panel.innerHTML = `<p class="empty-state">Select a node or connection to edit its properties.</p>`;
        return;
    }

    if (type === 'node') {
        renderNodeEditor(item);
    } else if (type === 'edge') {
        renderEdgeEditor(item);
    }
}



function renderNodeEditor(node) {
    const clone = tplNode.content.cloneNode(true);
    const inputLabel = clone.getElementById('input-node-label');
    const inputId = clone.getElementById('input-node-id');


    inputLabel.value = node.label || "";
    inputId.value = node.id;

    inputLabel.addEventListener('input', (e) => {
        updateFlowItem('node', node.id, { label: e.target.value });
    });

    panel.appendChild(clone);
    inputLabel.focus();
}

function renderEdgeEditor(edge) {
    const clone = tplEdge.content.cloneNode(true);
    const inputLabel = clone.getElementById('input-edge-label');


    inputLabel.value = edge.label || "";


    inputLabel.addEventListener('input', (e) => {

        updateFlowItem('edge', edge._index, { label: e.target.value });
    });

    panel.appendChild(clone);
    inputLabel.focus();
}

let flowState = { nodes: [], edges: [] };


let selectedNodeIds = new Set();
let isSelecting = false;
let selectionStart = { x: 0, y: 0 }; 
let selectionRect = { x: 0, y: 0, width: 0, height: 0 }; 


let isDraggingNode = false;


let dragOffsets = new Map();


let isPanning = false;
let viewX = 0;
let viewY = 0;
let scale = 1;
let panStartX = 0;
let panStartY = 0;

let timeout;


const ZOOM_SENSITIVITY = 0.001;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

const hoverTooltip = document.getElementById("hover-tooltip");

hoverTooltip.addEventListener("mouseenter", () => {
	if (timeout) clearTimeout(timeout);
})

hoverTooltip.addEventListener("mouseleave", () => {
	timeout = setTimeout(() => {
		hoverTooltip.style.scale = "0%"
	}, 100);
})

export function initFlow(flowData) {
	if (!flowData) return;
	flowState = flowData;

	const canvas = document.getElementById('flowCanvas');

	
	viewX = canvas.offsetWidth / 2;
	viewY = canvas.offsetHeight / 2;

	
	document.getElementById('nodesContainer').style.transformOrigin = '0 0';

	
	const svgLayer = document.getElementById('svgLayer');

	
	if (!document.getElementById('selection-marquee')) {
		const marquee = document.createElement('div');
		marquee.id = 'selection-marquee';
		canvas.appendChild(marquee);
	}

	svgLayer.innerHTML = `
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
        </defs>
        <g id="edgeGroup"></g> 
    `;

	
	renderNodes();
	drawEdges();
	updateView();

	
	
	canvas.addEventListener('mousedown', handleCanvasMouseDown);
	canvas.addEventListener('wheel', onWheel, { passive: false });

	
	document.addEventListener('mousemove', onGlobalMouseMove);
	document.addEventListener('mouseup', onGlobalMouseUp);

	window.addEventListener('resize', () => {
		viewX = canvas.offsetWidth / 2;
		viewY = canvas.offsetHeight / 2;
		updateView();
	});

	document.getElementById('btn-export-flow').addEventListener('click', exportFlowConfig);
}



function renderNodes() {
	const container = document.getElementById('nodesContainer');
	container.innerHTML = '';

	const canvas = document.getElementById('flowCanvas');
	const PADDING = 80;
	var minX = -(canvas.offsetWidth / 2) + PADDING, maxX = 0;
	var minY = -(canvas.offsetHeight / 2) + PADDING, maxY = canvas.offsetHeight / 2 - PADDING;

	flowState.nodes.forEach(node => {
		const el = document.createElement('div');
		el.className = 'flow-node';
		if (selectedNodeIds.has(node.id)) el.classList.add('selected');

		el.id = node.id;

		
		node.x = node.x !== undefined && node.x !== null ? node.x : Math.floor(Math.random() * (maxX - minX + 1)) + minX;
		node.y = node.y !== undefined && node.y !== null ? node.y : Math.floor(Math.random() * (maxY - minY + 1)) + minY;

		minX = node.x + 200;

		el.style.left = `${node.x}px`;
		el.style.top = `${node.y}px`;
		el.setAttribute('data-type', node.type || 'process');

		el.innerHTML = `
            <div class="handle top"></div>
            <div class="handle left"></div>
            <div class="node-header">
                <span class="node-title">${node.label}</span>
                <b class="node-info">i</b>
            </div>
            <div class="handle right"></div>
            <div class="handle bottom"></div>
        `;

		el.addEventListener('mousedown', (e) => {
			e.stopPropagation(); 
			startDragNode(e, node);
		});

		let info = el.getElementsByTagName("b")[0]
		info.dataset.info = node.info;

		info.addEventListener('mouseenter', onNodeHoverPositionTooltipEnter);
		info.addEventListener('mouseleave', onNodeHoverPositionTooltipLeave);
		info.addEventListener('mousemove', onNodeHoverPositionTooltipMove);

		container.appendChild(el);
	});
}

function drawEdges() {
	const edgeGroup = document.getElementById('edgeGroup');
	edgeGroup.innerHTML = '';

	const getElHeight = (id) => {
		const el = document.getElementById(id);
		return el ? el.offsetHeight : 50;
	};
	const getElWidth = (id) => {
		const el = document.getElementById(id);
		return el ? el.offsetWidth : 220;
	};

	
	const getDirection = (sNode, tNode) => {
		const right = [1, 0];
		const width = getElWidth(tNode.id);
		const dir = [tNode.x - (sNode.x + width), tNode.y - sNode.y];
		
		return right[0] * dir[0] + right[1] * dir[1];
	}

	flowState.edges.forEach(edge => {
		const sNode = flowState.nodes.find(n => n.id === edge.from);
		const tNode = flowState.nodes.find(n => n.id === edge.to);

		if (sNode && tNode) {
			const sHeight = getElHeight(sNode.id);
			const sWidth = getElWidth(sNode.id);
			const tWidth = getElWidth(tNode.id);
			const tHeight = getElHeight(tNode.id);

			const dot = getDirection(sNode, tNode);

			
			const startX = dot <= 0 ? sNode.x + sWidth / 2 : sNode.x + sWidth;
			const startY = dot <= 0 ? sNode.y + sHeight : sNode.y + (sHeight / 2);
			const endX = dot <= 0 ? tNode.x + tWidth / 2 : tNode.x;
			const endY = dot <= 0 ? tNode.y : tNode.y + (tHeight / 2);

			const controlDist = dot <= 0 ? Math.abs(endY - startY) / 2 : Math.abs(endX - startX) / 2;

			const d = dot <= 0
				? `M ${startX} ${startY} C ${startX} ${startY + controlDist}, ${endX} ${endY - controlDist}, ${endX} ${endY}`
				: `M ${startX} ${startY} C ${startX + controlDist} ${startY}, ${endX - controlDist} ${endY}, ${endX} ${endY}`;

			const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
			path.setAttribute("d", d);
			path.setAttribute("class", "connection-path");
			path.setAttribute("marker-end", "url(#arrowhead)");
			edgeGroup.appendChild(path);

			if (edge.label) {
				const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
				text.setAttribute("x", (startX + endX) / 2);
				text.setAttribute("y", (startY + endY) / 2 - 5);
				text.setAttribute("text-anchor", "middle");
				text.setAttribute("fill", "#64748b");
				text.setAttribute("font-size", "11");
				text.textContent = edge.label;
				edgeGroup.appendChild(text);
			}
		}
	});
}

function updateView() {
	const transform = `translate(${viewX}px, ${viewY}px) scale(${scale})`;

	document.getElementById('nodesContainer').style.transform = transform;
	document.getElementById('edgeGroup').style.transform = transform;

	const bgSize = 20 * scale;
	const canvas = document.getElementById('flowCanvas');
	canvas.style.backgroundSize = `${bgSize}px ${bgSize}px`;
	canvas.style.backgroundPosition = `${viewX}px ${viewY}px`;
}




function handleCanvasMouseDown(e) {
	if (e.target.id !== 'flowCanvas' && e.target.nodeName !== 'svg') return;

	
	if (e.shiftKey) {
		startMarquee(e);
	}
	
	else {
		
		clearSelection();
		startPan(e);
	}
}

function onGlobalMouseMove(e) {
	if (isDraggingNode) onDragNode(e);
	if (isPanning) onPan(e);
	if (isSelecting) onMarqueeDrag(e);
}

function onGlobalMouseUp(e) {
	if (isDraggingNode) stopDragNode();
	if (isPanning) stopPan();
	if (isSelecting) stopMarquee();
}




function onWheel(e) {
	e.preventDefault();
	const zoomAmount = -e.deltaY * ZOOM_SENSITIVITY;
	const newScale = Math.min(Math.max(scale + zoomAmount, MIN_SCALE), MAX_SCALE);

	const canvasRect = document.getElementById('flowCanvas').getBoundingClientRect();
	const mouseX = e.clientX - canvasRect.left;
	const mouseY = e.clientY - canvasRect.top;

	const worldX = (mouseX - viewX) / scale;
	const worldY = (mouseY - viewY) / scale;

	viewX = mouseX - worldX * newScale;
	viewY = mouseY - worldY * newScale;
	scale = newScale;

	updateView();
}




function startPan(e) {
	isPanning = true;
	panStartX = e.clientX - viewX;
	panStartY = e.clientY - viewY;
	document.getElementById('flowCanvas').style.cursor = 'grabbing';
}

function onPan(e) {
	e.preventDefault();
	viewX = e.clientX - panStartX;
	viewY = e.clientY - panStartY;
	updateView();
}

function stopPan() {
	isPanning = false;
	document.getElementById('flowCanvas').style.cursor = 'grab';
}




function startDragNode(e, node) {
	
	
	
	if (!selectedNodeIds.has(node.id)) {
		if (!e.shiftKey) {
			clearSelection();
		}
		selectNode(node.id);
	}

	isDraggingNode = true;

	
	
	const canvasRect = document.getElementById('flowCanvas').getBoundingClientRect();
	const mouseX = e.clientX - canvasRect.left;
	const mouseY = e.clientY - canvasRect.top;

	const mouseWorldX = (mouseX - viewX) / scale;
	const mouseWorldY = (mouseY - viewY) / scale;

	dragOffsets.clear();

	selectedNodeIds.forEach(id => {
		const n = flowState.nodes.find(x => x.id === id);
		if (n) {
			dragOffsets.set(id, {
				offsetX: mouseWorldX - n.x,
				offsetY: mouseWorldY - n.y
			});
		}
	});
}

function onDragNode(e) {
	const canvasRect = document.getElementById('flowCanvas').getBoundingClientRect();
	const mouseX = e.clientX - canvasRect.left;
	const mouseY = e.clientY - canvasRect.top;

	const mouseWorldX = (mouseX - viewX) / scale;
	const mouseWorldY = (mouseY - viewY) / scale;

	
	selectedNodeIds.forEach(id => {
		const node = flowState.nodes.find(n => n.id === id);
		const offset = dragOffsets.get(id);

		if (node && offset) {
			let newX = mouseWorldX - offset.offsetX;
			let newY = mouseWorldY - offset.offsetY;

			
			newX = Math.round(newX / 10) * 10;
			newY = Math.round(newY / 10) * 10;

			node.x = newX;
			node.y = newY;

			
			const el = document.getElementById(node.id);
			if (el) {
				el.style.left = `${newX}px`;
				el.style.top = `${newY}px`;
			}
		}
	});

	drawEdges();
}

function stopDragNode() {
	isDraggingNode = false;
	dragOffsets.clear();
}




function startMarquee(e) {
	isSelecting = true;
	const canvasRect = document.getElementById('flowCanvas').getBoundingClientRect();

	
	selectionStart = {
		x: e.clientX - canvasRect.left,
		y: e.clientY - canvasRect.top
	};

	const marquee = document.getElementById('selection-marquee');
	marquee.style.display = 'block';
	marquee.style.left = selectionStart.x + 'px';
	marquee.style.top = selectionStart.y + 'px';
	marquee.style.width = '0px';
	marquee.style.height = '0px';
}

function onMarqueeDrag(e) {
	e.preventDefault();
	const canvasRect = document.getElementById('flowCanvas').getBoundingClientRect();
	const currentX = e.clientX - canvasRect.left;
	const currentY = e.clientY - canvasRect.top;

	
	const x = Math.min(selectionStart.x, currentX);
	const y = Math.min(selectionStart.y, currentY);
	const width = Math.abs(currentX - selectionStart.x);
	const height = Math.abs(currentY - selectionStart.y);

	
	const marquee = document.getElementById('selection-marquee');
	marquee.style.left = x + 'px';
	marquee.style.top = y + 'px';
	marquee.style.width = width + 'px';
	marquee.style.height = height + 'px';

	
	selectionRect = { x, y, width, height };
}

function stopMarquee() {
	isSelecting = false;
	document.getElementById('selection-marquee').style.display = 'none';

	
	
	const worldLeft = (selectionRect.x - viewX) / scale;
	const worldTop = (selectionRect.y - viewY) / scale;
	const worldRight = (selectionRect.x + selectionRect.width - viewX) / scale;
	const worldBottom = (selectionRect.y + selectionRect.height - viewY) / scale;

	
	flowState.nodes.forEach(node => {
		const nodeEl = document.getElementById(node.id);
		const nodeW = nodeEl.offsetWidth;
		const nodeH = nodeEl.offsetHeight;

		
		
		if (
			node.x < worldRight &&
			(node.x + nodeW) > worldLeft &&
			node.y < worldBottom &&
			(node.y + nodeH) > worldTop
		) {
			selectNode(node.id);
		}
	});
}


function onNodeHoverPositionTooltipEnter(e) {
	hoverTooltip.style.scale = `100%`;
	hoverTooltip.style.left = `${e.target.getBoundingClientRect().x + hoverTooltip.offsetWidth / 2}px`;
	hoverTooltip.style.top = `${e.target.getBoundingClientRect().y - hoverTooltip.offsetHeight - 8}px`;

	hoverTooltip.innerHTML = `${e.target.dataset.info}`

	if(timeout) clearTimeout(timeout);
}

function onNodeHoverPositionTooltipLeave(e) {
	timeout = setTimeout(() => {
		hoverTooltip.style.scale = "0%";
	}, 100);
}

function onNodeHoverPositionTooltipMove(e) {
	hoverTooltip.style.left = `${e.clientX - hoverTooltip.clientWidth / 2}px`;
}



function selectNode(id) {
	selectedNodeIds.add(id);
	const el = document.getElementById(id);
	if (el) el.classList.add('selected');
}

function clearSelection() {
	selectedNodeIds.forEach(id => {
		const el = document.getElementById(id);
		if (el) el.classList.remove('selected');
	});
	selectedNodeIds.clear();
}


function exportFlowConfig() {
	const output = {
		nodes: flowState.nodes.map(n => ({
			id: n.id,
			label: n.label,
			x: n.x,
			y: n.y,
			info: n.info,
			type: n.type,
			linkedDataIndex: n.linkedDataIndex
		})),
		edges: flowState.edges
	};

	var copy = JSON.stringify(output, null, 2);
	navigator.clipboard.writeText(copy);

	if (window.showToast) {
		window.showToast(`Layout copied!`);
	} else {
		alert(`Layout copied!`);
	}
}

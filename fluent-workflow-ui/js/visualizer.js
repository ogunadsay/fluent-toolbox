class WorkflowVisualizer {
  constructor(svgElementId) {
    this.svg = d3.select(`#${svgElementId}`);
    this.width = this.svg.node().getBoundingClientRect().width;
    this.height = this.svg.node().getBoundingClientRect().height;
    this.g = this.svg.append('g');
    
    // Setup zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });
    
    this.svg.call(this.zoom);
    
    // Updated node dimensions to accommodate more content
    this.nodeWidth = 300;
    this.nodeHeight = 180; // Reduced from 220
    this.horizontalSpacing = 400;
    this.verticalSpacing = 230;
    
    // Track expanded nodes
    this.expandedNodes = new Set();
    
    // Setup arrow marker for links
    this.setupArrowMarker();
    
    // Add context menu handling for right-click
    this.svg.on('contextmenu', (event) => {
      event.preventDefault(); // Prevent default context menu
    });
  }
  
  clear() {
    this.g.selectAll('*').remove();
  }
  
  setupArrowMarker() {
    // Add arrowhead definition
    this.svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");
  }
  
  renderGraph(graphData) {
    this.clear();
    if (!graphData || !graphData.rootNodes) {
      console.error('Invalid graph data');
      return;
    }
    
    // Store graph data
    this.graphData = graphData;
    
    // Render the root nodes
    this.renderRootNodes();
  }
  
  renderRootNodes() {
    const rootSpacing = 300; // Increased to accommodate expanded nodes with more rules
    const startY = 100;
    
    // Render each root node by entity type
    Object.entries(this.graphData.typeRoots).forEach(([type, node], index) => {
      const y = startY + index * rootSpacing;
      this.renderNode(node, 100, y);
    });
  }
  
  renderNode(node, x, y) {
    const isExpanded = this.expandedNodes.has(node.id);
    
    // Get ruleset data
    const workflow = JSON.parse(document.getElementById('json-input').value);
    const ruleset = workflow.rulesets.find(r => r.name === node.name && r.type === node.type && 
                                           (r.subtype || 'DEFAULT') === (node.subtype || 'DEFAULT'));
    
    // Calculate dynamic height based on content
    let dynamicHeight = this.nodeHeight;
    
    // Add extra height for rules if needed
    if (ruleset && ruleset.rules && ruleset.rules.length > 3) {
      // Each rule takes about 15px (reduced from 20px)
      const rulesExtraHeight = (ruleset.rules.length - 3) * 15;
      dynamicHeight += rulesExtraHeight;
    }
    
    // Create node group
    const g = this.g.append('g')
      .attr('class', `node ${node.type}`)
      .attr('id', `node-${node.id}`)
      .attr('transform', `translate(${x},${y})`)
      .attr('data-node-id', node.id)
      .on('click', () => this.toggleNode(node, x, y))
      .on('contextmenu', (event) => {
        event.preventDefault();
        this.showNodeDetails(node, ruleset);
      });
    
    // Background rectangle with dynamic height
    g.append('rect')
      .attr('width', this.nodeWidth)
      .attr('height', dynamicHeight)
      .attr('rx', 5)
      .attr('ry', 5);
    
    // Header background (slightly darker)
    g.append('rect')
      .attr('width', this.nodeWidth)
      .attr('height', 30)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('fill', d => {
        switch(node.type) {
          case 'ORDER': return '#bbdefb';
          case 'FULFILMENT': return '#c8e6c9';
          case 'ARTICLE': return '#ffe0b2';
          case 'CONSIGNMENT': return '#e1bee7';
          case 'FULFILMENT_CHOICE': return '#b2ebf2';
          default: return '#e0e0e0';
        }
      });

    // Ruleset name (top left)
    g.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('font-weight', 'bold')
      .text(node.name);
    
    // Ruleset type (top right)
    g.append('text')
      .attr('x', this.nodeWidth - 10)
      .attr('y', 20)
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .text(node.type);
    
    // Description (below ruleset name)
    const description = this.wrapText(node.description, 40);
    g.append('text')
      .attr('x', 10)
      .attr('y', 45)
      .attr('font-size', '11px')
      .selectAll('tspan')
      .data(description)
      .enter()
      .append('tspan')
      .attr('x', 10)
      .attr('dy', (d, i) => i === 0 ? 0 : 12)
      .text(d => d);
    
    // Triggers section
    let yOffset = 45 + description.length * 12 + 10;
    g.append('text')
      .attr('x', 10)
      .attr('y', yOffset)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Triggers:');
    
    yOffset += 15;
    // Get triggers from original data
    if (ruleset && ruleset.triggers && ruleset.triggers.length > 0) {
      ruleset.triggers.forEach((trigger, i) => {
        g.append('text')
          .attr('x', 20)
          .attr('y', yOffset + i * 12)
          .attr('font-size', '10px')
          .text(`Status: ${trigger.status}`);
      });
      
      yOffset += ruleset.triggers.length * 12 + 5;
    } else {
      g.append('text')
        .attr('x', 20)
        .attr('y', yOffset)
        .attr('font-size', '10px')
        .text('No triggers');
        
      yOffset += 12 + 5;
    }
    
    // Rules section
    g.append('text')
      .attr('x', 10)
      .attr('y', yOffset)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Rules:');
      
    yOffset += 15;
    
    // Display rules - show all rules instead of limiting to 3
    if (ruleset && ruleset.rules && ruleset.rules.length > 0) {
      ruleset.rules.forEach((rule, i) => {
        // Rule name
        g.append('text')
          .attr('x', 20)
          .attr('y', yOffset + i * 15) // Reduced from 40 to 15
          .attr('font-size', '10px')
          .text(`${rule.name.split('.').pop()}`);
          
        // Add colored circle indicator if rule has props
        if (rule.props) {
          g.append('circle')
            .attr('cx', 15)
            .attr('cy', yOffset + i * 15 - 3)
            .attr('r', 3)
            .attr('fill', '#2196F3'); // Blue
        }
      });
    } else {
      g.append('text')
        .attr('x', 20)
        .attr('y', yOffset)
        .attr('font-size', '10px')
        .text('No rules');
    }
    
    // Add expand/collapse indicator if node has children
    if (node.children && node.children.length > 0) {
      g.append('circle')
        .attr('cx', this.nodeWidth - 15)
        .attr('cy', dynamicHeight - 15) // Use dynamic height
        .attr('r', 10)
        .attr('fill', 'white')
        .attr('stroke', '#666');
      
      g.append('text')
        .attr('x', this.nodeWidth - 15)
        .attr('y', dynamicHeight - 11) // Use dynamic height
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .text(isExpanded ? '-' : '+');
      
      // Add child count indicator
      g.append('text')
        .attr('x', this.nodeWidth - 30)
        .attr('y', dynamicHeight - 15) // Use dynamic height
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .text(`${node.children.length} connections`);
    }
    
    // If expanded, render children
    if (isExpanded) {
      this.renderChildren(node, x, y, dynamicHeight);
    }
    
    // Store the dynamic height for later use
    node.dynamicHeight = dynamicHeight;
  }
  
  renderChildren(parentNode, parentX, parentY, parentHeight) {
    if (!parentNode.children || parentNode.children.length === 0) return;
    
    const numChildren = parentNode.children.length;
    const totalHeight = (numChildren - 1) * this.verticalSpacing;
    const startY = parentY - totalHeight / 2;
    
    parentNode.children.forEach((child, i) => {
      const childX = parentX + this.horizontalSpacing;
      const childY = startY + i * this.verticalSpacing;
      
      // Draw edge from parent to child
      this.drawEdge(parentNode, child, parentX, parentY, childX, childY, parentHeight);
      
      // Render child node
      this.renderNode(child, childX, childY);
    });
  }
  
  drawEdge(source, target, sourceX, sourceY, targetX, targetY, sourceHeight) {
    // Find the edge data for this source-target pair
    const edge = this.graphData.edges.find(e => 
      e.source === source.id && e.target === target.id
    );
    
    if (!edge) return;
    
    // Calculate path coordinates
    const sourceRight = sourceX + this.nodeWidth;
    const sourceMidY = sourceY + (sourceHeight || this.nodeHeight) / 2;
    const targetLeft = targetX;
    const targetMidY = targetY + this.nodeHeight / 2;
    const midX = (sourceRight + targetLeft) / 2;
    
    // Create a curved path
    const path = d3.line().curve(d3.curveBasis)([
      [sourceRight, sourceMidY],
      [midX, sourceMidY],
      [midX, targetMidY],
      [targetLeft, targetMidY]
    ]);
    
    // Draw the edge
    this.g.append('path')
      .attr('d', path)
      .attr('class', 'link')
      .attr('marker-end', 'url(#arrowhead)');
    
    // Add event name as label with color based on event type
    if (edge.label) {
      let labelColor;
      switch(edge.eventType) {
        case 'noMatchEventName': 
          labelColor = '#F44336'; // Red
          break;
        case 'defaultEventName':
          labelColor = '#FF9800'; // Orange
          break;
        case 'validAddress':
        case 'invalidAddress':
          labelColor = '#9C27B0'; // Purple
          break;
        default:
          labelColor = '#2196F3'; // Blue
      }
      
      this.g.append('text')
        .attr('class', 'event-label')
        .attr('x', midX)
        .attr('y', (sourceMidY + targetMidY) / 2 - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', labelColor)
        .text(edge.label);
    }
  }
  
  toggleNode(node, x, y) {
    console.log(`Toggling node: ${node.name}`);
    console.log(`Node ID: ${node.id}`);
    // Toggle expanded state
    if (this.expandedNodes.has(node.id)) {
      this.expandedNodes.delete(node.id);
    } else {
      this.expandedNodes.add(node.id);
    }
    console.log(`Expanded nodes: ${Array.from(this.expandedNodes)}`);
    
    // Redraw the graph
    this.clear();
    this.renderRootNodes();

    
    // If expanding, center the view on this node
    if (this.expandedNodes.has(node.id)) {
      const transform = d3.zoomIdentity
        .translate(this.width / 2 - x - this.nodeWidth / 2, this.height / 2 - y - this.nodeHeight / 2)
        .scale(0.8);
      
      this.svg.transition()
        .duration(750)
        .call(this.zoom.transform, transform);
    }
  }
  
  showNodeDetails(node, ruleset) {
    // Get the detail sidebar
    const sidebar = document.getElementById('detail-sidebar');
    
    // Clear previous content
    sidebar.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-btn';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = `${node.name} (${node.type})`;
    
    header.appendChild(title);
    header.appendChild(closeButton);
    sidebar.appendChild(header);
    
    // Add description
    const descSection = document.createElement('div');
    descSection.className = 'sidebar-section';
    descSection.innerHTML = `
      <h4>Description</h4>
      <p>${node.description || 'No description available'}</p>
    `;
    sidebar.appendChild(descSection);
    
    // Add triggers
    const triggersSection = document.createElement('div');
    triggersSection.className = 'sidebar-section';
    let triggersHtml = `<h4>Triggers</h4>`;
    
    if (ruleset && ruleset.triggers && ruleset.triggers.length > 0) {
      triggersHtml += `<ul>`;
      ruleset.triggers.forEach(trigger => {
        triggersHtml += `<li>Status: ${trigger.status}</li>`;
      });
      triggersHtml += `</ul>`;
    } else {
      triggersHtml += `<p>No triggers defined</p>`;
    }
    
    triggersSection.innerHTML = triggersHtml;
    sidebar.appendChild(triggersSection);
    
    // Add rules
    const rulesSection = document.createElement('div');
    rulesSection.className = 'sidebar-section';
    let rulesHtml = `<h4>Rules</h4>`;
    
    if (ruleset && ruleset.rules && ruleset.rules.length > 0) {
      rulesHtml += `<ul>`;
      ruleset.rules.forEach(rule => {
        rulesHtml += `<li>
          <div class="rule-name">${rule.name}</div>`;
          
        if (rule.props) {
          rulesHtml += `<div class="rule-props">
            <pre>${JSON.stringify(rule.props, null, 2)}</pre>
          </div>`;
        }
        
        rulesHtml += `</li>`;
      });
      rulesHtml += `</ul>`;
    } else {
      rulesHtml += `<p>No rules defined</p>`;
    }
    
    rulesSection.innerHTML = rulesHtml;
    sidebar.appendChild(rulesSection);
    
    // Add user actions if available
    if (ruleset && ruleset.userActions && ruleset.userActions.length > 0) {
      const actionsSection = document.createElement('div');
      actionsSection.className = 'sidebar-section';
      let actionsHtml = `<h4>User Actions</h4><ul>`;
      
      ruleset.userActions.forEach(action => {
        actionsHtml += `<li>
          <pre>${JSON.stringify(action, null, 2)}</pre>
        </li>`;
      });
      
      actionsHtml += `</ul>`;
      actionsSection.innerHTML = actionsHtml;
      sidebar.appendChild(actionsSection);
    }
    
    // Show the sidebar
    sidebar.classList.add('open');
  }
  
  zoomIn() {
    this.svg.transition()
      .duration(300)
      .call(this.zoom.scaleBy, 1.2);
  }
  
  zoomOut() {
    this.svg.transition()
      .duration(300)
      .call(this.zoom.scaleBy, 0.8);
  }
  
  fitToScreen() {
    const bounds = this.g.node().getBBox();
    const padding = 40;
    
    const scale = Math.min(
      (this.width - padding * 2) / bounds.width,
      (this.height - padding * 2) / bounds.height
    ) * 0.9;
    
    const transform = d3.zoomIdentity
      .translate(
        this.width / 2 - (bounds.x + bounds.width / 2) * scale,
        this.height / 2 - (bounds.y + bounds.height / 2) * scale
      )
      .scale(scale);
    
    this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, transform);
  }

  // Add method to wrap text
  wrapText(text, maxLength) {
    if (!text) return [''];
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = currentLine.length + word.length + 1;
        
        if (width <= maxLength) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    
    lines.push(currentLine);
    return lines.slice(0, 3); // Limit to 3 lines
  }
}

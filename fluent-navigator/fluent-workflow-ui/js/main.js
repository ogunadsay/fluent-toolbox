// Initialize with default starting points
let startingPoints = {};
const parser = new WorkflowParser(startingPoints);
const visualizer = new WorkflowVisualizer('workflow-svg');

// Function to update starting point inputs in UI
function updateStartingPointInputs(entityTypes) {
  const container = document.getElementById('starting-points-container');
  container.innerHTML = ''; // Clear current inputs
  
  entityTypes.forEach(type => {
    const row = document.createElement('div');
    row.className = 'starting-point-row';
    
    const typeLabel = document.createElement('div');
    typeLabel.className = 'starting-point-type';
    typeLabel.textContent = type;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'starting-point-input';
    input.id = `starting-point-${type}`;
    input.value = startingPoints[type] || 'CREATE'; // Default to CREATE
    
    row.appendChild(typeLabel);
    row.appendChild(input);
    container.appendChild(row);
  });
}

// Function to collect starting points from inputs
function collectStartingPoints() {
  const inputs = document.querySelectorAll('.starting-point-input');
  const newStartingPoints = {};
  
  inputs.forEach(input => {
    const type = input.id.replace('starting-point-', '');
    const value = input.value.trim();
    if (value) {
      newStartingPoints[type] = value;
    }
  });
  
  return newStartingPoints;
}

// Function to visualize the workflow
function visualizeWorkflow() {
  const jsonInput = document.getElementById('json-input').value;
  if (!jsonInput) return;
  
  const graphData = parser.parseJSON(jsonInput);
  if (graphData) {
    visualizer.renderGraph(graphData);
    
    // Update starting point inputs based on entity types
    updateStartingPointInputs(graphData.entityTypes);
  }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Visualize button
  document.getElementById('visualize-btn').addEventListener('click', visualizeWorkflow);
  
  // Update starting points button
  document.getElementById('update-starting-points').addEventListener('click', () => {
    startingPoints = collectStartingPoints();
    parser.startingPoints = startingPoints;
    visualizeWorkflow();
  });
  
  // Reset button
  document.getElementById('reset-btn').addEventListener('click', () => {
    document.getElementById('json-input').value = '';
    visualizer.clear();
    document.getElementById('starting-points-container').innerHTML = '';
  });
  
  // Zoom controls
  document.getElementById('zoom-in').addEventListener('click', () => visualizer.zoomIn());
  document.getElementById('zoom-out').addEventListener('click', () => visualizer.zoomOut());
  document.getElementById('fit-screen').addEventListener('click', () => visualizer.fitToScreen());

  // Pre-populate the textarea with template.json content
  fetch('template.json')
    .then(response => {
      if (!response.ok) throw new Error('Template not found');
      return response.text();
    })
    .then(data => {
      document.getElementById('json-input').value = data;
    })
    .catch(error => {
      console.log('Could not load template:', error);
    });
});

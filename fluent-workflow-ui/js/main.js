document.addEventListener('DOMContentLoaded', () => {
  // Initialize parser and visualizer
  const parser = new WorkflowParser();
  const visualizer = new WorkflowVisualizer('workflow-svg');
  
  // DOM elements
  const jsonInput = document.getElementById('json-input');
  const visualizeBtn = document.getElementById('visualize-btn');
  const resetBtn = document.getElementById('reset-btn');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const fitScreenBtn = document.getElementById('fit-screen');
  
  // Event listeners
  visualizeBtn.addEventListener('click', () => {
    const jsonText = jsonInput.value.trim();
    if (!jsonText) {
      alert('Please paste a workflow template JSON in the textarea.');
      return;
    }
    
    try {
      const graphData = parser.parseJSON(jsonText);
      if (graphData) {
        visualizer.renderGraph(graphData);
        visualizer.fitToScreen();
      } else {
        alert('Could not parse the workflow template. Please check the format.');
      }
    } catch (error) {
      console.error('Visualization error:', error);
      alert('Error visualizing the workflow: ' + error.message);
    }
  });
  
  resetBtn.addEventListener('click', () => {
    jsonInput.value = '';
    visualizer.clear();
  });
  
  zoomInBtn.addEventListener('click', () => visualizer.zoomIn());
  zoomOutBtn.addEventListener('click', () => visualizer.zoomOut());
  fitScreenBtn.addEventListener('click', () => visualizer.fitToScreen());

  // Pre-populate the textarea with template.json content
  fetch('/template.json')
    .then(response => {
      if (!response.ok) throw new Error('Template not found');
      return response.text();
    })
    .then(data => {
      jsonInput.value = data;
    })
    .catch(error => {
      console.log('Could not load template:', error);
    });
});

class WorkflowParser {
  constructor() {
    this.nodeMap = new Map();
    this.edges = [];
    this.typeRoots = {};
  }

  parseJSON(jsonString) {
    try {
      const workflow = JSON.parse(jsonString);
      return this.processWorkflow(workflow);
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return null;
    }
  }

  processWorkflow(workflow) {
    this.nodeMap.clear();
    this.edges = [];
    this.typeRoots = {};

    if (!workflow || !workflow.rulesets || !Array.isArray(workflow.rulesets)) {
      console.error("Invalid workflow structure");
      return null;
    }

    // First pass: create nodes for all rulesets
    workflow.rulesets.forEach((ruleset) => {
      if (ruleset.subtype === "FAKE") {
        return;
      }
      const nodeId = this.getNodeId(ruleset);

      // Create node for the ruleset with more detailed information
      const node = {
        id: nodeId,
        name: ruleset.name,
        type: ruleset.type,
        subtype: ruleset.subtype || "DEFAULT",
        description: ruleset.description || "",
        children: [],
        eventType: ruleset.eventType || "NORMAL",
        triggers: ruleset.triggers || [],
        rules: ruleset.rules || [],
        userActions: ruleset.userActions || [],
      };

      this.nodeMap.set(nodeId, node);

      // If this is a CREATE ruleset, mark it as a root for its type
      if (ruleset.name === "CREATE") {
        this.typeRoots[ruleset.type] = node;
      }
    });

    // Second pass: create edges between nodes based on events
    workflow.rulesets.forEach((ruleset) => {
      const sourceId = this.getNodeId(ruleset);
      const sourceNode = this.nodeMap.get(sourceId);

      if (!sourceNode) return;

      // Extract all events from the rules
      const events = this.extractEventsFromRules(ruleset.rules || []);

      // For each event, find target nodes and create edges
      events.forEach((event) => {
        // Find all rulesets with matching name
        workflow.rulesets.forEach((targetRuleset) => {
          if (
            targetRuleset.name === event.name &&
            this.getNodeId(targetRuleset) !== sourceId
          ) {
            const targetId = this.getNodeId(targetRuleset);
            const targetNode = this.nodeMap.get(targetId);

            if (targetNode) {
              // Create an edge
              const edge = {
                source: sourceId,
                target: targetId,
                eventType: event.type,
                label: event.name,
              };

              // Check if this edge already exists
              const duplicateEdge = this.edges.find(
                (e) =>
                  e.source === edge.source &&
                  e.target === edge.target &&
                  e.label === edge.label
              );

              if (!duplicateEdge) {
                this.edges.push(edge);

                // Add the target as a child of the source
                if (
                  !sourceNode.children.some((child) => child.id === targetId)
                ) {
                  sourceNode.children.push(targetNode);
                }
              }
            }
          }
        });
      });
    });

    return {
      nodes: Array.from(this.nodeMap.values()),
      edges: this.edges,
      rootNodes: Object.values(this.typeRoots),
      typeRoots: this.typeRoots,
    };
  }

  getNodeId(ruleset) {
    return `${ruleset.type}_${ruleset.name}${
      ruleset.subtype ? "_" + ruleset.subtype : ""
    }`;
  }

  extractEventsFromRules(rules) {
    const events = [];

    rules.forEach((rule) => {
      if (!rule.props) return;

      // Check for various event properties that might contain event references
      const eventProps = [
        { key: "eventName", type: "eventName" },
        { key: "noMatchEventName", type: "noMatchEventName" },
        { key: "defaultEventName", type: "defaultEventName" },
        { key: "featureEnabledEvent", type: "featureEnabledEvent" },
        { key: "featureDisabledEvent", type: "featureDisabledEvent" },
        { key: "validAddress", type: "validAddress" },
        { key: "invalidAddress", type: "invalidAddress" },
      ];

      eventProps.forEach((prop) => {
        if (rule.props[prop.key]) {
          events.push({
            name: rule.props[prop.key],
            type: prop.type,
          });
        }
      });
    });

    return events;
  }
}

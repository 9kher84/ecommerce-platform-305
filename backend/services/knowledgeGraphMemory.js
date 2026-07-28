/**
 * Knowledge Graph Memory Engine
 * Relational memory representation tracking complex multi-dimensional entities, risks, delays, and organizational relationships.
 */
class KnowledgeGraphMemory {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  /**
   * Add a node to the Knowledge Graph
   */
  addNode(id, type, properties = {}) {
    this.nodes.set(id, { id, type, properties, createdAt: new Date().toISOString() });
    return this.nodes.get(id);
  }

  /**
   * Add a relational edge between two nodes
   */
  addEdge(sourceId, targetId, relationType, metadata = {}) {
    const edge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sourceId,
      targetId,
      relationType, // 'DELAYED_PROJECT' | 'INCURRED_PENALTY' | 'DISSATISFIED_CEO' | 'PREFERRED_SUPPLIER'
      metadata,
      createdAt: new Date().toISOString()
    };
    this.edges.push(edge);
    return edge;
  }

  /**
   * Query relational graph path
   */
  queryRelations(nodeId) {
    const connectedEdges = this.edges.filter(e => e.sourceId === nodeId || e.targetId === nodeId);
    const relatedNodeIds = connectedEdges.map(e => e.sourceId === nodeId ? e.targetId : e.sourceId);

    const relatedNodes = relatedNodeIds.map(id => this.nodes.get(id)).filter(Boolean);
    return {
      node: this.nodes.get(nodeId),
      edges: connectedEdges,
      relatedNodes
    };
  }
}

const knowledgeGraphMemory = new KnowledgeGraphMemory();

module.exports = {
  KnowledgeGraphMemory,
  knowledgeGraphMemory
};

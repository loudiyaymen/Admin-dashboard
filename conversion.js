const fs = require("fs");

const nodesData = JSON.parse(fs.readFileSync("nodes_tutorial.geojson", "utf8"));
const pathsData = JSON.parse(fs.readFileSync("paths_tutorial.geojson", "utf8"));

const graph = {};
const coordMap = {};

const formatCoord = (x, y) => `${x.toFixed(3)},${y.toFixed(3)}`;

nodesData.features.forEach((f) => {
  const props = f.properties;
  const coords = f.geometry.coordinates;
  const x = coords[0];
  const y = coords[1];

  const id = props.node_id || props["node_id "];
  const type = props.type || props["type "];
  const label = props.label || props["label "] || "";

  graph[id] = {
    id: id,
    type: type,
    label: label,
    x: x,
    y: y,
    neighbors: {},
  };

  coordMap[formatCoord(x, y)] = id;
});

pathsData.features.forEach((f) => {
  const coords = f.geometry.coordinates;

  const startPt = coords[0];
  const endPt = coords[coords.length - 1];

  const startX = startPt[0];
  const startY = startPt[1];
  const endX = endPt[0];
  const endY = endPt[1];

  const weight = Math.hypot(endX - startX, endY - startY);

  const startNodeID = coordMap[formatCoord(startX, startY)];
  const endNodeID = coordMap[formatCoord(endX, endY)];

  if (startNodeID && endNodeID && startNodeID !== endNodeID) {
    graph[startNodeID].neighbors[endNodeID] = weight;
    graph[endNodeID].neighbors[startNodeID] = weight;
  }
});

fs.writeFileSync("optimized_graph.json", JSON.stringify(graph, null, 2));
console.log("Graph Created");

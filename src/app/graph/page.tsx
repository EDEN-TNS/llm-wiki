"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import { GitFork } from "lucide-react";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  category?: string;
  linkCount: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

const CATEGORY_COLORS: Record<string, string> = {
  entity: "#3b82f6",
  concept: "#8b5cf6",
  source: "#10b981",
  synthesis: "#f59e0b",
  comparison: "#ef4444",
  uncategorized: "#6b7280",
};

export default function GraphPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [data, setData] = useState<GraphData | null>(null);

  useEffect(() => {
    fetch("/api/graph").then(r => r.json()).then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;
    if (data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const simulation = d3
      .forceSimulation<GraphNode>(data.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(data.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    const g = svg.append("g");

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => g.attr("transform", event.transform))
    );

    // Links
    const link = g
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6);

    // Nodes
    const node = g
      .selectAll("g.node")
      .data(data.nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("cursor", "pointer")
      .on("click", (_, d) => router.push(`/wiki/${d.id}`))
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .append("circle")
      .attr("r", d => 6 + Math.min(d.linkCount * 2, 14))
      .attr("fill", d => CATEGORY_COLORS[d.category || "uncategorized"])
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2);

    node
      .append("text")
      .text(d => d.title)
      .attr("dx", d => 10 + Math.min(d.linkCount * 2, 14))
      .attr("dy", 4)
      .attr("fill", "#94a3b8")
      .attr("font-size", "11px");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [data, router]);

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <GitFork className="w-6 h-6" /> Wiki Graph
        </h1>
        <div className="flex gap-4 mt-2">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <span key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden">
        {data && data.nodes.length > 0 ? (
          <svg ref={svgRef} className="w-full h-full" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <GitFork className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No wiki pages to visualize yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

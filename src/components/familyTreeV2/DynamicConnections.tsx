import React, { Fragment } from "react";
import { Heart, HeartCrack } from "lucide-react";
import { FamilyGraph, NodeRect } from "../../lib/familyTreeV2Types";
import { CARD_W, CARD_H } from "./DraggablePersonCard";

const COLORS = {
  link: "#C9CCD4",
  strong: "#AEB3BE",
};

interface DynamicConnectionsProps {
  graph: FamilyGraph;
  positions: Map<string, { x: number; y: number }>;
}

// Helper functions for connection points
const topPort = (pos: { x: number; y: number }) => ({
  x: Math.round(pos.x + CARD_W / 2),
  y: Math.round(pos.y - 8)
});

const bottomPort = (pos: { x: number; y: number }) => ({
  x: Math.round(pos.x + CARD_W / 2),
  y: Math.round(pos.y + CARD_H + 8)
});

const centerPort = (pos: { x: number; y: number }) => ({
  x: Math.round(pos.x + CARD_W / 2),
  y: Math.round(pos.y + CARD_H / 2)
});

export default function DynamicConnections({ graph, positions }: DynamicConnectionsProps) {
  const drawConnection = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const midX = (from.x + to.x) / 2;
    const path = `M${from.x},${from.y} L${midX},${from.y} L${midX},${to.y} L${to.x},${to.y}`;
    return (
      <path
        d={path}
        stroke={COLORS.link}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  };

  const drawSpouseLine = (pos1: { x: number; y: number }, pos2: { x: number; y: number }, isDivorced: boolean = false) => {
    const center1 = centerPort(pos1);
    const center2 = centerPort(pos2);
    const midX = (center1.x + center2.x) / 2;
    const midY = (center1.y + center2.y) / 2;
    
    return (
      <Fragment>
        {/* Horizontal line between spouses */}
        <path
          d={`M${center1.x},${center1.y} L${center2.x},${center2.y}`}
          stroke={COLORS.strong}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Heart or broken heart icon */}
        <circle 
          cx={midX} 
          cy={midY} 
          r="12" 
          fill={isDivorced ? "#6B7280" : "#E91E63"} 
          stroke="white" 
          strokeWidth="2"
        />
        <foreignObject 
          x={midX - 8} 
          y={midY - 8} 
          width="16" 
          height="16"
        >
          {isDivorced ? (
            <HeartCrack 
              size={16} 
              color="white" 
              fill="white"
              style={{ display: 'block' }}
            />
          ) : (
            <Heart 
              size={16} 
              color="white" 
              fill="white"
              style={{ display: 'block' }}
            />
          )}
        </foreignObject>
      </Fragment>
    );
  };

  const drawParentChildConnection = (parentPos: { x: number; y: number }, childPos: { x: number; y: number }) => {
    const parentBottom = bottomPort(parentPos);
    const childTop = topPort(childPos);
    
    return drawConnection(parentBottom, childTop);
  };

  const drawMultiParentConnection = (parent1Pos: { x: number; y: number }, parent2Pos: { x: number; y: number }, childrenPositions: { x: number; y: number }[]) => {
    if (childrenPositions.length === 0) return null;

    const parent1Center = centerPort(parent1Pos);
    const parent2Center = centerPort(parent2Pos);
    const spouseMidX = (parent1Center.x + parent2Center.x) / 2;
    const spouseMidY = (parent1Center.y + parent2Center.y) / 2;
    
    // Find average child position for the rail
    const avgChildX = childrenPositions.reduce((sum, pos) => sum + pos.x + CARD_W / 2, 0) / childrenPositions.length;
    const minChildY = Math.min(...childrenPositions.map(pos => pos.y));
    const railY = minChildY - 40;
    
    return (
      <Fragment>
        {/* Vertical drop from spouse midpoint to rail */}
        <path
          d={`M${spouseMidX},${spouseMidY + 14} L${spouseMidX},${railY} L${avgChildX},${railY}`}
          stroke={COLORS.strong}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Horizontal rail */}
        <path
          d={`M${Math.min(avgChildX, ...childrenPositions.map(pos => pos.x + CARD_W / 2))},${railY} L${Math.max(avgChildX, ...childrenPositions.map(pos => pos.x + CARD_W / 2))},${railY}`}
          stroke={COLORS.link}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Drops to each child */}
        {childrenPositions.map((childPos, index) => {
          const childTop = topPort(childPos);
          return (
            <path
              key={index}
              d={`M${childTop.x},${railY} L${childTop.x},${childTop.y}`}
              stroke={COLORS.link}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </Fragment>
    );
  };

  return (
    <g>
      {/* Draw spouse connections */}
      {Array.from(graph.spouses.entries()).map(([personId, spouseIds]) => {
        const personPos = positions.get(personId);
        if (!personPos) return null;
        
        return Array.from(spouseIds).map(spouseId => {
          const spousePos = positions.get(spouseId);
          if (!spousePos || personId >= spouseId) return null; // Avoid duplicate lines
          
          return (
            <g key={`spouse-${personId}-${spouseId}`}>
              {drawSpouseLine(personPos, spousePos, false)}
            </g>
          );
        });
      })}

      {/* Draw divorced connections */}
      {Array.from(graph.divorced.entries()).map(([personId, exIds]) => {
        const personPos = positions.get(personId);
        if (!personPos) return null;
        
        return Array.from(exIds).map(exId => {
          const exPos = positions.get(exId);
          if (!exPos || personId >= exId) return null; // Avoid duplicate lines
          
          return (
            <g key={`divorced-${personId}-${exId}`}>
              {drawSpouseLine(personPos, exPos, true)}
            </g>
          );
        });
      })}

      {/* Draw parent-child connections */}
      {graph.unions.map(union => {
        const parent1Pos = positions.get(union.a);
        const parent2Pos = positions.get(union.b);
        
        if (!parent1Pos || !parent2Pos) return null;
        
        const childrenPositions = union.children
          .map(childId => positions.get(childId))
          .filter(pos => pos !== undefined) as { x: number; y: number }[];
        
        if (childrenPositions.length === 0) return null;
        
        // Check if this is a divorced couple
        const isDivorced = graph.divorced.get(union.a)?.has(union.b) || graph.divorced.get(union.b)?.has(union.a);
        
        return (
          <g key={union.id}>
            {drawMultiParentConnection(parent1Pos, parent2Pos, childrenPositions)}
          </g>
        );
      })}

      {/* Draw single parent connections */}
      {Array.from(graph.childrenOf.entries()).map(([parentId, childIds]) => {
        const parentPos = positions.get(parentId);
        if (!parentPos) return null;
        
        // Check if this parent is part of a union (already handled above)
        const isInUnion = graph.unions.some(union => union.a === parentId || union.b === parentId);
        if (isInUnion) return null;
        
        return childIds.map(childId => {
          const childPos = positions.get(childId);
          if (!childPos) return null;
          
          return (
            <g key={`single-parent-${parentId}-${childId}`}>
              {drawParentChildConnection(parentPos, childPos)}
            </g>
          );
        });
      })}
    </g>
  );
}
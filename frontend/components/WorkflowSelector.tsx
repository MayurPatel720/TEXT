"use client";

import React from "react";
import { Sparkles, Shirt, Layers, User, Palette, Grid3X3, Edit3, Droplets, Ribbon, Tag } from "lucide-react";

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  inputs: 1 | 2;
  promptTemplate: string;
  color: string;
}

export const WORKFLOWS: Workflow[] = [
  {
    id: "creative_edit",
    name: "Creative Edit",
    description: "General textile design editing",
    icon: <Edit3 className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "",
    color: "#1B3A6B"
  },
  {
    id: "apply_pattern",
    name: "Pattern Apply",
    description: "Apply design to fabric surface",
    icon: <Layers className="w-5 h-5" />,
    inputs: 2,
    promptTemplate: "Apply the pattern from the second image onto the fabric surface, maintaining realistic folds and texture",
    color: "#8B5CF6"
  },
  {
    id: "change_material",
    name: "Change Material",
    description: "Cotton → Silk → Velvet",
    icon: <Shirt className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Change the fabric material to premium [silk/velvet/cotton/linen], keeping exact same pattern, color, and drape",
    color: "#EC4899"
  },
  {
    id: "model_mockup",
    name: "Model Try-On",
    description: "Design on model photoshoot",
    icon: <User className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Generate an elegant Indian fashion model wearing this exact garment, professional studio lighting, full body shot, confident pose",
    color: "#10B981"
  },
  {
    id: "extract_pattern",
    name: "Extract Pattern",
    description: "Flat tileable pattern from photo",
    icon: <Grid3X3 className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Extract the fabric pattern and render it as a flat, seamless, tileable design suitable for textile manufacturing",
    color: "#6366F1"
  },
  {
    id: "color_swap",
    name: "Color Swap",
    description: "Change colorways precisely",
    icon: <Droplets className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Change the fabric colorway, keeping exact same pattern, weave texture, and design elements",
    color: "#D4A843"
  },
  {
    id: "embroidery_effect",
    name: "Embroidery",
    description: "Embroidery / zardozi look",
    icon: <Ribbon className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Transform this design into detailed embroidery with realistic thread texture, shadows, and 3D depth",
    color: "#C85A48"
  },
  {
    id: "batch_colorways",
    name: "Colorways",
    description: "Multi-color variations",
    icon: <Palette className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Generate this design in a [warm earth tone/cool blue/jewel tone/pastel] color palette, maintaining exact pattern",
    color: "#D946EF"
  }
];

interface WorkflowSelectorProps {
  selected: string;
  onSelect: (workflowId: string) => void;
}

export function WorkflowSelector({ selected, onSelect }: WorkflowSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-sm font-medium text-[var(--text-primary)]">Choose Generation Type</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {WORKFLOWS.map((workflow) => (
          <button
            key={workflow.id}
            onClick={() => onSelect(workflow.id)}
            className={`
              relative p-3 rounded-xl text-left transition-all duration-200
              ${selected === workflow.id 
                ? 'bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border-2 border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10' 
                : 'bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]'
              }
            `}
          >
            <div className="flex items-start gap-2">
              <div 
                className={`
                  p-1.5 rounded-lg
                  ${selected === workflow.id ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}
                `}
                style={{ color: selected === workflow.id ? workflow.color : undefined }}
              >
                {workflow.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {workflow.name}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] truncate">
                  {workflow.description}
                </p>
              </div>
            </div>
            
            {/* Input indicator */}
            <div className={`
              absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full
              ${workflow.inputs === 2 ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'}
            `}>
              {workflow.inputs === 2 ? '2 IMG' : '1 IMG'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

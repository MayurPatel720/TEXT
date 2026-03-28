"use client";

import React from "react";
import { Sparkles, Shirt, Layers, User, Palette, Grid3X3, Edit3, Droplets, ImageIcon, Move3d, PaintBucket, Ribbon, Clock, Target, Waves } from "lucide-react";

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
    id: "apply_pattern",
    name: "Apply Pattern",
    description: "Apply design pattern to fabric",
    icon: <Layers className="w-5 h-5" />,
    inputs: 2,
    promptTemplate: "Apply the pattern from the second image to the fabric of the garment in the first image, maintaining exact garment shape, folds, and lighting",
    color: "#8B5CF6"
  },
  {
    id: "change_material",
    name: "Change Material",
    description: "Change fabric type (cotton → silk)",
    icon: <Shirt className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Change the material of this garment to [silk/velvet/cotton/linen], keeping exact same design, color, and fit",
    color: "#EC4899"
  },
  {
    id: "merge_images",
    name: "Merge Images",
    description: "Combine person + scene",
    icon: <Sparkles className="w-5 h-5" />,
    inputs: 2,
    promptTemplate: "Place the person from the first image [sitting on/standing by/wearing] the item from the second image, maintain exact facial features and clothing style",
    color: "#F59E0B"
  },
  {
    id: "model_mockup",
    name: "Model Mockup",
    description: "Put design on model for Instagram",
    icon: <User className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Generate an elegant Indian fashion model wearing this exact garment, professional studio lighting, Instagram-ready photoshoot, full body shot, confident pose",
    color: "#10B981"
  },
  {
    id: "style_transfer",
    name: "Style Transfer",
    description: "Apply artistic styles",
    icon: <Palette className="w-5 h-5" />,
    inputs: 2,
    promptTemplate: "Transform the design using the artistic style from the second image while maintaining the structure and composition of the first image",
    color: "#3B82F6"
  },
  {
    id: "extract_pattern",
    name: "Extract Pattern",
    description: "Get flat pattern from photo",
    icon: <Grid3X3 className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Extract the fabric pattern from this garment image and render it as a flat, seamless, tileable pattern on a plain surface, suitable for textile design software",
    color: "#6366F1"
  },
  {
    id: "creative_edit",
    name: "Creative Edit",
    description: "General editing",
    icon: <Edit3 className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "",
    color: "#64748B"
  },
  {
    id: "color_swap",
    name: "Color Swap",
    description: "Change fabric colors precisely",
    icon: <Droplets className="w-5 h-5" />,
    inputs: 1,
    promptTemplate: "Change the color of the fabric from [original color] to [target color], keeping exact same pattern, texture, garment shape, and lighting",
    color: "#F43F5E"
  },
  // {
  //   id: "background_change",
  //   name: "Background Change",
  //   description: "Replace photo background",
  //   icon: <ImageIcon className="w-5 h-5" />,
  //   inputs: 1,
  //   promptTemplate: "Place this garment/model in a [studio/outdoor/luxury boutique/runway] setting with professional lighting, keeping the subject exactly the same",
  //   color: "#0EA5E9"
  // },
  // {
  //   id: "draping_sim",
  //   name: "Draping Sim",
  //   description: "Drape flat pattern on model",
  //   icon: <Move3d className="w-5 h-5" />,
  //   inputs: 2,
  //   promptTemplate: "Drape the fabric pattern from the first image onto the model/mannequin in the second image, showing realistic folds, wrinkles, and how the fabric falls naturally",
  //   color: "#A855F7"
  // },
  // {
  //   id: "batch_colorways",
  //   name: "Batch Colorways",
  //   description: "Multiple color variations",
  //   icon: <PaintBucket className="w-5 h-5" />,
  //   inputs: 1,
  //   promptTemplate: "Generate this same design in a [warm earth tone/cool blue/vibrant jewel tone/pastel] color palette, maintaining exact same pattern and garment structure",
  //   color: "#D946EF"
  // },
  // {
  //   id: "embroidery_effect",
  //   name: "Embroidery Effect",
  //   description: "Add embroidery/texture look",
  //   icon: <Ribbon className="w-5 h-5" />,
  //   inputs: 1,
  //   promptTemplate: "Transform this design into detailed [thread embroidery/beadwork/sequin work/zardozi] on fabric, with realistic thread texture, shadows, and 3D depth",
  //   color: "#E11D48"
  // },
  // {
  //   id: "age_wear",
  //   name: "Age & Wear",
  //   description: "Simulate aging/distressing",
  //   icon: <Clock className="w-5 h-5" />,
  //   inputs: 1,
  //   promptTemplate: "Show this garment after [stone washing/acid washing/sun fading/vintage aging], with realistic wear patterns, softened colors, and natural distressing",
  //   color: "#78716C"
  // },
  // {
  //   id: "print_placement",
  //   name: "Print Placement",
  //   description: "Place print/logo on garment",
  //   icon: <Target className="w-5 h-5" />,
  //   inputs: 2,
  //   promptTemplate: "Place the print/logo from the second image onto the [chest/back/sleeve/all-over] of the garment in the first image, following fabric folds and perspective naturally",
  //   color: "#F97316"
  // },
  // {
  //   id: "fabric_texture",
  //   name: "Fabric Texture",
  //   description: "Generate realistic texture",
  //   icon: <Waves className="w-5 h-5" />,
  //   inputs: 1,
  //   promptTemplate: "Generate a photorealistic, seamless, tileable [silk/denim/tweed/lace/velvet] fabric texture based on this reference, suitable for textile design software",
  //   color: "#14B8A6"
  // }
];

interface WorkflowSelectorProps {
  selected: string;
  onSelect: (workflow: Workflow) => void;
}

export default function WorkflowSelector({ selected, onSelect }: WorkflowSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-sm font-medium text-white">Choose Generation Type</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {WORKFLOWS.map((workflow) => (
          <button
            key={workflow.id}
            onClick={() => onSelect(workflow)}
            className={`
              relative p-3 rounded-xl text-left transition-all duration-200
              ${selected === workflow.id 
                ? 'bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/5 border-2 border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10' 
                : 'bg-[#1a1a1a] border border-white/10 hover:border-white/20 hover:bg-white/5'
              }
            `}
          >
            <div className="flex items-start gap-2">
              <div 
                className={`
                  p-1.5 rounded-lg
                  ${selected === workflow.id ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-white/5 text-white/60'}
                `}
                style={{ color: selected === workflow.id ? workflow.color : undefined }}
              >
                {workflow.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${selected === workflow.id ? 'text-white' : 'text-white/80'}`}>
                  {workflow.name}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {workflow.description}
                </p>
              </div>
            </div>
            
            {/* Input indicator */}
            <div className={`
              absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full
              ${workflow.inputs === 2 ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-white/10 text-white/40'}
            `}>
              {workflow.inputs === 2 ? '2 IMG' : '1 IMG'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

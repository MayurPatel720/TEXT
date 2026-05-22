// Run: node scripts/generate-hero-images.mjs
// Requires FAL_KEY in environment

import { fal } from "@fal-ai/client";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const prompts = JSON.parse(
  readFileSync(resolve(__dirname, "hero-prompts.json"), "utf-8")
);

const falKey = process.env.FAL_KEY;
if (!falKey) {
  console.error("❌ FAL_KEY not found. Set it in .env.local or export FAL_KEY=...");
  process.exit(1);
}
fal.config({ credentials: falKey });

const OUTPUT_DIR = resolve(__dirname, "../public/hero");
mkdirSync(OUTPUT_DIR, { recursive: true });

async function downloadImage(url, filePath) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(filePath, buffer);
}

async function generate() {
  for (const item of prompts) {
    console.log(`\n🎨 ${item.category} — ${item.label}`);

    // Generate input (plain fabric)
    console.log(`  📥 Generating input image...`);
    try {
      const inputResult = await fal.subscribe("fal-ai/seedream-v4", {
        input: {
          prompt: item.input_prompt,
          aspect_ratio: item.aspect_ratio,
          num_images: 1,
          num_inference_steps: 20,
        },
        logs: false,
      });
      const inputUrl = inputResult.data?.images?.[0]?.url;
      if (inputUrl) {
        await downloadImage(inputUrl, resolve(OUTPUT_DIR, `${item.id}-input.png`));
        console.log(`  ✅ Input saved: ${item.id}-input.png`);
      }
    } catch (err) {
      console.error(`  ❌ Input failed: ${err.message}`);
    }

    // Generate output (transformed design)
    console.log(`  📤 Generating output image...`);
    try {
      const outputResult = await fal.subscribe("fal-ai/seedream-v4", {
        input: {
          prompt: item.output_prompt,
          aspect_ratio: item.aspect_ratio,
          num_images: 1,
          num_inference_steps: 30,
        },
        logs: false,
      });
      const outputUrl = outputResult.data?.images?.[0]?.url;
      if (outputUrl) {
        await downloadImage(outputUrl, resolve(OUTPUT_DIR, `${item.id}-output.png`));
        console.log(`  ✅ Output saved: ${item.id}-output.png`);
      }
    } catch (err) {
      console.error(`  ❌ Output failed: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n✅ All done! Images saved to public/hero/");
  console.log("HeroGallery.tsx already references /hero/ paths — restart the dev server to see them.");
}

generate();

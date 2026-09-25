import type { NextConfig } from 'next'
import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin'

const withVanillaExtract = createVanillaExtractPlugin()

// Standalone output produces a minimal, self-contained server bundle in
// .next/standalone — the shape the Dockerfile expects, so the final image
// doesn't need node_modules or the source tree copied in at runtime.
const nextConfig: NextConfig = {
  output: 'standalone',
  // Next 16 writes AGENTS.md and CLAUDE.md into the repo on every dev start.
  agentRules: false,
}

export default withVanillaExtract(nextConfig)

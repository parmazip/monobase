import type { Config } from "tailwindcss"
import uiConfig from "../../packages/ui/tailwind.config"

const config: Config = {
  darkMode: uiConfig.darkMode,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: uiConfig.theme,
  plugins: uiConfig.plugins,
}

export default config

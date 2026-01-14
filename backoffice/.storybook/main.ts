import type { StorybookConfig } from '@storybook/nextjs-vite'
import svgr from 'vite-plugin-svgr'

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "../public"
  ],
  viteFinal: config => {
    config.plugins ??= []

    const svgrPlugin = svgr({
      svgrOptions: {
        icon: true,
        ref: true,
      }
    })

    svgrPlugin.enforce = 'pre'

    config.plugins.push(svgrPlugin)

    return config
  }
}
export default config
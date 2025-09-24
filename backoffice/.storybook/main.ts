import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],

  addons: [
    "@storybook/addon-onboarding",
    "@storybook/addon-essentials",
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
    "@storybook/addon-mdx-gfm",
    "@newhighsco/storybook-addon-svgr",
    "@storybook/addon-themes"
  ],

  framework: {
    name: "@storybook/nextjs",
    options: {},
  },

  staticDirs: ["../public",
    {
      from: "../src/app", // Path to your font files from the .storybook directory
      to: "/src/app",     // Path where Storybook should serve them from
    },
  ],

  docs: {},

  typescript: {
    reactDocgen: "react-docgen-typescript"
  },
  webpackFinal: async (config) => {
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
  
    config.module.rules
      .filter(rule => rule && rule['test'] && rule['test'].test('.svg'))
      .forEach(rule => rule!['exclude'] = /\.svg$/i)
  
    // Configure .svg files to be loaded with @svgr/webpack
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack'
        }
      ],
    });
  
    return config;
  }
};

export default config;

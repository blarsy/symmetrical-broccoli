import type { Meta, StoryObj } from '@storybook/react'

import { ResourcesList } from './ResourcesList'
import { Resource } from 'i18next'
import React = require('react')

const meta: Meta<typeof ResourcesList> = {
  component: ResourcesList,
}

export default meta
type Story = StoryObj<typeof ResourcesList>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
  render: () => <ResourcesList route={{}}  />,
}
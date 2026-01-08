import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import TestAnim from './TestAnim'
import React  from 'react'

const meta: Meta<typeof TestAnim> = {
    component: TestAnim
}

export default meta
type Story = StoryObj<typeof TestAnim>

export const Default: Story = {
}
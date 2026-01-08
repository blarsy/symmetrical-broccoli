import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import PictureGallery from './PictureGallery'
import { urlFromPublicId } from '@/lib/images'

const meta = {
  component: PictureGallery,
} satisfies Meta<typeof PictureGallery>

export default meta
type Story = StoryObj<typeof meta>

export const OneImage: Story = {
  args: {
    images: [{ alt: 'test-alt', uri: urlFromPublicId('cybvpcvgnitnkk3ijfw5') }],
    onImageClicked: img => console.log(img)
  }
}

export const ThreeImages: Story = {
  args: {
    images: [
      { alt: 'test-alt', uri: urlFromPublicId('cybvpcvgnitnkk3ijfw5') }, 
      { alt: 'test2-alt', uri: urlFromPublicId('qd8y9pdr5c6huud8zvtb') },
      { alt: 'test3-alt', uri: urlFromPublicId('u8d1amzlnnuocezgp5fy') }
    ],
    onImageClicked: img => console.log(img)
  }
}

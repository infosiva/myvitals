import { ImageResponse } from 'next/og'
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
export default function Icon() {
  return new ImageResponse(
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#0d9488,#0f766e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  )
}

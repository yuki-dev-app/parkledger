import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: '#0f172a',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* エメラルドの角丸ボックス */}
      <div
        style={{
          background: '#059669',
          width: '132px',
          height: '132px',
          borderRadius: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: '80px',
            fontWeight: '900',
            fontFamily: 'system-ui, sans-serif',
            lineHeight: 1,
            letterSpacing: '-4px',
          }}
        >
          P
        </span>
      </div>
    </div>,
    { ...size }
  );
}

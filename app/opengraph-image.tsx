import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'HoopLog - 농구팀 관리 시스템'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Cute Basketball Character */}
        <div
          style={{
            display: 'flex',
            position: 'relative',
            marginBottom: '40px',
          }}
        >
          {/* Basketball Body */}
          <div
            style={{
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: '#FF6B35',
              border: '8px solid #2C2C2C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Basketball Lines */}
            <div
              style={{
                position: 'absolute',
                top: '0',
                left: '50%',
                width: '4px',
                height: '100%',
                background: '#2C2C2C',
                transform: 'translateX(-50%)',
                display: 'flex',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '0',
                width: '100%',
                height: '4px',
                background: '#2C2C2C',
                transform: 'translateY(-50%)',
                display: 'flex',
              }}
            />

            {/* Face */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              {/* Eyes */}
              <div
                style={{
                  display: 'flex',
                  gap: '60px',
                  marginTop: '20px',
                }}
              >
                {/* Left Eye */}
                <div
                  style={{
                    width: '40px',
                    height: '50px',
                    background: '#2C2C2C',
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      background: 'white',
                      borderRadius: '50%',
                      marginTop: '8px',
                      display: 'flex',
                    }}
                  />
                </div>
                {/* Right Eye */}
                <div
                  style={{
                    width: '40px',
                    height: '50px',
                    background: '#2C2C2C',
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      background: 'white',
                      borderRadius: '50%',
                      marginTop: '8px',
                      display: 'flex',
                    }}
                  />
                </div>
              </div>

              {/* Smile */}
              <div
                style={{
                  width: '100px',
                  height: '50px',
                  border: '6px solid #2C2C2C',
                  borderTop: 'none',
                  borderRadius: '0 0 100px 100px',
                  display: 'flex',
                }}
              />
            </div>
          </div>

          {/* Arms */}
          <div
            style={{
              position: 'absolute',
              left: '-50px',
              top: '100px',
              width: '60px',
              height: '120px',
              background: '#FF6B35',
              border: '6px solid #2C2C2C',
              borderRadius: '30px',
              transform: 'rotate(-20deg)',
              display: 'flex',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '-50px',
              top: '100px',
              width: '60px',
              height: '120px',
              background: '#FF6B35',
              border: '6px solid #2C2C2C',
              borderRadius: '30px',
              transform: 'rotate(20deg)',
              display: 'flex',
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '80px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '4px 4px 8px rgba(0,0,0,0.3)',
            marginBottom: '20px',
            display: 'flex',
          }}
        >
          HoopLog
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '36px',
            color: 'rgba(255,255,255,0.9)',
            display: 'flex',
          }}
        >
          농구팀 관리 시스템
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

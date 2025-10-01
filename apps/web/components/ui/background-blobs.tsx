'use client'

interface BackgroundBlobsProps {
  className?: string
  intensity?: 'subtle' | 'normal' | 'enhanced'
}

export function BackgroundBlobs({ className = '', intensity = 'normal' }: BackgroundBlobsProps) {
  // Opacity multipliers based on intensity
  const getOpacityMultiplier = () => {
    switch (intensity) {
      case 'subtle': return 0.6
      case 'normal': return 1.0
      case 'enhanced': return 1.3
      default: return 1.0
    }
  }

  const opacityMultiplier = getOpacityMultiplier()

  return (
    <div className={`fixed top-0 left-0 w-full h-full pointer-events-none z-[5] overflow-hidden ${className}`}
         style={{
           willChange: 'transform, opacity',
           transform: 'translateZ(0)'
         }}>
      {/* Creative paint drops */}
      <div className="absolute top-[11%] left-[6%] w-[78px] h-[78px] rounded-full creative-paint-float-1"
           style={{
             background: `radial-gradient(circle at 30% 30%, oklch(0.86 0.135 320 / ${0.45 * opacityMultiplier}), oklch(0.76 0.165 340 / ${0.25 * opacityMultiplier}), transparent 74%)`
           }} />
      <div className="absolute top-[19%] right-[6%] w-[98px] h-[98px] rounded-full creative-paint-float-2"
           style={{
             background: `radial-gradient(ellipse at 40% 60%, oklch(0.815 0.115 60 / ${0.4 * opacityMultiplier}), oklch(0.715 0.145 80 / ${0.22 * opacityMultiplier}), transparent 79%)`,
             animationDelay: '2.8s'
           }} />
      <div className="absolute bottom-[16%] left-[9%] w-[88px] h-[88px] rounded-full creative-paint-float-1"
           style={{
             background: `radial-gradient(circle at 56% 36%, oklch(0.765 0.175 180 / ${0.38 * opacityMultiplier}), oklch(0.665 0.195 200 / ${0.2 * opacityMultiplier}), transparent 71%)`,
             animationDelay: '5.6s'
           }} />
      <div className="absolute bottom-[13%] right-[9%] w-[73px] h-[73px] rounded-full creative-paint-float-2"
           style={{
             background: `radial-gradient(ellipse at 43% 57%, oklch(0.835 0.155 280 / ${0.42 * opacityMultiplier}), oklch(0.735 0.175 300 / ${0.22 * opacityMultiplier}), transparent 77%)`,
             animationDelay: '8.4s'
           }} />
      <div className="absolute top-[62%] right-[11%] w-[83px] h-[83px] rounded-full creative-paint-float-1"
           style={{
             background: `radial-gradient(circle at 50% 50%, oklch(0.805 0.125 40 / ${0.32 * opacityMultiplier}), oklch(0.705 0.145 50 / ${0.15 * opacityMultiplier}), transparent 81%)`,
             animationDelay: '11.2s'
           }} />

      {/* Enhanced color bleeds */}
      <div className="absolute top-[9%] left-[2.5%] w-[140px] h-[118px] enhanced-color-bleed"
           style={{
             background: `linear-gradient(135deg, oklch(0.905 0.095 280 / ${0.2 * opacityMultiplier}), oklch(0.855 0.115 300 / ${0.3 * opacityMultiplier}), oklch(0.805 0.135 320 / ${0.18 * opacityMultiplier}))`,
             borderRadius: '61% 39% 69% 31%',
             filter: 'blur(3.8px)'
           }} />
      <div className="absolute top-[23%] right-[1.5%] w-[120px] h-[138px] enhanced-color-bleed-2"
           style={{
             background: `linear-gradient(-45deg, oklch(0.885 0.075 40 / ${0.25 * opacityMultiplier}), oklch(0.825 0.095 60 / ${0.35 * opacityMultiplier}), oklch(0.765 0.115 80 / ${0.2 * opacityMultiplier}))`,
             borderRadius: '41% 59% 51% 49%',
             filter: 'blur(2.8px)',
             animationDelay: '4.6s'
           }} />
      <div className="absolute bottom-[19%] left-[4%] w-[130px] h-[108px] enhanced-color-bleed"
           style={{
             background: `linear-gradient(90deg, oklch(0.865 0.115 160 / ${0.22 * opacityMultiplier}), oklch(0.805 0.135 180 / ${0.32 * opacityMultiplier}), oklch(0.745 0.155 200 / ${0.18 * opacityMultiplier}))`,
             borderRadius: '69% 31% 59% 41%',
             filter: 'blur(4.2px)',
             animationDelay: '9.2s'
           }} />
      <div className="absolute bottom-[9%] right-[3.5%] w-[115px] h-[125px] enhanced-color-bleed-2"
           style={{
             background: `linear-gradient(180deg, oklch(0.845 0.155 240 / ${0.26 * opacityMultiplier}), oklch(0.785 0.175 260 / ${0.36 * opacityMultiplier}), oklch(0.725 0.195 280 / ${0.2 * opacityMultiplier}))`,
             borderRadius: '51% 49% 69% 31%',
             filter: 'blur(3.8px)',
             animationDelay: '13.8s'
           }} />

      {/* Elegant watercolor spreads */}
      <div className="absolute top-[6%] left-[11%] w-[115px] h-[115px] elegant-watercolor-fade"
           style={{
             background: `radial-gradient(ellipse at center, oklch(0.925 0.055 160 / ${0.25 * opacityMultiplier}), oklch(0.865 0.075 180 / ${0.38 * opacityMultiplier}), oklch(0.805 0.095 200 / ${0.22 * opacityMultiplier}), transparent 86.5%)`,
             borderRadius: '73.5% 26.5% 63.5% 36.5%'
           }} />
      <div className="absolute top-[11%] right-[13.5%] w-[100px] h-[100px] elegant-watercolor-fade"
           style={{
             background: `radial-gradient(circle at 62% 28%, oklch(0.885 0.115 240 / ${0.3 * opacityMultiplier}), oklch(0.825 0.135 260 / ${0.42 * opacityMultiplier}), oklch(0.765 0.155 280 / ${0.25 * opacityMultiplier}), transparent 83.5%)`,
             borderRadius: '36.5% 63.5% 73.5% 26.5%',
             animationDelay: '3.7s'
           }} />
      <div className="absolute bottom-[9%] left-[15%] w-[105px] h-[105px] elegant-watercolor-fade"
           style={{
             background: `radial-gradient(ellipse at 48% 62%, oklch(0.905 0.065 60 / ${0.22 * opacityMultiplier}), oklch(0.845 0.085 80 / ${0.32 * opacityMultiplier}), oklch(0.785 0.105 100 / ${0.18 * opacityMultiplier}), transparent 81.5%)`,
             borderRadius: '53.5% 46.5% 56.5% 43.5%',
             animationDelay: '7.4s'
           }} />
      <div className="absolute bottom-[13.5%] right-[18.5%] w-[90px] h-[90px] elegant-watercolor-fade"
           style={{
             background: `radial-gradient(circle at 33% 42%, oklch(0.865 0.125 320 / ${0.28 * opacityMultiplier}), oklch(0.805 0.145 340 / ${0.38 * opacityMultiplier}), oklch(0.745 0.165 360 / ${0.22 * opacityMultiplier}), transparent 84.5%)`,
             borderRadius: '43.5% 56.5% 36.5% 63.5%',
             animationDelay: '11.1s'
           }} />

      {/* Elegant liquid flows */}
      <div className="absolute top-0 right-[9%] w-[150px] h-[123px] elegant-corner-float"
           style={{
             background: `conic-gradient(from 45deg at 50% 50%, oklch(0.865 0.145 320 / ${0.22 * opacityMultiplier}), oklch(0.815 0.165 340 / ${0.32 * opacityMultiplier}), oklch(0.765 0.185 360 / ${0.22 * opacityMultiplier}), oklch(0.865 0.145 320 / ${0.22 * opacityMultiplier}))`,
             filter: 'blur(4.2px)'
           }} />
      <div className="absolute top-0 left-[11%] w-[140px] h-[113px] elegant-corner-float"
           style={{
             background: `conic-gradient(from 120deg at 48% 58%, oklch(0.835 0.125 60 / ${0.24 * opacityMultiplier}), oklch(0.785 0.145 80 / ${0.35 * opacityMultiplier}), oklch(0.735 0.165 100 / ${0.26 * opacityMultiplier}), oklch(0.835 0.125 60 / ${0.24 * opacityMultiplier}))`,
             filter: 'blur(3.8px)',
             animationDelay: '6.5s'
           }} />
      <div className="absolute bottom-0 right-[15%] w-[130px] h-[103px] elegant-corner-float"
           style={{
             background: `conic-gradient(from 200deg at 58% 42%, oklch(0.805 0.175 180 / ${0.22 * opacityMultiplier}), oklch(0.755 0.195 200 / ${0.32 * opacityMultiplier}), oklch(0.705 0.215 220 / ${0.24 * opacityMultiplier}), oklch(0.805 0.175 180 / ${0.22 * opacityMultiplier}))`,
             filter: 'blur(3.2px)',
             animationDelay: '13s'
           }} />
      <div className="absolute bottom-0 left-[13%] w-[120px] h-[93px] elegant-corner-float"
           style={{
             background: `conic-gradient(from 300deg at 38% 68%, oklch(0.845 0.135 280 / ${0.2 * opacityMultiplier}), oklch(0.795 0.155 300 / ${0.29 * opacityMultiplier}), oklch(0.745 0.175 320 / ${0.22 * opacityMultiplier}), oklch(0.845 0.135 280 / ${0.2 * opacityMultiplier}))`,
             filter: 'blur(2.8px)',
             animationDelay: '19.5s'
           }} />
    </div>
  )
}

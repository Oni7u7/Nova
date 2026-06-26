import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: boolean
}

export function Card({ gradient = false, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-white/10 p-6
        ${gradient
          ? 'bg-gradient-to-br from-[#1A1A3E] to-[#12122E]'
          : 'bg-[#1A1A3E]'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

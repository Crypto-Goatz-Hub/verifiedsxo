"use client"

import { useEffect, useRef, type ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "scale"
}

export function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0,
  direction = "up"
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add("visible")
            }, delay)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [delay])

  const getInitialTransform = () => {
    switch (direction) {
      case "down": return "translateY(-30px)"
      case "left": return "translateX(30px)"
      case "right": return "translateX(-30px)"
      case "scale": return "scale(0.9)"
      default: return "translateY(30px)"
    }
  }

  return (
    <div 
      ref={ref}
      className={`opacity-0 transition-all duration-700 ease-out ${className}`}
      style={{ transform: getInitialTransform() }}
    >
      {children}
    </div>
  )
}

// Style to be applied when visible
// Add this to globals.css:
// .visible { opacity: 1 !important; transform: none !important; }

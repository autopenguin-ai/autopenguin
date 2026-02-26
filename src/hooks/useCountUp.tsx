import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number;
  startOnView?: boolean;
  countDown?: boolean;
}

export function useCountUp({ end, start = 0, duration = 2000, startOnView = true, countDown = false }: UseCountUpOptions) {
  const [count, setCount] = useState(countDown ? (start || end) : 0);
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!startOnView) {
      animateCount();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (isVisible || !startOnView) {
      animateCount();
    }
  }, [isVisible, startOnView]);

  const animateCount = () => {
    const startTime = Date.now();
    const startValue = countDown ? (start || end) : start;
    const endValue = end;
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const currentCount = countDown
        ? Math.ceil(startValue - (easeOutQuart * (startValue - endValue)))
        : Math.floor(easeOutQuart * endValue);

      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  return { count, ref: elementRef };
}

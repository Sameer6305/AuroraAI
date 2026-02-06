/**
 * LoadingSkeleton Component
 * Reusable skeleton loader for various content types
 */

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'image' | 'circle';
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ 
  variant = 'text', 
  count = 1,
  className = '' 
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const baseClass = "animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%]";
  
  const variants = {
    text: "h-4 rounded-md",
    card: "h-32 rounded-xl",
    image: "aspect-square rounded-lg",
    circle: "w-12 h-12 rounded-full"
  };

  return (
    <>
      {skeletons.map((i) => (
        <div
          key={i}
          className={`${baseClass} ${variants[variant]} ${className}`}
          style={{
            animation: 'shimmer 2s infinite',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </>
  );
}

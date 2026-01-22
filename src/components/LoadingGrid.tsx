"use client";

import { useState, useEffect } from "react";

export function LoadingGrid() {
  const [elapsed, setElapsed] = useState(0);
  const mockHeights = [300, 450, 350, 400, 500, 320, 380, 420, 290, 460, 340, 390];

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="text-center mb-6">
        <p className="text-text-muted text-lg">
          Searching... {elapsed}s
        </p>
        <div className="w-48 h-1 bg-bg-tertiary rounded-full mx-auto mt-2 overflow-hidden">
          <div
            className="h-full bg-brand-purple rounded-full"
            style={{
              width: '60%',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-[1400px] mx-auto">
        {mockHeights.map((h, i) => (
          <div
            key={i}
            className="skeleton rounded-card"
            style={{ height: h }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return <LoadingGrid />;
}

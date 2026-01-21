"use client";

export function LoadingGrid() {
  const mockHeights = [300, 450, 350, 400, 500, 320, 380, 420, 290, 460, 340, 390];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-[1400px] mx-auto">
      {mockHeights.map((h, i) => (
        <div
          key={i}
          className="skeleton rounded-card"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

export function SkeletonGrid() {
  return <LoadingGrid />;
}

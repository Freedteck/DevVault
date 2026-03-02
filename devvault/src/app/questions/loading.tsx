export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between items-center mb-10">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-bg-panel rounded-md"></div>
          <div className="h-4 w-96 bg-bg-panel rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-bg-panel rounded-md"></div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-32 w-full bg-bg-panel border border-border-main rounded-lg"
          ></div>
        ))}
      </div>
    </div>
  );
}

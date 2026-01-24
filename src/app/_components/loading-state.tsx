export function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <div className="bg-primary size-3 animate-pulse" />
        <div className="bg-primary size-3 animate-pulse [animation-delay:200ms]" />
        <div className="bg-primary size-3 animate-pulse [animation-delay:400ms]" />
      </div>
      <p className="text-muted-foreground text-xs">Loading</p>
    </div>
  );
}

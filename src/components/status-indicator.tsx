export function StatusIndicator({
  status,
}: {
  status: "connected" | "disconnected";
}) {
  const isConnected = status === "connected";
  return (
    <span className="relative flex h-3 w-3">
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
          isConnected ? "bg-green-400" : "bg-red-400"
        }`}
      />
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
    </span>
  );
}

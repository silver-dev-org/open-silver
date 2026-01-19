export function BouncingDots() {
  return (
    <span className="inline-flex">
      <span className="animate-bounce" style={{ animationDelay: "0s" }}>
        .
      </span>
      <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>
        .
      </span>
      <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
        .
      </span>
    </span>
  );
}

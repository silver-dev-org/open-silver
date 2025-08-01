import Spacer, { spaceSizes } from "./spacer";

export default function Divider() {
  return (
    <div className={spaceSizes.sm.px}>
      <Spacer size="lg" />
      <div className="bg-foreground/25 h-px container mx-auto" />
      <Spacer size="lg" />
    </div>
  );
}

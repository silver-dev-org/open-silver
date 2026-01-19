import { FLAGS } from "../constants";
import { FlagColor } from "../types";

export function FlagList({
  items,
  color,
}: {
  items?: (string | undefined)[];
  color: FlagColor;
}) {
  items = items?.filter((item) => item) || [];
  if (items.length === 0) return null;

  const { className, listItemCharacter } = FLAGS[color];

  return (
    <ul className={className}>
      {items.map((item, i) => (
        <li key={i}>
          {listItemCharacter} {item}
        </li>
      ))}
    </ul>
  );
}

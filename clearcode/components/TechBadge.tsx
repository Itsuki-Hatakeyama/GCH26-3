interface TechBadgeProps {
  name: string;
  type: "added" | "removed";
}

export default function TechBadge({ name, type }: TechBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        type === "added"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {type === "added" ? "+" : "−"} {name}
    </span>
  );
}

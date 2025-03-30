import FlagCard from "./FlagCard";

interface ProjectAnalysisProps {
  grade: "S" | "A" | "B" | "C" | "D";
  summary: string;
  redFlags: string[];
  yellowFlags: string[];
  greenFlags: string[];
}

const gradeColors = {
  S: "bg-gradient-to-br from-blue-500 to-blue-700",
  A: "bg-green-500",
  B: "bg-yellow-500",
  C: "bg-orange-500",
  D: "bg-red-500",
};

export default function ProjectAnalysis({
  grade,
  summary,
  redFlags,
  yellowFlags,
  greenFlags,
}: ProjectAnalysisProps) {
  return (
    <div>
      <div className={`text-white p-3 rounded-md ${gradeColors[grade]}`}>
        <h2 className="text-lg font-bold">Project Score: {grade}</h2>
      </div>
      <p className="mt-4 text-gray-700 dark:text-gray-300">{summary}</p>

      {redFlags.length > 0 && (
        <FlagCard type="red" flags={redFlags} className="mt-4" />
      )}

      {yellowFlags.length > 0 && (
        <FlagCard type="yellow" flags={yellowFlags} className="mt-4" />
      )}

      {greenFlags.length > 0 && (
        <FlagCard type="green" flags={greenFlags} className="mt-4" />
      )}
    </div>
  );
}

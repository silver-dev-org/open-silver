import { Question, questions } from "@/behavioral-checker/data/questions";
import { FC, useState } from "react";

interface ChangeQuestionProps {
  selected: Question["id"];
  onSelect: (selectedQuestion: string) => void;
}

const ChangeQuestion: FC<ChangeQuestionProps> = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: Question["id"]) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Ícono SVG como botón */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 h-[40px] f rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-200 dark:hover:bg-gray-300"
        aria-label="Change Question"
      >
        <svg
          width="24px"
          height="24px"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="48" height="48" fill="white" fillOpacity="0.01" />
          <path
            d="M18 31H38V5"
            stroke="#000000"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M30 21H10V43"
            stroke="#000000"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44 11L38 5L32 11"
            stroke="#000000"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 37L10 43L4 37"
            stroke="#000000"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-6 text-center">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Select a Question
            </h2>
            <div className="space-y-2">
              {questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(question.id)}
                  className={`block w-full text-left px-4 py-2 rounded-md ${
                    selected === question.id
                      ? "bg-indigo-800 text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white"
                  }`}
                >
                  {question.text}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-black dark:text-white hover:text-indigo-800 hover:dark:text-indigo-400 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { ChangeQuestion };

import { evalite } from "evalite";
import { Levenshtein } from "autoevals";

evalite("Behavioral checker eval", {
  data: [{ input: "Input", expected: "Input" }],
  task: async (input) => {
    return input;
  },
  scorers: [Levenshtein],
});

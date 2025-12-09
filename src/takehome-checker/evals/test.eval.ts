import { evalite } from "evalite";
import { Levenshtein } from "autoevals";

evalite("Take home checker eval", {
  data: [{ input: "Input", expected: "Input" }],
  task: async (input) => {
    return input;
  },
  scorers: [Levenshtein],
});

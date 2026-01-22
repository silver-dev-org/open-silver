import type { CameraStatus, FlagColor } from "./types";

export const METADATA = {
  title: "Roast me",
  description:
    "How do other people see you? Get honest feedback from your setup.",
};

export const PRONUNCIATION_URLS = {
  google: "https://www.google.com/search?q=roast+pronunciation+in+english",
  silver: "https://silver.dev/english",
};

export const CLASSNAME_BY_STATUS: Record<CameraStatus, string> = {
  idle: "border-dotted",
  error: "border-destructive",
  requesting: "border-dashed animate-pulse",
  active: "border-accent",
  frozen: "border-primary",
};

export function getShareUrl(
  id: string,
  score: "pass" | "fail",
  isUnhinged: boolean,
): string {
  const text = score === "pass" ? "Mission Passed" : "Roasted";
  const path = isUnhinged ? `roast-me/unhinged/${id}` : `roast-me/${id}`;
  return `https://x.com/intent/post?hashtags=RoastMe%2C&text=${encodeURIComponent(text)}%20https://open.silver.dev/${path}%0A`;
}

export const FLAGS: Record<
  FlagColor,
  { className: string; listItemCharacter: string }
> = {
  red: {
    className: "text-destructive",
    listItemCharacter: "✕",
  },
  yellow: {
    className: "text-warning",
    listItemCharacter: "–",
  },
  green: {
    className: "text-success",
    listItemCharacter: "✓",
  },
};

const SYSTEM_PROMPT_INSTRUCTIONS = `# Instructions

Given a snapshot of a candidate's setup, assess it strictly based on the *Screening Call Guide* provided below, based on a green, yellow, and/or red flags framework, along with action plans, speaking in second person, directly to the candidate.

Green flags indicate a **positive** aspect; yellow flags indicate a **barely acceptable** aspect; and red flags indicate a **negative, unacceptable** aspect.

Action plans are ordered steps that the candidate should follow to have a proper senior remote engineer setup.

IMPORTANT: **Avoid redundancy** by using AT MOST ONE flag per checklist item, IF APPLICABLE given the snapshot—NEVER assume what you can't see in the image provided; ONLY flag mistakes when you have explicit visual proof.

## *Screening Call Guide*

### The Core Philosophy

**First impressions matter.** Before jumping into a video session with a recruiter or a company, you must review your entire setup. Everything from the decor to the hardware tells a story about your investment in your workspace and influences how people perceive your professionalism.

Correcting common setup mistakes can be the difference between **passing or failing** a screening call.

### Checklist: Self-Evaluation

- **Professional appearance:** Ensure you are neat, well-groomed, and dressed appropriately.
  - Sports clothes or going shirtless are red flags.
  - Too many tattoos, unkempt hair/beard, or excessive make-up are yellow flags.
  - Plain/simple T-shirts or hoodies are green flags given the industry standard.
  - CLARIFICATIONS:
    - Women wearing sleeveless clothes are allowed.
    - Headphones are allowed.
    - Jewellery is allowed.
- **Energy level:** Do not look tired, stressed, or rushed. Carve out a proper space and time to do the interview well.

### Checklist: Setup Evaluation

- **Professional workspace:** Chaotic setting suggests low productivity and a lack of professionalism, so you must record in a clean, private, and quiet environment, such as a private office/room or coworking cabin, where you have total control over the space.
  - Interviewing at a kitchen, unlit basement, bedroom, car, cafe, or bar is a red flag.
  - Noisy distraction (e.g., people walking behind, conversations, pets, device alerts, etc.) is a red flag.
  - Darkness is a red flag.
  - Visual clutter (e.g., food, unfinished repairs, beds, alcohol, guitars, knives, etc.) is a yellow flag.
  - Having non-distracting decoration (e.g., plants, paintings, lamps, plain blank walls, windows, window blinds, bookshelves, etc.) is a green flag.
  - Natural lighting is a green flag.
  - CLARIFICATIONS:
    - Mate (infusion) and thermos are allowed
    - Glasses of water are allowed
- **Virtual or blurred backgrounds:** Never use virtual or blurred backgrounds as it implies that you are hiding a messy environment.
  - Using one is a red flag.
  - Not using one is a green flag.
  - It should be mentioned independently of the background.`;

export const SYSTEM_PROMPT = `# Role

You are an **expert interviewing mentor at Silver.dev** for senior software engineers seeking remote work. Since these candidates want to work remotely, having an elite, professional setup is mandatory.

While being respectful, you provide **honest feedback directly**; you don't sugar-coat, and always go straight to the point to ensure they fix their deficiencies immediately.

---

${SYSTEM_PROMPT_INSTRUCTIONS}`;

export const SYSTEM_PROMPT_UNHINGED = `# Role

You are an **outstandingly crude** expert interviewing mentor at Silver.dev for senior software engineers seeking remote work. Since these candidates want to work remotely, having an elite, professional setup is a non-negotiable mandatory requirement.

- Your bar is high, so you make it **hard to pass**.
- You are completely **UNHINGED**.
- Your feedback is **extremely harsh**.
- You are **NOT afraid** to add red or yellow flags when you can see the error.
- You **give a shit** about being politically correct, though you don't use insults.
- You use analogies for each red flag and yellow flag to make sure it feels like a **merciless slap in the face** that triggers the user.
- You speak using **simple language** so that the candidate understands what you're saying.

---

${SYSTEM_PROMPT_INSTRUCTIONS}`;

export const SIMILAR_PHRASES = [
  // Standard variations
  "roast",
  "rost",

  // Phonetic variations - 'roast' mishearings
  "rose",
  "rows",
  "row",
  "roas",

  // 'Ghost' sound confusion (ro-st)
  "ghost",

  // R pronunciation issues
  "oast",
  "hoast",
  "woast",

  // Vowel confusion (oa/o/ou/oe)
  "roust",
  "roist",
  "roest",
  "rosed",

  // T dropping or softening
  "roash",
  "roass",

  // Extra syllables or sounds
  "roaste",
  "roasty",
  "roastme",
  "rostme",
  "ro ast",
  "ro st",

  // Common transcription errors
  "roast ma",
  "rost ma",
  "roast my",
  "rost my",
  "roast mean",
  "roast meat",
  "roast meet",

  // Soft consonants
  "roadst",
  "roazed",
  "roased",

  // Initial consonant issues
  "broast",
  "groast",
  "croast",

  // Toast confusion
  "toast",
  "tost",
  "toste",
  "toasty",
  "toasted",

  // Coast/boast confusion
  "coast",
  "boast",
  "most",
  "post",
  "host",
  "hosted",

  // Double letters
  "rroast",
  "roasst",
  "roastt",
  "roost",

  // Merged words
  "roasme",

  // Spanish speaker specific
  "rostea",
  "rostia",
  "roastea",
  "el roast",
  "un roast",

  // Emphasis or filler words caught
  "a roast",
  "the roast",
  "just roast",
  "please roast",
  "roast please",

  // Voice recognition common errors
  "roasted",
  "roasting",
  "roasts",
  "row stme",
  "row st",

  // Accented pronunciation
  "rohst",
  "rohast",
  "ro-ast",

  // Fast speech blending
  "rosme",
  "rosmee",
  "roasmi",

  // MORE SIMILAR SOUNDING WORDS

  // Roost/rooster variations
  "rooster",
  "ruste",
  "rusty",

  // Beast/feast/least sounds
  "beast",
  "feast",
  "least",
  "yeast",

  // Rope/robe/road sounds
  "rope",
  "robe",
  "road",
  "rode",
  "roped",

  // Dose/close sounds
  "dose",
  "dosed",
  "close",
  "closed",

  // Waste/paste/haste sounds
  "waste",
  "paste",
  "haste",
  "taste",
  "baste",
  "chaste",

  // Moist/foist/hoist sounds
  "moist",
  "foist",
  "hoist",
  "joist",

  // Rust/must/just sounds
  "trust",
  "rust",
  "must",
  "bust",
  "just",
  "gust",
  "dust",

  // Gross/ross sounds
  "gross",
  "ross",
  "dross",

  // Roach sounds
  "roach",
  "coach",
  "poach",

  // Boost/joust sounds
  "boost",
  "joust",

  // Rest/best/test sounds
  "rest",
  "best",
  "test",
  "vest",
  "nest",
  "pest",
  "zest",
  "fest",

  // Race/raise/raze sounds
  "race",
  "raise",
  "raze",
  "rays",
  "raes",

  // Reach sounds
  "reach",
  "breach",
  "preach",

  // Roam/rome sounds
  "roam",
  "rome",
  "foam",
  "home",

  // Roll/role sounds
  "roll",
  "role",
  "bowl",
  "toll",
  "poll",

  // Rush/brush/crush sounds
  "rush",
  "brush",
  "crush",
  "flush",
  "blush",

  // Roar sounds
  "roar",
  "roaring",

  // Route/root sounds
  "route",
  "root",
  "rout",

  // Rhose/those sounds
  "those",
  "hose",
  "nose",
  "pose",
  "prose",

  // Rotisserie-like mishearings
  "rotis",
  "roti",
  "roddy",

  // Voice assistant mishearings
  "rosie",
  "rosey",

  // Lost/cost sounds
  "lost",
  "cost",
  "frost",

  // Voiced/unvoiced confusion
  "roads",
  "robes",
  "ropes",
  "rogues",

  // With prepositions caught
  "roast to",
  "roast for",
  "roast at",

  // Regional pronunciations
  "rawst",
  "rowst",

  // Aspirated sounds
  "roasht",
  "rosht",
  "roshte",

  // Nasal sounds
  "roan",
  "roans",
  "rones",

  // Other
  "aust",
  "fuck",
  "call",
];

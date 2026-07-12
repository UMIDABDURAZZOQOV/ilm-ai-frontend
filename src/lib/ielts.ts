// Original IELTS Academic Reading content, written for Ilm AI. Passages and
// questions are original text in the standard IELTS format (the format and
// band system are open; only specific published text is protected).

export type IeltsQuestionType = "tfng" | "mcq" | "completion";

export interface IeltsQuestion {
  id: string;
  type: IeltsQuestionType;
  prompt: string;
  options?: string[]; // tfng -> ["True","False","Not Given"]; mcq -> choices
  answer: string; // exact expected answer (case-insensitive for completion)
  hint?: string; // e.g. "ONE WORD ONLY"
}

export interface IeltsPassage {
  id: string;
  title: string;
  level: "Academic";
  minutes: number;
  paragraphs: string[];
  questions: IeltsQuestion[];
}

const TFNG = ["True", "False", "Not Given"];

export const IELTS_READING: IeltsPassage[] = [
  {
    id: "urban-rivers",
    title: "The Return of Urban Rivers",
    level: "Academic",
    minutes: 18,
    paragraphs: [
      "For most of the twentieth century, the rivers that ran through the world's growing cities were treated as problems to be managed rather than assets to be valued. Engineers straightened their curving channels, lined the banks with concrete, and in a number of places covered the water over entirely, hiding it beneath new roads and buildings. A river that flooded after heavy rain, or that carried the smell of untreated waste, was widely regarded as an obstacle to a modern, orderly city.",
      "By the 1970s, however, a different view had begun to take hold. Researchers studying the ecology of cities argued that a living river could offer benefits that a concrete drain never could. A natural channel, with its gravel beds and overhanging plants, supported fish, insects and birds. Just as importantly, the vegetation along the banks provided shade that lowered the temperature of the surrounding streets during increasingly hot summers.",
      "The practical case for restoration grew stronger as cities faced more frequent and more intense rainfall. A straightened, concrete-lined channel moves water downstream quickly, but in doing so it can pass a sudden flood on to communities further along. A restored river, by contrast, is allowed to spread into planted areas beside the water. These spaces slow the flow and store excess water temporarily, reducing the risk of flooding in built-up districts nearby.",
      "Restoration is rarely simple. Engineers must remove old concrete, reshape the channel, and reintroduce native plants, often while managing the expectations of residents who have never seen the river uncovered. Early projects in Europe and East Asia showed that success depended less on any single technique than on patient cooperation between city authorities, ecologists and the public. Where that cooperation was absent, ambitious schemes stalled or were quietly abandoned.",
      "Today, uncovered and restored rivers are increasingly seen as symbols of a healthier city. They draw walkers and cyclists, raise the value of nearby property, and give residents daily contact with moving water and wildlife. Yet supporters caution that a restored river is not a finished monument. It is a living system that must be monitored and maintained for decades if the gains of restoration are to last.",
    ],
    questions: [
      { id: "ur1", type: "tfng", options: TFNG,
        prompt: "Before the 1970s, most engineers regarded urban rivers as valuable natural features.",
        answer: "False" },
      { id: "ur2", type: "tfng", options: TFNG,
        prompt: "Some city rivers were completely covered over during the twentieth century.",
        answer: "True" },
      { id: "ur3", type: "tfng", options: TFNG,
        prompt: "Concrete channels are cheaper to build than restored natural channels.",
        answer: "Not Given" },
      { id: "ur4", type: "tfng", options: TFNG,
        prompt: "Plants growing beside a restored river can help lower street temperatures.",
        answer: "True" },
      { id: "ur5", type: "mcq",
        prompt: "According to the passage, one drawback of a straightened, concrete-lined channel is that it",
        options: [
          "encourages the growth of native plants.",
          "can pass floodwater on to communities downstream.",
          "is more expensive to maintain than a natural channel.",
          "attracts too many walkers and cyclists.",
        ],
        answer: "can pass floodwater on to communities downstream." },
      { id: "ur6", type: "mcq",
        prompt: "The writer suggests that early restoration projects succeeded mainly because of",
        options: [
          "the invention of a single new technique.",
          "generous funding from national governments.",
          "cooperation between authorities, ecologists and the public.",
          "the removal of all residents from riverside areas.",
        ],
        answer: "cooperation between authorities, ecologists and the public." },
      { id: "ur7", type: "completion", hint: "ONE WORD ONLY",
        prompt: "Beside a restored river, planted areas slow the flow and temporarily store excess water, reducing the risk of ______.",
        answer: "flooding" },
      { id: "ur8", type: "completion", hint: "ONE WORD ONLY",
        prompt: "Supporters warn that a restored river must be monitored and ______ for decades.",
        answer: "maintained" },
    ],
  },
  {
    id: "bee-navigation",
    title: "How Honeybees Find Their Way",
    level: "Academic",
    minutes: 18,
    paragraphs: [
      "A honeybee that leaves its hive in search of food may travel several kilometres across a landscape of fields, hedges and buildings, and yet it returns home with remarkable accuracy. For more than a century, scientists have tried to explain how so small an animal, with a brain no larger than a grain of rice, performs a feat of navigation that would challenge a human without a map.",
      "Part of the answer lies in the sun. A foraging bee uses the position of the sun as a kind of moving compass, adjusting its course as the sun travels across the sky. On cloudy days, when the sun is hidden, the bee can still read the pattern of polarised light in patches of blue sky, information that is invisible to the human eye but clear to the specialised cells in a bee's compound eyes.",
      "The sun alone, however, cannot tell a bee how far it has flown. To measure distance, bees appear to count the movement of the landscape across their eyes as they fly, a process researchers call optic flow. A bee flying past a dense hedge, where the scene rushes by quickly, registers a greater distance than one crossing an open field, where the view changes slowly. This helps explain why bees sometimes misjudge distance over water or bare ground, where there is little detail to track.",
      "Perhaps the most famous discovery about bee navigation concerns communication. A bee that has found a rich source of food returns to the darkness of the hive and performs a series of movements, long known as the waggle dance. The direction of the dance, measured against the vertical, indicates the direction of the food relative to the sun, while the length of the central run signals how far away it lies. Other bees follow the dancer closely and then set out on the same heading.",
      "Recent research suggests that bees also build a rough mental map of familiar landmarks, allowing them to find their way even when the usual cues are disturbed. Trees, ponds and the edges of woodland all seem to act as reference points. Taken together, these overlapping systems make the honeybee one of the most sophisticated natural navigators of its size, and a continuing source of ideas for engineers designing small flying robots.",
    ],
    questions: [
      { id: "bn1", type: "tfng", options: TFNG,
        prompt: "A honeybee's brain is roughly the size of a grain of rice.",
        answer: "True" },
      { id: "bn2", type: "tfng", options: TFNG,
        prompt: "Bees are unable to navigate at all when the sun is hidden by clouds.",
        answer: "False" },
      { id: "bn3", type: "tfng", options: TFNG,
        prompt: "Honeybees can see polarised light that humans cannot detect.",
        answer: "True" },
      { id: "bn4", type: "tfng", options: TFNG,
        prompt: "Bees find it easier to judge distance over water than over a hedge.",
        answer: "False" },
      { id: "bn5", type: "mcq",
        prompt: "According to the passage, 'optic flow' refers to the way bees",
        options: [
          "follow the scent of flowers to a food source.",
          "measure distance by the movement of the scene across their eyes.",
          "read the polarised light in clear blue sky.",
          "communicate direction inside the hive.",
        ],
        answer: "measure distance by the movement of the scene across their eyes." },
      { id: "bn6", type: "mcq",
        prompt: "In the waggle dance, the length of the central run indicates",
        options: [
          "how rich the food source is.",
          "the direction of the food relative to the sun.",
          "how far away the food source lies.",
          "the number of bees needed to collect it.",
        ],
        answer: "how far away the food source lies." },
      { id: "bn7", type: "completion", hint: "ONE WORD ONLY",
        prompt: "On cloudy days, bees rely on the pattern of ______ light in the sky to hold their course.",
        answer: "polarised" },
      { id: "bn8", type: "completion", hint: "TWO WORDS",
        prompt: "Bees appear to build a rough mental ______ of familiar landmarks such as trees and ponds.",
        answer: "map" },
    ],
  },
];

export const IELTS_READING_BY_ID: Record<string, IeltsPassage> = Object.fromEntries(
  IELTS_READING.map((p) => [p.id, p])
);

// ── Writing ──────────────────────────────────────────────────────────────────

export interface IeltsWritingTask {
  id: string;
  task: "Task 1" | "Task 2";
  category: string;
  prompt: string;
  minWords: number;
  minutes: number;
  tips: string[];
}

export const IELTS_WRITING: IeltsWritingTask[] = [
  { id: "w2-tech-1", task: "Task 2", category: "Technology", minWords: 250, minutes: 40,
    prompt: "Some people believe that smartphones have made communication between people worse rather than better. To what extent do you agree or disagree?",
    tips: ["State a clear position in the introduction.", "Give two developed body paragraphs with examples.", "Address the opposite view before your conclusion."] },
  { id: "w2-edu-1", task: "Task 2", category: "Education", minWords: 250, minutes: 40,
    prompt: "In many countries, students are required to study subjects such as history and art even when they plan careers in science. Do the advantages of this outweigh the disadvantages?",
    tips: ["Decide clearly whether advantages outweigh disadvantages.", "Weigh both sides, then commit.", "Use specific examples from education systems you know."] },
  { id: "w2-env-1", task: "Task 2", category: "Environment", minWords: 250, minutes: 40,
    prompt: "Some argue that individuals can do little to protect the environment and that only governments and large companies can make a real difference. Discuss both views and give your own opinion.",
    tips: ["Cover both views fairly before giving your opinion.", "Balance individual actions against systemic ones.", "Keep your own opinion consistent throughout."] },
  { id: "w2-work-1", task: "Task 2", category: "Work", minWords: 250, minutes: 40,
    prompt: "Many people now work from home using modern technology. Do the benefits of working from home outweigh the drawbacks?",
    tips: ["List concrete benefits and drawbacks.", "Consider effects on both workers and employers.", "Reach a clear judgement."] },
  { id: "w2-society-1", task: "Task 2", category: "Society", minWords: 250, minutes: 40,
    prompt: "Some people think that governments should spend money on public libraries, while others believe this money would be better spent on the internet and digital services. Discuss both views and give your opinion.",
    tips: ["Give each view its own paragraph.", "Compare cost, access, and who benefits.", "State your view clearly."] },
  { id: "w2-health-1", task: "Task 2", category: "Health", minWords: 250, minutes: 40,
    prompt: "In some countries, the number of people who are overweight is rising. What are the causes of this, and what measures could be taken to solve the problem?",
    tips: ["Split the essay into causes and solutions.", "Match each solution to a cause where possible.", "Use realistic, specific measures."] },
  { id: "w2-culture-1", task: "Task 2", category: "Culture", minWords: 250, minutes: 40,
    prompt: "Some believe that international tourism creates tension rather than understanding between people from different countries. To what extent do you agree or disagree?",
    tips: ["Take a clear stance.", "Acknowledge how tourism can both unite and divide.", "Support claims with examples."] },
  { id: "w2-youth-1", task: "Task 2", category: "Youth", minWords: 250, minutes: 40,
    prompt: "These days many young people spend a large amount of their free time on social media. Is this a positive or negative development?",
    tips: ["Choose positive, negative, or a balanced view.", "Discuss effects on skills, relationships, and wellbeing.", "Conclude in line with your position."] },
  { id: "w2-city-1", task: "Task 2", category: "Urban life", minWords: 250, minutes: 40,
    prompt: "As cities grow, more people move away from the countryside. What problems does this cause, and how might these problems be reduced?",
    tips: ["Identify problems for both cities and rural areas.", "Offer practical solutions.", "Keep paragraphs focused."] },
  { id: "w2-media-1", task: "Task 2", category: "Media", minWords: 250, minutes: 40,
    prompt: "Some people think that news organisations should report only good news. Do you agree or disagree?",
    tips: ["State clearly whether you agree.", "Consider the purpose of news.", "Use examples of good and bad news reporting."] },
  { id: "w1-line-1", task: "Task 1", category: "Line graph (described)", minWords: 150, minutes: 20,
    prompt: "A line graph shows the number of visitors (in millions) to three museums in one city from 2000 to 2020. Museum A rose steadily from 1 to 4 million. Museum B fell from 3 to 1 million. Museum C stayed roughly flat at 2 million. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    tips: ["Write an overview of the main trends — no opinions.", "Group similar trends together.", "Include specific figures and time periods."] },
  { id: "w1-bar-1", task: "Task 1", category: "Bar chart (described)", minWords: 150, minutes: 20,
    prompt: "A bar chart compares the average hours per week spent on four activities (reading, exercise, television, and social media) by two age groups: teenagers and adults over 40. Teenagers spend far more time on social media and less on reading; adults spend more on reading and television. Summarise the main features and make comparisons where relevant.",
    tips: ["Start with an overview of the biggest differences.", "Compare the two groups directly.", "Use comparison language: more than, twice as, whereas."] },
  { id: "w1-process-1", task: "Task 1", category: "Process (described)", minWords: 150, minutes: 20,
    prompt: "A diagram shows how rainwater is collected and treated before it reaches homes: rain falls into a reservoir, passes through a filter, is stored in a tank, treated with chemicals, and finally piped to houses. Summarise the process by describing the main stages.",
    tips: ["Describe stages in order using sequencing words.", "Use the passive voice (is collected, is filtered).", "No numbers needed — focus on stages."] },
];

// ── Speaking ─────────────────────────────────────────────────────────────────

export interface IeltsSpeakingSet {
  id: string;
  part: "Part 1" | "Part 2" | "Part 3";
  topic: string;
  questions: string[]; // for Part 2, a single cue-card entry with bullet points folded in
  seconds?: number; // prep/speak time for Part 2
}

export const IELTS_SPEAKING: IeltsSpeakingSet[] = [
  { id: "s1-hometown", part: "Part 1", topic: "Your hometown", questions: [
    "Where is your hometown, and what is it known for?",
    "What do you like most about living there?",
    "Has your hometown changed much in recent years?",
    "Would you recommend it to a tourist? Why or why not?",
  ]},
  { id: "s1-work-study", part: "Part 1", topic: "Work or study", questions: [
    "Do you work or are you a student at the moment?",
    "What do you enjoy most about your work or studies?",
    "Is there anything you would like to change about it?",
    "What are your plans for the next few years?",
  ]},
  { id: "s1-freetime", part: "Part 1", topic: "Free time", questions: [
    "What do you usually do in your free time?",
    "Do you prefer spending free time alone or with others?",
    "Has the way you spend your free time changed since childhood?",
    "Do you think people today have enough free time?",
  ]},
  { id: "s1-technology", part: "Part 1", topic: "Technology", questions: [
    "How often do you use a smartphone during the day?",
    "Which app or device could you not live without?",
    "Do you think you spend too much time on screens?",
    "How did you learn to use new technology?",
  ]},
  { id: "s2-teacher", part: "Part 2", topic: "Describe a teacher who influenced you", seconds: 120, questions: [
    "Describe a teacher who has influenced you. You should say: who this teacher was; what subject they taught; what they were like; and explain why they influenced you.",
  ]},
  { id: "s2-place", part: "Part 2", topic: "Describe a place you like to relax", seconds: 120, questions: [
    "Describe a place where you like to relax. You should say: where it is; how often you go there; what you do there; and explain why it helps you relax.",
  ]},
  { id: "s2-skill", part: "Part 2", topic: "Describe a skill you would like to learn", seconds: 120, questions: [
    "Describe a skill you would like to learn. You should say: what the skill is; how you would learn it; how long it might take; and explain why you want to learn it.",
  ]},
  { id: "s2-book", part: "Part 2", topic: "Describe a book you enjoyed", seconds: 120, questions: [
    "Describe a book that you enjoyed reading. You should say: what the book was about; when you read it; why you chose it; and explain why you enjoyed it.",
  ]},
  { id: "s3-education", part: "Part 3", topic: "Education and learning", questions: [
    "How has the way people learn changed over the last twenty years?",
    "Do you think online learning is as effective as classroom learning?",
    "Should governments pay for everyone's higher education? Why or why not?",
    "What skills will be most important for students in the future?",
  ]},
  { id: "s3-technology", part: "Part 3", topic: "Technology and society", questions: [
    "In what ways has technology changed how families communicate?",
    "Do the benefits of social media outweigh its problems?",
    "Should there be limits on how much technology children use?",
    "How might technology change the workplace in the future?",
  ]},
  { id: "s3-environment", part: "Part 3", topic: "Environment", questions: [
    "Whose responsibility is it to protect the environment?",
    "Are people today more aware of environmental issues than in the past?",
    "What can ordinary people do to reduce waste?",
    "Do you think future generations will live in a cleaner world?",
  ]},
];

// ── Listening ────────────────────────────────────────────────────────────────
// Original scripts are read aloud by the browser (speech synthesis), then the
// learner answers from memory — no copyrighted audio is used.

export interface IeltsListeningExercise {
  id: string;
  title: string;
  section: string;
  script: string; // read via TTS
  questions: IeltsQuestion[];
}

export const IELTS_LISTENING: IeltsListeningExercise[] = [
  { id: "l-library", title: "Joining the City Library", section: "Section 1 · Everyday conversation",
    script:
      "Good morning, and welcome to the Riverside City Library. To join, you will need to fill in a short form and show one document that proves your address, such as a recent electricity bill. Membership is completely free for residents. Once you have joined, you may borrow up to eight books at a time, and each book can be kept for three weeks. If you need a book for longer, you can renew it once, either online or by phone. Please note that the library is open from nine in the morning until eight in the evening on weekdays, and until five o'clock on Saturdays. It is closed on Sundays. The quiet study room is on the second floor, and it can be booked in advance for up to two hours.",
    questions: [
      { id: "ll1", type: "completion", hint: "ONE WORD ONLY",
        prompt: "To prove your address, you can show a recent electricity ______.",
        answer: "bill" },
      { id: "ll2", type: "completion", hint: "A NUMBER",
        prompt: "Members may borrow up to ______ books at a time.",
        answer: "eight" },
      { id: "ll3", type: "completion", hint: "A NUMBER",
        prompt: "Each book can be kept for ______ weeks.",
        answer: "three" },
      { id: "ll4", type: "mcq",
        prompt: "On Saturdays, the library closes at",
        options: ["five o'clock", "eight in the evening", "nine in the morning", "two o'clock"],
        answer: "five o'clock" },
      { id: "ll5", type: "completion", hint: "ONE WORD ONLY",
        prompt: "The quiet study room is located on the ______ floor.",
        answer: "second" },
    ]},
  { id: "l-lecture", title: "A Short Lecture on Sleep", section: "Section 4 · Academic monologue",
    script:
      "In today's short talk, I want to explain why sleep matters so much for learning. When we sleep, the brain does not simply switch off. Instead, it replays and organises the information gathered during the day, moving it from short-term to long-term memory. This is why students who sleep well after studying tend to remember more than those who stay awake all night. Researchers have found that the deepest stage of sleep, which usually occurs in the first few hours, is especially important for storing facts. Dreaming sleep, which comes later, appears to help with creative problem solving. The clear practical lesson is that a regular sleep schedule is one of the most effective study tools available, and it costs nothing at all.",
    questions: [
      { id: "le1", type: "tfng", options: TFNG,
        prompt: "During sleep, the brain completely stops working.",
        answer: "False" },
      { id: "le2", type: "completion", hint: "TWO WORDS",
        prompt: "During sleep, information is moved from short-term to ______ memory.",
        answer: "long-term" },
      { id: "le3", type: "mcq",
        prompt: "According to the talk, the deepest stage of sleep is most important for",
        options: ["storing facts", "creative problem solving", "physical exercise", "controlling emotions"],
        answer: "storing facts" },
      { id: "le4", type: "mcq",
        prompt: "Dreaming sleep appears to help mainly with",
        options: ["storing facts", "creative problem solving", "waking up early", "reducing stress"],
        answer: "creative problem solving" },
      { id: "le5", type: "tfng", options: TFNG,
        prompt: "The speaker says a regular sleep schedule is an expensive study tool.",
        answer: "False" },
    ]},
];

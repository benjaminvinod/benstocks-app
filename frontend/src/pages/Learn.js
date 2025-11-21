// src/pages/Learn.js

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import {
  Box,
  Heading,
  Text,
  Button,
  Badge,
  Flex,
  useColorModeValue,
  Progress,
  VStack,
  HStack,
  Divider,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Tooltip,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  DrawerHeader,
  DrawerCloseButton,
  useDisclosure,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  SimpleGrid as ChakraGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon
} from "@chakra-ui/react";
import {
  CheckCircleIcon,
  TimeIcon,
  ExternalLinkIcon,
  StarIcon,
  SearchIcon,
  RepeatIcon,
  DownloadIcon,
  QuestionOutlineIcon,
  CopyIcon,
  AtSignIcon,
  ChevronRightIcon
} from "@chakra-ui/icons";

// --- COURSE DATA (Chapter-Wise Structure) ---
const courseData = {
  "Chapter 1": {
    title: "The Foundation",
    description: "Understand the core concepts of money, inflation, and the 'Why' behind investing.",
    modules: [
      {
        title: "1.1 Why Invest at all?",
        icon: "🌱",
        duration: "10 min",
        tags: ["foundation", "concepts"],
        topics: [
          {
            q: "The Problem: Inflation",
            a: "Inflation is the rate at which the price of goods rises. If inflation is 6%, your ₹100 today will only buy ₹94 worth of goods next year.\n\n• Saving Account: Pays ~3%. You lose purchasing power.\n• Investing: Aims for 10-15%. You beat inflation and grow wealth.",
          },
          {
            q: "The Solution: Compounding",
            a: "Albert Einstein called it the '8th Wonder of the World'. It is earning interest on your interest.\n\nExample:\nInvest ₹5,000/month for 20 years.\n• Total Invested: ₹12 Lakhs\n• Value at 12%: ~₹50 Lakhs\n\nThe longer you stay, the faster the snowball grows.",
          },
          {
            q: "Risk vs Reward",
            a: "There is no free lunch. To get higher returns, you must accept higher volatility (price swings).\n\n• Low Risk: FD, Govt Bonds (6-7%)\n• Med Risk: Gold, Debt Funds (8-10%)\n• High Risk: Stocks, Equity Mutual Funds (12-18%)",
          },
        ],
      },
      {
        title: "1.2 Asset Classes Explained",
        icon: "📦",
        duration: "12 min",
        tags: ["foundation", "assets"],
        topics: [
          {
            q: "Equity (Stocks)",
            a: "Owning a tiny piece of a business. If the business grows, your share price goes up. You may also receive a share of profits called 'Dividends'.\n\n• Best for: Long-term wealth creation (>5 years).\n• Volatility: High.",
          },
          {
            q: "Fixed Income (Debt/Bonds)",
            a: "You loan money to the Government or a Corporation. They pay you fixed interest for a set period and return your principal.\n\n• Best for: Stability and regular income.\n• Volatility: Low.",
          },
          {
            q: "Commodities (Gold/Silver)",
            a: "Physical assets. In India, Gold is a cultural hedge against inflation. It doesn't produce cash flow (like dividends), but it retains value when paper money loses value.",
          },
          {
            q: "Real Estate (REITs)",
            a: "You don't need to buy a whole apartment. REITs (Real Estate Investment Trusts) allow you to buy shares of commercial properties (like Malls/Offices) and earn rent as dividends.",
          },
        ],
      },
    ]
  },
  "Chapter 2": {
    title: "Financial Instruments",
    description: "Deep dive into the tools you use to build wealth: Mutual Funds, ETFs, and SIPs.",
    modules: [
      {
        title: "2.1 Mutual Funds vs ETFs",
        icon: "⚖️",
        duration: "15 min",
        tags: ["instruments", "funds"],
        topics: [
          {
            q: "What is a Mutual Fund?",
            a: "A pool of money collected from many investors. A professional Fund Manager decides where to invest it.\n\n• Pros: Professional management, easy diversification.\n• Cons: Higher fees (Expense Ratio), Price (NAV) updates only once a day.",
          },
          {
            q: "What is an ETF (Exchange Traded Fund)?",
            a: "Like a Mutual Fund, but it trades on the stock exchange like a share. You can buy/sell it instantly during market hours.\n\n• Pros: Lower fees, real-time trading, transparency.\n• Cons: Requires a Demat account.",
          },
          {
            q: "Index Funds (Passive Investing)",
            a: "Instead of trying to beat the market, these funds just COPY the market (e.g., Nifty 50). They buy the top 50 companies automatically.\n\n• Why stick to Index? 90% of active fund managers fail to beat the Index over 10 years. 'If you can't beat them, join them.'",
          },
        ],
      },
      {
        title: "2.2 The SIP Superpower",
        icon: "💧",
        duration: "8 min",
        tags: ["instruments", "savings"],
        topics: [
          {
            q: "What is SIP?",
            a: "Systematic Investment Plan. You invest a fixed amount (e.g., ₹500) on a fixed date every month, regardless of market conditions.",
          },
          {
            q: "Rupee Cost Averaging",
            a: "The magic of SIPs.\n• When markets are UP, you buy fewer units (expensive).\n• When markets are DOWN, you buy more units (cheap).\n\nOver time, your average purchase price lowers automatically without you timing the market.",
          },
          {
            q: "Lump Sum vs SIP",
            a: "• Lump Sum: Good if markets are crashed/low.\n• SIP: Best for salary earners and volatile markets. Removes emotional stress.",
          },
        ],
      },
    ]
  },
  "Chapter 3": {
    title: "Advanced Strategy",
    description: "Mastering analysis, tax planning, and professional portfolio construction.",
    modules: [
      {
        title: "3.1 Analyzing Stocks",
        icon: "📊",
        duration: "20 min",
        tags: ["analysis", "fundamentals"],
        topics: [
          {
            q: "Fundamental Analysis (The Business)",
            a: "Looking at the financial health.\n• P/E Ratio: Price to Earnings. Is the stock expensive? (Lower is usually better value).\n• ROE: Return on Equity. How efficiently is the company using money? (>15% is good).\n• Debt-to-Equity: Does the company owe too much money? (<1 is safe).",
          },
          {
            q: "Technical Analysis (The Chart)",
            a: "Looking at price patterns.\n• Support: A price level where the stock stops falling.\n• Resistance: A price ceiling it struggles to break.\n• RSI: If >70, it's 'Overbought' (expensive). If <30, it's 'Oversold' (cheap).",
          },
          {
            q: "Market Cap Categories",
            a: "• Large Cap: Top 100 companies. Stable, slow growth (e.g., Reliance).\n• Mid Cap: Next 150. Higher growth, moderate risk.\n• Small Cap: The rest. Can double fast, but can also crash 50%.",
          },
        ],
      },
      {
        title: "3.2 Taxes & Optimization",
        icon: "🧾",
        duration: "12 min",
        tags: ["taxes", "strategy"],
        topics: [
          {
            q: "STCG vs LTCG",
            a: "• STCG (Short Term Capital Gains): Sold within 1 year. Taxed at 15% (or 20% based on new budget).\n• LTCG (Long Term Capital Gains): Held for >1 year. Taxed at 10% (or 12.5%) only on profits above ₹1.25 Lakh.",
          },
          {
            q: "Tax Loss Harvesting",
            a: "A strategy to reduce your tax bill. If you have a profit of ₹1 Lakh in Stock A, and a loss of ₹40k in Stock B, you can sell Stock B to 'book' the loss.\n\nNet Taxable Income: ₹1L - ₹40k = ₹60k.\n(The Tax Optimizer in BenStocks helps you find these opportunities!)",
          },
        ],
      },
      {
        title: "3.3 Portfolio Construction",
        icon: "🏗️",
        duration: "10 min",
        tags: ["strategy", "allocation"],
        topics: [
          {
            q: "Asset Allocation Rule",
            a: "The most important decision. How much in Equity vs Debt?\n\nRule of Thumb: (100 - Your Age) = % in Equity.\nExample (Age 25): 75% Equity (Growth), 25% Debt/Gold (Safety).",
          },
          {
            q: "Rebalancing",
            a: "Markets move. If Stocks boom, your 75% allocation might become 90%. This is risky.\n\nRebalancing means selling some high-flying stocks and buying safe bonds to return to your 75:25 split. This forces you to 'Sell High and Buy Low'.",
          },
        ],
      },
    ]
  },
};

// --- STORAGE KEYS ---
const STORAGE_KEYS = {
  PROGRESS: "benstocks_learn_progress_v2",
  NOTES: "benstocks_learn_notes_v2",
  BOOKMARKS: "benstocks_learn_bookmarks_v2",
  QUIZ_SCORES: "benstocks_learn_quiz_v2",
  SRS: "benstocks_learn_srs_v2",
  LAST_VIEWED: "benstocks_learn_last_v2",
};

// --- UTILS ---
const uid = (prefix = "") =>
  `${prefix}${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

const nowISO = () => new Date().toISOString();

const loadJSON = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

// Quiz Generator
const generateQuizFromModules = (modules, count = 10) => {
  const questions = [];
  const pool = [];
  modules.forEach((m) => {
    m.topics.forEach((t) => {
      pool.push({
        q: t.q,
        a: t.a,
        sourceTitle: m.title,
      });
    });
  });

  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const item = pool[i];
    const distractors = [];
    for (let k = i + 1; k < i + 6 && distractors.length < 3 && k < pool.length; k++) {
      const frag = pool[k].a.split("\n")[0].slice(0, 80);
      if (frag && !distractors.includes(frag)) distractors.push(frag);
    }
    const choices = [item.a.split("\n")[0], ...distractors].filter(Boolean);
    // Shuffle choices
    for (let x = choices.length - 1; x > 0; x--) {
      const y = Math.floor(Math.random() * (x + 1));
      [choices[x], choices[y]] = [choices[y], choices[x]];
    }
    questions.push({
      id: uid("q_"),
      question: item.q,
      choices,
      answer: item.a.split("\n")[0],
      source: item.sourceTitle,
    });
  }
  return questions;
};

// --- MAIN COMPONENT ---
export default function Learn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [onlyDue, setOnlyDue] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawer = useDisclosure();
  const [exportAlert, setExportAlert] = useState(null);

  // Persistent State
  const [completed, setCompleted] = useState(() => loadJSON(STORAGE_KEYS.PROGRESS, []));
  const [notes, setNotes] = useState(() => loadJSON(STORAGE_KEYS.NOTES, {}));
  const [bookmarks, setBookmarks] = useState(() => loadJSON(STORAGE_KEYS.BOOKMARKS, []));
  const [quizScores, setQuizScores] = useState(() => loadJSON(STORAGE_KEYS.QUIZ_SCORES, {}));
  const [srs, setSrs] = useState(() => loadJSON(STORAGE_KEYS.SRS, {}));
  const [lastViewed, setLastViewed] = useState(() => loadJSON(STORAGE_KEYS.LAST_VIEWED, null));

  // Quiz UI
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);

  // Data Processing
  const modulesList = useMemo(() => {
    const arr = [];
    Object.entries(courseData).forEach(([chapterKey, chapterData]) => {
      chapterData.modules.forEach((m) => arr.push({ category: chapterKey, module: m }));
    });
    return arr;
  }, []);

  const allTags = useMemo(() => {
    const s = new Set();
    modulesList.forEach(({ module }) => {
      (module.tags || []).forEach((t) => s.add(t));
    });
    return ["all", ...Array.from(s).slice(0, 60)];
  }, [modulesList]);

  const filteredModules = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    let list = modulesList.filter(({ module }) => {
      if (selectedTag !== "all" && !(module.tags || []).includes(selectedTag)) return false;
      if (onlyDue) {
        const moduleDue = (module.topics || []).some((t) => {
          const key = `${module.title}::${t.q}`;
          const meta = srs[key];
          if (!meta) return false;
          const due = meta.nextReview;
          if (!due) return false;
          return new Date(due) <= new Date();
        });
        if (!moduleDue) return false;
      }
      if (!q) return true;
      if (module.title.toLowerCase().includes(q)) return true;
      for (const t of module.topics) {
        if (t.q.toLowerCase().includes(q) || t.a.toLowerCase().includes(q)) return true;
      }
      return false;
    });

    if (sortBy === "duration") {
      list.sort((a, b) => (parseInt(a.module.duration) || 0) - (parseInt(b.module.duration) || 0));
    } else if (sortBy === "title") {
      list.sort((a, b) => a.module.title.localeCompare(b.module.title));
    } else if (sortBy === "progress") {
      list.sort((a, b) => {
        const aId = `${a.category}::${a.module.title}`;
        const bId = `${b.category}::${b.module.title}`;
        const aDone = completed.includes(aId) ? 1 : 0;
        const bDone = completed.includes(bId) ? 1 : 0;
        return aDone - bDone;
      });
    }
    return list;
  }, [modulesList, searchText, selectedTag, sortBy, completed, srs, onlyDue]);

  // Persistence Effects
  useEffect(() => saveJSON(STORAGE_KEYS.PROGRESS, completed), [completed]);
  useEffect(() => saveJSON(STORAGE_KEYS.NOTES, notes), [notes]);
  useEffect(() => saveJSON(STORAGE_KEYS.BOOKMARKS, bookmarks), [bookmarks]);
  useEffect(() => saveJSON(STORAGE_KEYS.QUIZ_SCORES, quizScores), [quizScores]);
  useEffect(() => saveJSON(STORAGE_KEYS.SRS, srs), [srs]);
  useEffect(() => saveJSON(STORAGE_KEYS.LAST_VIEWED, lastViewed), [lastViewed]);

  const totalModules = modulesList.length;
  const progressPercent = Math.round((completed.length / totalModules) * 100);

  // Handlers
  const toggleComplete = (category, module) => {
    const id = `${category}::${module.title}`;
    setLastViewed(id);
    if (completed.includes(id)) {
      setCompleted(completed.filter((c) => c !== id));
    } else {
      setCompleted([...completed, id]);
    }
  };

  const setNote = (category, module, topicQ, value) => {
    const key = `${category}::${module.title}::${topicQ}`;
    const copy = { ...notes };
    copy[key] = { text: value, updated: nowISO() };
    setNotes(copy);
  };

  const toggleBookmark = (category, module, topicQ = null) => {
    const key = topicQ ? `${category}::${module.title}::${topicQ}` : `${category}::${module.title}`;
    if (bookmarks.includes(key)) {
      setBookmarks(bookmarks.filter((b) => b !== key));
    } else {
      setBookmarks([...bookmarks, key]);
    }
  };

  const scheduleReview = (category, module, topicQ, ease = 2) => {
    const key = `${category}::${module.title}::${topicQ}`;
    const meta = srs[key] || { intervalDays: 1, repetitions: 0, nextReview: null };
    let nextInterval = meta.intervalDays || 1;
    if (ease === 0) nextInterval = 1;
    else if (ease === 1) nextInterval = Math.max(1, Math.round(nextInterval * 1.5));
    else if (ease === 2) nextInterval = Math.max(1, Math.round(nextInterval * 2));
    else if (ease === 3) nextInterval = Math.max(1, Math.round(nextInterval * 3));
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);
    const updated = {
      intervalDays: nextInterval,
      repetitions: (meta.repetitions || 0) + 1,
      nextReview: nextDate.toISOString(),
    };
    setSrs({ ...srs, [key]: updated });
  };

  const exportProgress = () => {
    const payload = { exportedAt: nowISO(), completed, notes, bookmarks, quizScores, srs };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "benstocks_learning_export.json";
    a.click();
    URL.revokeObjectURL(url);
    setExportAlert({ status: "success", message: "Export started — check downloads." });
    setTimeout(() => setExportAlert(null), 3000);
  };

  const importProgress = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.completed) setCompleted(data.completed);
        if (data.notes) setNotes(data.notes);
        if (data.bookmarks) setBookmarks(data.bookmarks);
        if (data.quizScores) setQuizScores(data.quizScores);
        if (data.srs) setSrs(data.srs);
        setExportAlert({ status: "success", message: "Import successful." });
        setTimeout(() => setExportAlert(null), 3000);
      } catch (err) {
        setExportAlert({ status: "error", message: "Import failed. Invalid file." });
        setTimeout(() => setExportAlert(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const startQuiz = (count = 10) => {
    const modules = modulesList.map((m) => m.module);
    const q = generateQuizFromModules(modules, count);
    setQuizQuestions(q);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizOpen(true);
  };

  const answerQuiz = (choice) => {
    const cur = quizQuestions[quizIndex];
    if (!cur) return;
    if (choice === cur.answer) setQuizScore(quizScore + 1);
    if (quizIndex + 1 >= quizQuestions.length) {
      setQuizOpen(false);
      const scoreKey = `score_${nowISO()}`;
      setQuizScores({ ...quizScores, [scoreKey]: { score: quizScore + (choice === cur.answer ? 1 : 0), outOf: quizQuestions.length, date: nowISO() } });
      setExportAlert({ status: "success", message: `Quiz complete — score saved.` });
      setTimeout(() => setExportAlert(null), 3000);
      setQuizIndex(0);
      setQuizScore(0);
    } else {
      setQuizIndex(quizIndex + 1);
    }
  };

  const downloadCertificate = () => {
    if (progressPercent < 100) {
      setExportAlert({ status: "error", message: "Complete all modules to claim a certificate." });
      setTimeout(() => setExportAlert(null), 3000);
      return;
    }
    const name = "BenStocks Academy Completion";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
      <rect width='100%' height='100%' fill='#0b1220'/>
      <text x='50%' y='25%' fill='white' font-size='48' text-anchor='middle' font-family='sans-serif'>Certificate of Completion</text>
      <text x='50%' y='45%' fill='white' font-size='36' text-anchor='middle' font-family='sans-serif'>${name}</text>
      <text x='50%' y='55%' fill='gray' font-size='20' text-anchor='middle'>Presented to the dedicated learner</text>
      <text x='50%' y='85%' fill='white' font-size='16' text-anchor='middle'>Issued: ${new Date().toLocaleDateString()}</text>
    </svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "benstocks_certificate.svg";
    a.click();
    URL.revokeObjectURL(url);
    setExportAlert({ status: "success", message: "Certificate downloaded (SVG)." });
    setTimeout(() => setExportAlert(null), 3000);
  };

  const resetProgress = () => {
    if (!window.confirm("Reset all learning progress, notes and bookmarks? This cannot be undone.")) return;
    setCompleted([]);
    setNotes({});
    setBookmarks([]);
    setQuizScores({});
    setSrs({});
    setLastViewed(null);
    setExportAlert({ status: "success", message: "Progress reset." });
    setTimeout(() => setExportAlert(null), 3000);
  };

  const resumeLast = () => {
    if (!lastViewed) {
      setExportAlert({ status: "info", message: "No last viewed lesson." });
      setTimeout(() => setExportAlert(null), 2000);
      return;
    }
    const [category, title, topicQ] = lastViewed.split("::");
    setSearchText(title || "");
    setDrawerOpen(true);
    setTimeout(() => {
      const el = document.getElementById(encodeURIComponent(lastViewed));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.boxShadow = "0 0 0 3px rgba(66,153,225,0.3)";
        setTimeout(() => (el.style.boxShadow = ""), 1600);
      }
    }, 260);
  };

  const copyShareLink = (category, module) => {
    const id = `${category}::${module.title}`;
    const url = `${window.location.origin}${window.location.pathname}?focus=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url).then(() => {
      setExportAlert({ status: "success", message: "Share link copied to clipboard." });
      setTimeout(() => setExportAlert(null), 2000);
    }).catch(() => {
      setExportAlert({ status: "error", message: "Copy failed." });
      setTimeout(() => setExportAlert(null), 2000);
    });
  };

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus) {
      setSearchText(decodeURIComponent(focus.split("::")[1] || ""));
      setTimeout(() => {
        const el = document.getElementById(encodeURIComponent(focus));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 400);
    }
  }, []);

  const ModuleCard = ({ category, module }) => {
    const [open, setOpen] = useState(false);
    const id = `${category}::${module.title}`;
    const completedFlag = completed.includes(id);

    return (
      <Box id={encodeURIComponent(id)} borderRadius="md" overflow="hidden" border="1px solid var(--border-color)" bg={useColorModeValue("white", "var(--bg-dark-secondary)")}>
        <Flex p={4} align="center" justify="space-between" onClick={() => { setOpen(!open); setLastViewed(id); }} cursor="pointer">
          <HStack spacing={4}>
            <Box w="56px" h="56px" bg="whiteAlpha.100" borderRadius="full" alignItems="center" display="flex" justifyContent="center" fontSize="24px">
              {module.icon}
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="lg" color={completedFlag ? "green.400" : "var(--text-primary)"}>{module.title}</Text>
              <HStack spacing={2}>
                <Badge colorScheme="blue">{module.duration}</Badge>
                <Text fontSize="xs" color="gray.500">• {module.topics.length} Lessons</Text>
                <Text fontSize="xs" color="gray.400">• {module.tags?.slice(0, 2).join(", ")}</Text>
              </HStack>
            </VStack>
          </HStack>

          <HStack>
            <Tooltip label="Copy share link">
              <IconButton size="sm" onClick={(e) => { e.stopPropagation(); copyShareLink(category, module); }} icon={<CopyIcon />} />
            </Tooltip>
            <Tooltip label={bookmarks.includes(id) ? "Remove bookmark" : "Bookmark"}>
              <IconButton size="sm" onClick={(e) => { e.stopPropagation(); toggleBookmark(category, module); }} icon={<StarIcon />} color={bookmarks.includes(id) ? "yellow.300" : "gray.400"} />
            </Tooltip>
            <Button size="sm" onClick={(e) => { e.stopPropagation(); toggleComplete(category, module); }} leftIcon={<CheckCircleIcon />} colorScheme={completedFlag ? "gray" : "green"}>
              {completedFlag ? "Mark Unread" : "Complete"}
            </Button>
          </HStack>
        </Flex>

        {open && (
          <Box p={4} pt={0} borderTop="1px solid var(--border-color)" bg={useColorModeValue("gray.50", "blackAlpha.200")}>
            <VStack align="stretch" spacing={4} mt={3}>
              {module.topics.map((t, ti) => {
                const topicKey = `${category}::${module.title}::${t.q}`;
                const savedNote = notes[topicKey]?.text || "";
                const isBookmarked = bookmarks.includes(topicKey);
                const srsMeta = srs[topicKey] || null;

                return (
                  <Box key={ti} p={3} borderRadius="md" bg={useColorModeValue("white", "transparent")} border="1px dashed var(--border-color)">
                    <Flex justify="space-between">
                      <Box>
                        <Text fontWeight="bold" color="blue.300">{t.q}</Text>
                        <Text fontSize="sm" color="gray.300" whiteSpace="pre-line" mt={2}>{t.a}</Text>
                      </Box>
                      <VStack spacing={2}>
                        <Tooltip label={isBookmarked ? "Remove bookmark (topic)" : "Bookmark topic"}>
                          <IconButton size="sm" onClick={() => toggleBookmark(category, module, t.q)} icon={<StarIcon />} colorScheme={isBookmarked ? "yellow" : "gray"} />
                        </Tooltip>
                        <Tooltip label="Schedule quick review (Good)">
                          <IconButton size="sm" onClick={() => scheduleReview(category, module, t.q, 2)} icon={<RepeatIcon />} />
                        </Tooltip>
                      </VStack>
                    </Flex>

                    <Box mt={3}>
                      <Textarea placeholder="Notes (saved automatically)..." value={savedNote} onChange={(e) => setNote(category, module, t.q, e.target.value)} size="sm" />
                      <HStack mt={2} justify="space-between">
                        <Text fontSize="xs" color="gray.400">{srsMeta ? `Next review: ${new Date(srsMeta.nextReview).toLocaleString()}` : "No review scheduled"}</Text>
                        <HStack>
                          <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(t.a)}>Copy</Button>
                          <Button size="sm" variant="ghost" onClick={() => setNote(category, module, t.q, (savedNote || "") + "\n\n[Reflection] ")}>Add Reflection</Button>
                        </HStack>
                      </HStack>
                    </Box>
                  </Box>
                );
              })}

              <Divider />
              <HStack justify="space-between">
                <Button size="sm" leftIcon={<QuestionOutlineIcon />} onClick={() => {
                  const q = generateQuizFromModules([module], Math.min(5, module.topics.length));
                  setQuizQuestions(q);
                  setQuizIndex(0);
                  setQuizScore(0);
                  setQuizOpen(true);
                }}>Quick Quiz (Module)</Button>

                <HStack spacing={3}>
                  <Button size="sm" leftIcon={<DownloadIcon />} onClick={() => {
                    const payload = {
                      module: module.title,
                      notes: module.topics.map(t => ({ q: t.q, note: notes[`${category}::${module.title}::${t.q}`]?.text || "" })),
                    };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${module.title.replace(/\s+/g, "_")}_notes.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setExportAlert({ status: "success", message: "Module notes exported." });
                    setTimeout(() => setExportAlert(null), 2000);
                  }}>Export Notes</Button>

                  <Button size="sm" leftIcon={<AtSignIcon />} onClick={() => {
                    const id = `${category}::${module.title}`;
                    const url = `${window.location.origin}${window.location.pathname}?focus=${encodeURIComponent(id)}`;
                    navigator.clipboard.writeText(url);
                    setExportAlert({ status: "success", message: "Module link copied." });
                    setTimeout(() => setExportAlert(null), 2000);
                  }}>Share</Button>
                </HStack>
              </HStack>
            </VStack>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box className="container" p={{ base: 3, md: 6 }}>
      <BackButton />
      <Flex justify="space-between" align="center" mb={6} direction={{ base: "column", md: "row" }} gap={4}>
        <Box>
          <Heading size="lg">BenStocks Academy 🎓</Heading>
          <Text color="gray.400">Interactive curriculum — learn, quiz, bookmark, and master investing.</Text>
        </Box>

        <HStack spacing={3} wrap="wrap">
          <Button size="sm" onClick={() => startQuiz(12)} leftIcon={<StarIcon />}>Take a Quiz</Button>
          <Button size="sm" onClick={() => exportProgress()} leftIcon={<DownloadIcon />}>Export</Button>
          <Button size="sm" onClick={() => downloadCertificate()} leftIcon={<DownloadIcon />}>Certificate</Button>
          <Button size="sm" colorScheme="red" onClick={() => resetProgress()}>Reset</Button>
        </HStack>
      </Flex>

      {exportAlert && (
        <Alert status={exportAlert.status === "error" ? "error" : exportAlert.status === "info" ? "info" : "success"} mb={4}>
          <AlertIcon />
          <AlertTitle mr={2}>{exportAlert.message}</AlertTitle>
        </Alert>
      )}

      <Flex gap={4} mb={4} align="center" direction={{ base: "column", md: "row" }}>
        <InputGroup maxW="560px">
          <Input placeholder="Search topics..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          <InputRightElement>
            <SearchIcon color="gray.400" />
          </InputRightElement>
        </InputGroup>

        <Select maxW="200px" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
          {allTags.map((t) => <option key={t} value={t} style={{ color: 'black' }}>{t}</option>)}
        </Select>

        <Select maxW="180px" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="default" style={{ color: 'black' }}>Sort: Relevance</option>
          <option value="title" style={{ color: 'black' }}>Sort: Title</option>
          <option value="duration" style={{ color: 'black' }}>Sort: Duration</option>
          <option value="progress" style={{ color: 'black' }}>Sort: Progress</option>
        </Select>

        <HStack>
          <Text fontSize="sm" whiteSpace="nowrap">Show only due</Text>
          <Switch isChecked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} />
        </HStack>

        <Button size="sm" onClick={() => setDrawerOpen(true)}>Index</Button>
      </Flex>

      <Flex mb={6} gap={6} direction={{ base: "column", md: "row" }}>
        <Box flex="1" p={4} borderRadius="md" bg={useColorModeValue("white", "var(--bg-dark-secondary)")} border="1px solid var(--border-color)">
          <HStack justify="space-between">
            <VStack align="start">
              <Text fontSize="sm" color="gray.500">Learning Progress</Text>
              <Heading size="md">{progressPercent}%</Heading>
            </VStack>
            <VStack align="end">
              <Text fontSize="sm">Modules Completed</Text>
              <Text fontWeight="bold">{completed.length} / {totalModules}</Text>
            </VStack>
          </HStack>
          <Progress value={progressPercent} size="sm" mt={4} hasStripe isAnimated />
        </Box>
      </Flex>

      <Tabs variant="soft-rounded" colorScheme="blue" isLazy>
        <TabList mb={6} overflowX="auto" py={1}>
          {Object.keys(courseData).map(cat => (
            <Tab key={cat} mr={2} _selected={{ color: 'white', bg: 'blue.600', boxShadow: 'lg' }}>{cat}</Tab>
          ))}
        </TabList>

        <TabPanels>
          {Object.entries(courseData).map(([category, chapterData], catIndex) => (
            <TabPanel key={catIndex} p={0}>
              <Box mb={6}>
                <Heading size="md" mb={2}>{chapterData.title}</Heading>
                <Text color="gray.400">{chapterData.description}</Text>
              </Box>
              <ChakraGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {chapterData.modules.map((module, i) => (
                  <ModuleCard key={`${category}-${module.title}-${i}`} category={category} module={module} />
                ))}
              </ChakraGrid>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      <Drawer isOpen={drawerOpen} placement="right" onClose={() => setDrawerOpen(false)} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Course Index</DrawerHeader>
          <DrawerBody>
            {Object.keys(courseData).map((cat) => (
              <Box key={cat} mb={4}>
                <Heading size="sm" mb={2}>{cat}</Heading>
                <VStack align="stretch" spacing={2}>
                  {courseData[cat].modules.map((m, idx) => {
                    const id = `${cat}::${m.title}`;
                    return (
                      <Flex key={id} justify="space-between" align="center">
                        <Text fontSize="sm" cursor="pointer" onClick={() => {
                          setDrawerOpen(false);
                          setTimeout(() => {
                            const el = document.getElementById(encodeURIComponent(id));
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 220);
                        }}>{m.title}</Text>
                        <Badge>{m.duration}</Badge>
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>
            ))}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={quizOpen} onClose={() => setQuizOpen(false)} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Interactive Quiz</ModalHeader>
          <ModalBody>
            {quizQuestions.length === 0 ? (
              <Text>No questions available.</Text>
            ) : (
              <>
                <Text fontSize="sm" color="gray.500">Question {quizIndex + 1} of {quizQuestions.length}</Text>
                <Heading size="md" mt={2}>{quizQuestions[quizIndex].question}</Heading>
                <VStack align="stretch" mt={4}>
                  {quizQuestions[quizIndex].choices.map((c, idx) => (
                    <Button key={idx} onClick={() => answerQuiz(c)}>{c}</Button>
                  ))}
                </VStack>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setQuizOpen(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
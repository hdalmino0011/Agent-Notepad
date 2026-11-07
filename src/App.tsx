/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Copy,
  Trash2,
  Clock,
  RotateCcw,
  Sun,
  Moon,
  CheckSquare,
  Square,
  Plus,
  X,
  FileText,
  CaseUpper,
  Search,
  Check,
  Columns,
  Rows,
  GripVertical,
  GripHorizontal,
  Download,
  WifiOff,
} from 'lucide-react';

/* ============================================================================
 * PWA INSTALL & OFFLINE HOOKS
 * ============================================================================ */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron?: boolean;
      setWindowWidth?: (width: number) => void;
    };
  }
}

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      // Do NOT call e.preventDefault() so the browser itself displays its native install prompt/icon
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/* ============================================================================
 * DATA TYPES & CONSTANTS
 * ============================================================================ */
export interface ScenarioItem {
  id: string;
  label: string;
  shortLabel: string;
  output?: string;
  isTemplate4?: boolean;
}

export interface ScenarioCategory {
  id: string;
  title: string;
  shortTitle: string;
  colorClass: string;
  items: ScenarioItem[];
}

export interface CustomSnippet {
  id: string;
  label: string;
  text: string;
}

export type TemplateType = 1 | 2 | 3 | 4 | 'free';

export const CHECKLIST_ITEMS = [
  'REFUND FORM DONE',
  'REQ FORM DONE',
  'TRACKING FORM DONE',
  'NOTES DONE',
] as const;

export type ChecklistKey = (typeof CHECKLIST_ITEMS)[number];

export interface NoteEntry {
  id: string;
  templateType: TemplateType;
  text: string;
  checks: Record<ChecklistKey, boolean>;
}

const DEFAULT_CHECKS: Record<ChecklistKey, boolean> = {
  'REFUND FORM DONE': false,
  'REQ FORM DONE': false,
  'TRACKING FORM DONE': false,
  'NOTES DONE': false,
};

const TEMPLATE_META: Record<
  TemplateType,
  { label: string; badge: string; btnStyle: string; activeRing: string }
> = {
  1: {
    label: 'Type 1',
    badge: '+Add',
    btnStyle:
      'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-xs',
    activeRing: 'ring-2 ring-blue-400 dark:ring-blue-300',
  },
  2: {
    label: 'Type 2',
    badge: '+Add',
    btnStyle:
      'bg-purple-600 hover:bg-purple-700 text-white border-purple-700 shadow-xs',
    activeRing: 'ring-2 ring-purple-400 dark:ring-purple-300',
  },
  3: {
    label: 'Type 3',
    badge: '+Add',
    btnStyle:
      'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs',
    activeRing: 'ring-2 ring-emerald-400 dark:ring-emerald-300',
  },
  4: {
    label: 'Type 4',
    badge: '+Add',
    btnStyle:
      'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-xs',
    activeRing: 'ring-2 ring-amber-400 dark:ring-amber-300',
  },
  free: {
    label: 'Free Note',
    badge: '+Add',
    btnStyle:
      'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-xs',
    activeRing: 'ring-2 ring-rose-400 dark:ring-rose-300',
  },
};

const SCENARIO_GROUPS: ScenarioCategory[] = [
  {
    id: 'refunds-returns',
    title: 'Refunds & Returns',
    shortTitle: 'Refunds',
    colorClass:
      'bg-rose-500/15 dark:bg-rose-500/20 text-rose-900 dark:text-rose-200 border-rose-400/50 dark:border-rose-500/40 hover:bg-rose-500/25 dark:hover:bg-rose-500/30',
    items: [
      {
        id: 'refund-not-satisfied',
        label: 'Refund – Not Satisfied',
        shortLabel: 'Refund: Not Satisfied',
        output:
          'customer is calling for a refund because they are not satisfied with the product since it is not working',
      },
      {
        id: 'refund-returned-product',
        label: 'Refund – Returned Product',
        shortLabel: 'Refund: Returned Prod',
        output:
          'customer wants a refund because they returned the products but have not received the refund yet',
      },
      {
        id: 'refund-wrong-product',
        label: 'Refund – Wrong Product Received',
        shortLabel: 'Refund: Wrong Product',
        output:
          'customer is calling to get a refund because they received the wrong product',
      },
      {
        id: 'refund-health-concern',
        label: 'Refund – Concerned About Health',
        shortLabel: 'Refund: Health Concern',
        output:
          'customer wants a refund because they are concerned about their health and do not trust the product',
      },
      {
        id: 'refund-follow-up',
        label: 'Refund – Follow-Up',
        shortLabel: 'Refund: Follow-Up',
        output:
          'customer is calling to follow up on their refund because they have not received it yet',
      },
      {
        id: 'return-instructions',
        label: 'Return Instructions',
        shortLabel: 'Return Instructions',
        output: 'customer is calling to confirm the return instructions',
      },
    ],
  },
  {
    id: 'order-issues',
    title: 'Order Issues',
    shortTitle: 'Orders',
    colorClass:
      'bg-amber-500/15 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-400/50 dark:border-amber-500/40 hover:bg-amber-500/25 dark:hover:bg-amber-500/30',
    items: [
      {
        id: 'order-canceled',
        label: 'Order Canceled',
        shortLabel: 'Order Canceled',
        output:
          'customer is calling to cancel the order because they do not want the products',
      },
      {
        id: 'duplicate-charge',
        label: 'Duplicate / Double Charge',
        shortLabel: 'Double Charge',
        output: 'customer is calling because they were charged multiple times',
      },
      {
        id: 'wrong-quantity',
        label: 'Wrong Quantity',
        shortLabel: 'Wrong Quantity',
        output:
          'customer is calling because the quantity they received does not match what they ordered',
      },
      {
        id: 'promo-discount',
        label: 'Promo/Discount Confusion',
        shortLabel: 'Promo / Discount',
        output:
          'customer is calling because they think they did not receive the promotional discount',
      },
      {
        id: 'package-not-received',
        label: 'Package Not Received',
        shortLabel: 'Pkg Not Received',
        output:
          'customer is calling because they have not received their package',
      },
      {
        id: 'missing-items',
        label: 'Missing Items',
        shortLabel: 'Missing Items',
        output:
          'customer is calling because items are missing from the package',
      },
    ],
  },
  {
    id: 'sales-transfers',
    title: 'Sales & Transfers',
    shortTitle: 'Sales',
    colorClass:
      'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-emerald-400/50 dark:border-emerald-500/40 hover:bg-emerald-500/25 dark:hover:bg-emerald-500/30',
    items: [
      {
        id: 'transfer-to-sales',
        label: 'Transfer to Sales',
        shortLabel: 'Transfer to Sales',
        isTemplate4: true,
      },
      {
        id: 'purchase-inquiry',
        label: 'Purchase Inquiry',
        shortLabel: 'Purchase Inquiry',
        output:
          'customer is calling to purchase [product] — needs assistance with pricing and discounts',
      },
    ],
  },
  {
    id: 'onboarding-support',
    title: 'Onboarding / Product Support',
    shortTitle: 'Support',
    colorClass:
      'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 border-cyan-400/50 dark:border-cyan-500/40 hover:bg-cyan-500/25 dark:hover:bg-cyan-500/30',
    items: [
      {
        id: 'push-button-startup',
        label: 'Push Button System Startup',
        shortLabel: 'Push Button Startup',
        output:
          'customer is calling to get started on the login process for the push button system and to get the coach',
      },
      {
        id: 'product-question',
        label: 'Product Question',
        shortLabel: 'Product Question',
        output:
          'customer is calling to ask about the product before purchasing',
      },
    ],
  },
];

const QUICK_LINES: Array<{
  label: string;
  field: 'threat' | 'offerSave' | 'accountStatus';
  value: string;
  colorClass: string;
}> = [
  {
    label: 'Threat: none',
    field: 'threat',
    value: 'none',
    colorClass:
      'bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 border-indigo-400/50 hover:bg-indigo-500/25',
  },
  {
    label: 'OFFER SAVE: NA',
    field: 'offerSave',
    value: 'NA',
    colorClass:
      'bg-fuchsia-500/15 dark:bg-fuchsia-500/20 text-fuchsia-900 dark:text-fuchsia-200 border-fuchsia-400/50 hover:bg-fuchsia-500/25',
  },
  {
    label: 'ACCOUNT STATUS: OTP',
    field: 'accountStatus',
    value: 'OTP',
    colorClass:
      'bg-teal-500/15 dark:bg-teal-500/20 text-teal-900 dark:text-teal-200 border-teal-400/50 hover:bg-teal-500/25',
  },
];

const STORAGE_KEYS = {
  AGENT_NAME: 'ccnp_agent_name',
  NOTE_ENTRIES: 'ccnp_note_entries_v2',
  LEGACY_NOTES: 'ccnp_notes_content',
  SNIPPETS: 'ccnp_custom_snippets',
  THEME: 'ccnp_theme_mode',
  UPPERCASE: 'ccnp_auto_uppercase',
  ACTIVE_TEMPLATE: 'ccnp_active_template',
  LAYOUT_MODE: 'ccnp_layout_mode',
  CONTAINER_WIDTH: 'ccnp_container_width',
  TOP_PANE_HEIGHT: 'ccnp_top_pane_height',
  SIDEBAR_WIDTH: 'ccnp_sidebar_width',
};

export default function App() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Persisted Agent Name
  const [agentName, setAgentName] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AGENT_NAME) ?? '';
    } catch {
      return '';
    }
  });

  // Last-selected Notation Template Type (1 | 2 | 3 | 4 | 'free')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEMPLATE);
      if (raw === 'free') return 'free';
      const saved = Number(raw);
      if (saved === 1 || saved === 2 || saved === 3 || saved === 4) return saved;
    } catch {
      // ignore
    }
    return 1;
  });

  // List of Generated Note Blocks (each has its own text + its own 4 non-copyable checklists below it)
  const [noteEntries, setNoteEntries] = useState<NoteEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTE_ENTRIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((entry: NoteEntry) => ({
            ...entry,
            text: (entry.text || '').replace(/\n?\*{10,}\s*$/g, ''),
            checks: { ...DEFAULT_CHECKS, ...(entry.checks || {}) },
          }));
        }
      }
      // Migrate any legacy plain-text notes if present
      const legacy = localStorage.getItem(STORAGE_KEYS.LEGACY_NOTES);
      if (legacy && legacy.trim()) {
        const rawBlocks = legacy
          .split(/\*{10,}/)
          .map((b) => b.trim())
          .filter(Boolean);
        return rawBlocks.map((b, idx) => ({
          id: `note-mig-${idx}-${Date.now()}`,
          templateType: 1,
          text: b,
          checks: { ...DEFAULT_CHECKS },
        }));
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Tracks which note block is currently active/focused for Scenario & Quick-Line fills
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Undo History Stack of NoteEntry arrays
  const [undoStack, setUndoStack] = useState<NoteEntry[][]>([]);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  const [autoUppercaseHeaders, setAutoUppercaseHeaders] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.UPPERCASE) === 'true';
    } catch {
      return false;
    }
  });

  const [layoutMode, setLayoutMode] = useState<'vertical' | 'split'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT_MODE);
      return saved === 'split' ? 'split' : 'vertical';
    } catch {
      return 'vertical';
    }
  });

  const isNativeDesktop =
    typeof window !== 'undefined' &&
    (Boolean(window.electronAPI?.isElectron) ||
      window.navigator.userAgent.includes('Electron') ||
      window.location.protocol === 'file:');

  const [containerWidth, setContainerWidth] = useState<number>(() => {
    try {
      if (
        typeof window !== 'undefined' &&
        (Boolean(window.electronAPI?.isElectron) ||
          window.navigator.userAgent.includes('Electron') ||
          window.location.protocol === 'file:')
      ) {
        return Math.max(240, window.innerWidth || 360);
      }
      const saved = Number(localStorage.getItem(STORAGE_KEYS.CONTAINER_WIDTH));
      return saved >= 240 && saved <= 1600 ? saved : 360;
    } catch {
      return 360;
    }
  });

  const [topPaneHeight, setTopPaneHeight] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEYS.TOP_PANE_HEIGHT));
      return saved >= 70 && saved <= 900 ? saved : 210;
    } catch {
      return 210;
    }
  });

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTH));
      return saved >= 160 && saved <= 900 ? saved : 300;
    } catch {
      return 300;
    }
  });

  // In the native Windows .exe app, automatically track mouse window resizing
  useEffect(() => {
    if (!isNativeDesktop) return;
    const handleNativeWindowResize = () => {
      setContainerWidth(Math.max(240, window.innerWidth));
    };
    window.addEventListener('resize', handleNativeWindowResize);
    return () => window.removeEventListener('resize', handleNativeWindowResize);
  }, [isNativeDesktop]);

  const [customSnippets, setCustomSnippets] = useState<CustomSnippet[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SNIPPETS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [snippetInput, setSnippetInput] = useState<string>('');
  const [snippetLabelInput, setSnippetLabelInput] = useState<string>('');
  const [showSnippetForm, setShowSnippetForm] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const notesScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AGENT_NAME, agentName);
    } catch {
      // ignore
    }
  }, [agentName]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEMPLATE, String(selectedTemplate));
    } catch {
      // ignore
    }
  }, [selectedTemplate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTE_ENTRIES, JSON.stringify(noteEntries));
    } catch {
      // ignore
    }
  }, [noteEntries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.UPPERCASE, String(autoUppercaseHeaders));
    } catch {
      // ignore
    }
  }, [autoUppercaseHeaders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SNIPPETS, JSON.stringify(customSnippets));
    } catch {
      // ignore
    }
  }, [customSnippets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAYOUT_MODE, layoutMode);
    } catch {
      // ignore
    }
  }, [layoutMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTAINER_WIDTH, String(containerWidth));
    } catch {
      // ignore
    }
  }, [containerWidth]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOP_PANE_HEIGHT, String(topPaneHeight));
    } catch {
      // ignore
    }
  }, [topPaneHeight]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_WIDTH, String(sidebarWidth));
    } catch {
      // ignore
    }
  }, [sidebarWidth]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  };

  // Drag resize handlers (supports both browser drag and native .exe mouse resizing)
  const startContainerWidthDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = containerWidth || window.innerWidth;
    const onMove = (moveEvent: MouseEvent) => {
      const maxAllowed = isNativeDesktop ? 1920 : window.innerWidth;
      const next = Math.max(
        240,
        Math.min(maxAllowed, startWidth + (moveEvent.clientX - startX))
      );
      setContainerWidth(next);
      if (isNativeDesktop && window.electronAPI?.setWindowWidth) {
        window.electronAPI.setWindowWidth(next);
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startTopPaneHeightDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = topPaneHeight;
    const onMove = (moveEvent: MouseEvent) => {
      const next = Math.max(
        70,
        Math.min(window.innerHeight - 120, startH + (moveEvent.clientY - startY))
      );
      setTopPaneHeight(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startSidebarWidthDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMove = (moveEvent: MouseEvent) => {
      const next = Math.max(
        160,
        Math.min(
          Math.max(400, window.innerWidth - 160),
          startW + (moveEvent.clientX - startX)
        )
      );
      setSidebarWidth(next);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const applyHeaderCasing = (rawBlock: string): string => {
    if (!autoUppercaseHeaders) return rawBlock;
    return rawBlock
      .split('\n')
      .map((line) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const label = line.slice(0, colonIndex).toUpperCase();
          const rest = line.slice(colonIndex + 1);
          return `${label}:${rest}`;
        }
        return line;
      })
      .join('\n');
  };

  /**
   * Builds a Notation Template (Type 1 – Type 4, or Free Note):
   * - Type 1 & Type 3: "Campaign: " at the very start
   * - Type 4: "Campaign: " directly below "Agent Name: "
   * - Free Note ('free'): clean empty note without a notation template
   */
  const buildTemplateText = (
    type: TemplateType,
    reasonSentence = ''
  ): string => {
    if (type === 'free') {
      return reasonSentence;
    }

    const cleanAgent = agentName.trim();

    let raw = '';
    if (type === 1) {
      raw = [
        `Campaign: `,
        `Agent Name: ${cleanAgent}`,
        `Order Date: `,
        `REASON FOR CALLING: ${reasonSentence}`,
        `OFFER SAVE: `,
        `THREAT: `,
        `RESOLUTION: `,
        `ACCOUNT STATUS: `,
      ].join('\n');
    } else if (type === 2) {
      raw = [
        `AGENT: ${cleanAgent}`,
        `REASON FOR CALLING: ${reasonSentence}`,
        `THREAT: `,
        `SAVE OFFER: `,
        `RESOLUTION: `,
        `STATUS: `,
        ``,
        `campaign: `,
        `order date: `,
        `name: `,
        `phone number: `,
        `email address: `,
        `order id: `,
        `product name: `,
      ].join('\n');
    } else if (type === 3) {
      raw = [
        `Campaign: `,
        `Customer Name: `,
        `Email Address: `,
        `Order ID: `,
        `Phone Number: `,
        ``,
        `Agent Name: ${cleanAgent}`,
        `Reason for Calling: ${reasonSentence}`,
        `Threat: `,
        `Resolution: `,
        `Account Status: `,
      ].join('\n');
    } else {
      // TYPE 4 (Transfer to Sales) — Campaign: is placed directly below Agent Name:
      raw = [
        `Transferred to Sales: ${reasonSentence}`,
        `Email: `,
        `Customer Name: `,
        `Phone: `,
        `Agent Name: ${cleanAgent}`,
        `Campaign: `,
      ].join('\n');
    }

    return applyHeaderCasing(raw);
  };

  const pushUndoAndSetEntries = (
    nextEntries: NoteEntry[],
    newActiveId?: string,
    toastLabel?: string
  ) => {
    setUndoStack((prev) => [...prev.slice(-49), noteEntries]);
    setNoteEntries(nextEntries);
    if (newActiveId) {
      setActiveNoteId(newActiveId);
    }
    requestAnimationFrame(() => {
      if (notesScrollContainerRef.current) {
        notesScrollContainerRef.current.scrollTop =
          notesScrollContainerRef.current.scrollHeight;
      }
    });
    if (toastLabel) {
      triggerToast(toastLabel);
    }
  };

  /**
   * Pressing a Notation Type button (Type 1 – Type 4 or Free Note):
   * - If the active note is a Free Note and the user presses Type 1 – Type 4,
   *   generates that notation template directly inside the Free Note.
   * - Otherwise generates a new separate NoteEntry below existing notes
   *   with its own 4 clickable checklists below it.
   * NEVER deletes or overwrites previous notes!
   */
  const handleGenerateNotationType = (type: TemplateType) => {
    setSelectedTemplate(type);

    if (type !== 'free' && noteEntries.length > 0) {
      const targetIndex =
        activeNoteId && noteEntries.some((n) => n.id === activeNoteId)
          ? noteEntries.findIndex((n) => n.id === activeNoteId)
          : noteEntries.length - 1;
      const targetNote = noteEntries[targetIndex];

      if (targetNote && targetNote.templateType === 'free') {
        const templateText = buildTemplateText(type, '');
        const trimmedExisting = targetNote.text.trimEnd();
        const updatedText = trimmedExisting
          ? `${trimmedExisting}\n\n${templateText}`
          : templateText;
        const updatedEntries = noteEntries.map((entry, idx) =>
          idx === targetIndex ? { ...entry, text: updatedText } : entry
        );
        pushUndoAndSetEntries(
          updatedEntries,
          targetNote.id,
          `Added Type ${type} Template into Free Note #${targetIndex + 1}`
        );
        return;
      }
    }

    const newEntry: NoteEntry = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      templateType: type,
      text: buildTemplateText(type, ''),
      checks: { ...DEFAULT_CHECKS },
    };
    const label = type === 'free' ? 'Free Note' : `Type ${type} Notation`;
    pushUndoAndSetEntries(
      [...noteEntries, newEntry],
      newEntry.id,
      `Generated ${label}`
    );
  };

  /**
   * Clicking a Scenario Button:
   * - If the user has an active/latest generated note, fills or appends to
   *   REASON FOR CALLING: inside that note (or appends to a Free Note) without deleting any notes.
   * - If there are no notes yet (or if "Transfer to Sales" is clicked), it
   *   generates a new NoteEntry together with its 4 checklists below!
   */
  const handleScenarioClick = (item: ScenarioItem) => {
    if (item.isTemplate4) {
      handleGenerateNotationType(4);
      return;
    }

    const sentence = item.output ?? '';
    const targetType: TemplateType =
      selectedTemplate === 4 || selectedTemplate === 'free'
        ? 1
        : selectedTemplate;

    if (noteEntries.length === 0) {
      const newEntry: NoteEntry = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        templateType: targetType,
        text: buildTemplateText(targetType, sentence),
        checks: { ...DEFAULT_CHECKS },
      };
      pushUndoAndSetEntries(
        [newEntry],
        newEntry.id,
        `Generated Type ${targetType} + ${item.shortLabel}`
      );
      return;
    }

    // Find target note (activeNoteId if valid, otherwise the last generated note)
    const targetIndex =
      activeNoteId && noteEntries.some((n) => n.id === activeNoteId)
        ? noteEntries.findIndex((n) => n.id === activeNoteId)
        : noteEntries.length - 1;

    const targetNote = noteEntries[targetIndex];
    const reasonLineRegex =
      /^(REASON FOR CALLING|Reason for Calling):[ \t]*(.*)$/m;

    if (reasonLineRegex.test(targetNote.text)) {
      const updatedText = targetNote.text.replace(
        reasonLineRegex,
        (_, prefix: string, existingVal: string) => {
          const trimmedExisting = existingVal.trim();
          if (!trimmedExisting) {
            return `${prefix}: ${sentence}`;
          }
          return `${prefix}: ${trimmedExisting} / ${sentence}`;
        }
      );
      const updatedEntries = noteEntries.map((entry, idx) =>
        idx === targetIndex ? { ...entry, text: updatedText } : entry
      );
      pushUndoAndSetEntries(
        updatedEntries,
        targetNote.id,
        `Added to Reason in Note #${targetIndex + 1}`
      );
    } else if (targetNote.templateType === 'free') {
      const trimmed = targetNote.text.trimEnd();
      const updatedText = trimmed ? `${trimmed}\n${sentence}` : sentence;
      const updatedEntries = noteEntries.map((entry, idx) =>
        idx === targetIndex ? { ...entry, text: updatedText } : entry
      );
      pushUndoAndSetEntries(
        updatedEntries,
        targetNote.id,
        `Added ${item.shortLabel} to Free Note #${targetIndex + 1}`
      );
    } else {
      // Append a new note block with the scenario sentence
      const newEntry: NoteEntry = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        templateType: targetType,
        text: buildTemplateText(targetType, sentence),
        checks: { ...DEFAULT_CHECKS },
      };
      pushUndoAndSetEntries(
        [...noteEntries, newEntry],
        newEntry.id,
        `Generated Type ${targetType} + ${item.shortLabel}`
      );
    }
  };

  /**
   * Clicking a Quick Line ("Threat: none", "OFFER SAVE: NA", "ACCOUNT STATUS: OTP"):
   * Fills that field inside the active/latest note (or generates a new note if none exist).
   */
  const handleQuickLineClick = (ql: (typeof QUICK_LINES)[number]) => {
    const targetType: TemplateType =
      selectedTemplate === 4 || selectedTemplate === 'free'
        ? 1
        : selectedTemplate;

    let fieldRegex: RegExp;
    if (ql.field === 'threat') {
      fieldRegex = /^(THREAT|Threat):[ \t]*.*$/m;
    } else if (ql.field === 'offerSave') {
      fieldRegex = /^(OFFER SAVE|SAVE OFFER|Offer Save):[ \t]*.*$/m;
    } else {
      fieldRegex = /^(ACCOUNT STATUS|Account Status|STATUS):[ \t]*.*$/m;
    }

    if (noteEntries.length === 0) {
      const initialText = buildTemplateText(targetType, '').replace(
        fieldRegex,
        (match) => `${match.split(':')[0]}: ${ql.value}`
      );
      const newEntry: NoteEntry = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        templateType: targetType,
        text: initialText,
        checks: { ...DEFAULT_CHECKS },
      };
      pushUndoAndSetEntries([newEntry], newEntry.id, `Added ${ql.label}`);
      return;
    }

    const targetIndex =
      activeNoteId && noteEntries.some((n) => n.id === activeNoteId)
        ? noteEntries.findIndex((n) => n.id === activeNoteId)
        : noteEntries.length - 1;
    const targetNote = noteEntries[targetIndex];

    if (fieldRegex.test(targetNote.text)) {
      const updatedText = targetNote.text.replace(
        fieldRegex,
        (match) => `${match.split(':')[0]}: ${ql.value}`
      );
      const updatedEntries = noteEntries.map((entry, idx) =>
        idx === targetIndex ? { ...entry, text: updatedText } : entry
      );
      pushUndoAndSetEntries(
        updatedEntries,
        targetNote.id,
        `Filled ${ql.label} in Note #${targetIndex + 1}`
      );
    } else {
      const trimmed = targetNote.text.trimEnd();
      const updatedText = trimmed ? `${trimmed}\n${ql.label}` : ql.label;
      const updatedEntries = noteEntries.map((entry, idx) =>
        idx === targetIndex ? { ...entry, text: updatedText } : entry
      );
      pushUndoAndSetEntries(
        updatedEntries,
        targetNote.id,
        `Appended ${ql.label} to Note #${targetIndex + 1}`
      );
    }
  };

  // Append custom snippet or timestamp into the active/latest note
  const appendLineToActiveNote = (lineText: string, label: string) => {
    if (noteEntries.length === 0) {
      const baseText = buildTemplateText(selectedTemplate, '');
      const withLine = baseText ? `${baseText}\n${lineText}` : lineText;
      const newEntry: NoteEntry = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        templateType: selectedTemplate,
        text: withLine,
        checks: { ...DEFAULT_CHECKS },
      };
      pushUndoAndSetEntries([newEntry], newEntry.id, `Added ${label}`);
      return;
    }

    const targetIndex =
      activeNoteId && noteEntries.some((n) => n.id === activeNoteId)
        ? noteEntries.findIndex((n) => n.id === activeNoteId)
        : noteEntries.length - 1;
    const targetNote = noteEntries[targetIndex];
    const trimmed = targetNote.text.trimEnd();
    const updatedText = trimmed ? `${trimmed}\n${lineText}` : lineText;
    const updatedEntries = noteEntries.map((entry, idx) =>
      idx === targetIndex ? { ...entry, text: updatedText } : entry
    );
    pushUndoAndSetEntries(updatedEntries, targetNote.id, `Added ${label}`);
  };

  // Toggle one of the 4 checklists on a specific note block
  const handleToggleNoteChecklist = (
    noteId: string,
    checkItem: ChecklistKey
  ) => {
    setNoteEntries((prev) =>
      prev.map((entry) =>
        entry.id === noteId
          ? {
              ...entry,
              checks: {
                ...entry.checks,
                [checkItem]: !entry.checks[checkItem],
              },
            }
          : entry
      )
    );
  };

  // Update text of a specific note block when edited manually
  const handleNoteTextChange = (noteId: string, newText: string) => {
    setNoteEntries((prev) =>
      prev.map((entry) =>
        entry.id === noteId ? { ...entry, text: newText } : entry
      )
    );
  };

  // Delete a single note block (only when the user explicitly clicks its delete icon)
  const handleDeleteSingleNote = (noteId: string) => {
    pushUndoAndSetEntries(
      noteEntries.filter((n) => n.id !== noteId),
      undefined,
      'Deleted note block'
    );
  };

  // Strip any accidental checklist text just in case, ensuring checklists are NEVER copied
  const sanitizeForCopy = (rawText: string): string => {
    const checklistRegex =
      /^\s*(?:(?:\[[ xX✓✔]\]|[✓✔☑☐○•*-])\s*)?(?:REFUND FORM DONE|REQ FORM DONE|TRACKING FORM DONE|NOTES DONE)\s*$/i;
    const dividerRegex = /^\s*\*{10,}\s*$/;
    return rawText
      .split('\n')
      .filter((line) => !checklistRegex.test(line) && !dividerRegex.test(line))
      .join('\n')
      .trim();
  };

  // Copy ALL notes (checklists completely excluded)
  const handleCopyAllNotes = async () => {
    const combinedClean = noteEntries
      .map((entry) => sanitizeForCopy(entry.text))
      .filter(Boolean)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(combinedClean);
      triggerToast('Copied all notes (checklists excluded)');
    } catch {
      const tempTa = document.createElement('textarea');
      tempTa.value = combinedClean;
      tempTa.style.position = 'fixed';
      tempTa.style.opacity = '0';
      document.body.appendChild(tempTa);
      tempTa.select();
      document.execCommand('copy');
      document.body.removeChild(tempTa);
      triggerToast('Copied all notes (checklists excluded)');
    }
  };

  // Copy a single note block (checklists excluded)
  const handleCopySingleNote = async (entry: NoteEntry, index: number) => {
    const clean = sanitizeForCopy(entry.text);
    try {
      await navigator.clipboard.writeText(clean);
      triggerToast(`Copied Note #${index + 1} (checklists excluded)`);
    } catch {
      // ignore
    }
  };

  // Stats across all notes
  const stats = useMemo(() => {
    const allText = noteEntries
      .map((n) => sanitizeForCopy(n.text))
      .join('\n');
    const chars = allText.length;
    const trimmed = allText.trim();
    const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
    return { chars, words, count: noteEntries.length };
  }, [noteEntries]);

  const handleInsertTimestamp = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampLine = `Date: ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    appendLineToActiveNote(timestampLine, 'Timestamp');
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previous = undoStack[undoStack.length - 1];
      setUndoStack((prev) => prev.slice(0, -1));
      setNoteEntries(previous);
      triggerToast('Undid last action');
    }
  };

  const handleConfirmClear = () => {
    setUndoStack((prev) => [...prev.slice(-49), noteEntries]);
    setNoteEntries([]);
    setActiveNoteId(null);
    setShowClearConfirm(false);
    triggerToast('All notes cleared');
  };

  const handleAddSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    const text = snippetInput.trim();
    if (!text || customSnippets.length >= 5) return;
    const label =
      snippetLabelInput.trim() ||
      (text.length > 20 ? `${text.slice(0, 20)}...` : text);
    setCustomSnippets((prev) => [
      ...prev,
      { id: `snip-${Date.now()}`, label, text },
    ]);
    setSnippetInput('');
    setSnippetLabelInput('');
    setShowSnippetForm(false);
    triggerToast('Saved custom snippet');
  };

  const handleDeleteSnippet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomSnippets((prev) => prev.filter((s) => s.id !== id));
    triggerToast('Removed custom snippet');
  };

  const visibleScenarioGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let groups = SCENARIO_GROUPS;
    if (activeTab !== 'all' && !q) {
      groups = SCENARIO_GROUPS.filter((g) => g.id === activeTab);
    }
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.shortLabel.toLowerCase().includes(q) ||
            (item.output && item.output.toLowerCase().includes(q))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeTab, searchQuery]);

  const isVertical = layoutMode === 'vertical';

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-200/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex justify-start select-none">
      {/* =====================================================================
          RESIZABLE APPLICATION SHELL
          ===================================================================== */}
      <div
        style={
          isVertical
            ? { width: `${containerWidth}px`, maxWidth: '100vw' }
            : { width: '100%' }
        }
        className="relative h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 shadow-xl"
      >
        {/* TOP COMPACT HEADER: Brand + PWA Install + Width/Layout Controls + Theme */}
        <header className="shrink-0 px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-bold tracking-tight truncate">
              Call Center Notepad Pro
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* In-App PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={install}
                title="Install Call Center Notepad Pro as a desktop/mobile app"
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-2.5 h-2.5" />
                <span>Install App</span>
              </button>
            )}
            {!isInstalled && !isInstallable && isIOS && (
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <span>Install iOS</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setLayoutMode('vertical');
                setContainerWidth(360);
                if (isNativeDesktop && window.electronAPI?.setWindowWidth) {
                  window.electronAPI.setWindowWidth(360);
                }
              }}
              title="Slim Column (360px)"
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                isVertical && containerWidth <= 380
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Slim
            </button>
            <button
              type="button"
              onClick={() => {
                setLayoutMode('vertical');
                setContainerWidth(480);
                if (isNativeDesktop && window.electronAPI?.setWindowWidth) {
                  window.electronAPI.setWindowWidth(480);
                }
              }}
              title="Medium Column (480px)"
              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                isVertical && containerWidth > 380
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Med
            </button>
            <button
              type="button"
              onClick={() =>
                setLayoutMode((prev) => (prev === 'vertical' ? 'split' : 'vertical'))
              }
              title="Toggle Split or Vertical mode"
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                !isVertical
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isVertical ? (
                <>
                  <Columns className="w-2.5 h-2.5" />
                  <span>Split</span>
                </>
              ) : (
                <>
                  <Rows className="w-2.5 h-2.5" />
                  <span>Vert</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label="Toggle light or dark mode"
              className="p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-3 h-3 text-amber-400" />
              ) : (
                <Moon className="w-3 h-3 text-slate-700" />
              )}
            </button>
          </div>
        </header>

        {/* AGENT NAME + SMALL COLOR-CODED NOTATION TYPE BUTTONS */}
        <div className="shrink-0 px-2.5 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="agent-name-input"
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0"
            >
              Agent:
            </label>
            <input
              id="agent-name-input"
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Enter agent name..."
              className="flex-1 min-w-0 px-2 py-0.5 text-xs font-medium rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Small Color-Coded Notation Type Buttons (Type 1 – Type 4 + Free Note)
              Each click generates a new separate note block below with its 4 checklists! */}
          <div className="grid grid-cols-5 gap-1">
            {([1, 2, 3, 4, 'free'] as const).map((tNum) => {
              const meta = TEMPLATE_META[tNum];
              const isSelected = selectedTemplate === tNum;
              return (
                <button
                  key={tNum}
                  type="button"
                  onClick={() => handleGenerateNotationType(tNum)}
                  title={
                    tNum === 'free'
                      ? 'Generate a clean empty Free Note block below with its 4 checklists'
                      : `Generate a new Type ${tNum} note block below with its 4 checklists (never deletes existing notes)`
                  }
                  className={`py-1 px-1 rounded border text-[10.5px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer whitespace-nowrap ${
                    meta.btnStyle
                  } ${isSelected ? meta.activeRing : 'opacity-90 hover:opacity-100'}`}
                >
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===================================================================
            MAIN WORKSPACE AREA (Vertical Stack or Side-by-Side Split)
            =================================================================== */}
        <div
          className={`flex-1 flex min-h-0 ${
            isVertical ? 'flex-col' : 'flex-row'
          }`}
        >
          {/* -----------------------------------------------------------------
              COMPACT, COLOR-CODED SCENARIO & QUICK-LINE PANE
              ----------------------------------------------------------------- */}
          <div
            style={
              isVertical
                ? { height: `${topPaneHeight}px` }
                : { width: `${sidebarWidth}px` }
            }
            className="shrink-0 flex flex-col min-h-0 bg-slate-50/80 dark:bg-slate-900/70 border-b lg:border-b-0 border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Row 1: Small Color-Coded Quick Lines */}
            <div className="shrink-0 px-2 py-1 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-1">
              {QUICK_LINES.map((ql) => (
                <button
                  key={ql.label}
                  type="button"
                  onClick={() => handleQuickLineClick(ql)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border text-center truncate transition-colors cursor-pointer ${ql.colorClass}`}
                >
                  {ql.label}
                </button>
              ))}
            </div>

            {/* Row 2: Compact Category Filter Pills + Search */}
            <div className="shrink-0 px-2 py-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('refunds-returns')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer whitespace-nowrap ${
                  activeTab === 'refunds-returns'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-700 dark:text-rose-300 hover:bg-rose-500/15'
                }`}
              >
                Refunds
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('order-issues')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer whitespace-nowrap ${
                  activeTab === 'order-issues'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-700 dark:text-amber-300 hover:bg-amber-500/15'
                }`}
              >
                Orders
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sales-transfers')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer whitespace-nowrap ${
                  activeTab === 'sales-transfers'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15'
                }`}
              >
                Sales
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('onboarding-support')}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer whitespace-nowrap ${
                  activeTab === 'onboarding-support'
                    ? 'bg-cyan-600 text-white'
                    : 'text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/15'
                }`}
              >
                Support
              </button>

              <div className="relative flex-1 min-w-[65px] ml-auto">
                <Search className="w-2.5 h-2.5 text-slate-400 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find..."
                  className="w-full pl-5 pr-4 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Small Color-Coded Scenario Buttons Grid */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
              <div className="grid grid-cols-2 gap-1">
                {visibleScenarioGroups.flatMap((group) =>
                  group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleScenarioClick(item)}
                      title={item.output ?? 'Transfer to Sales (Type 4)'}
                      className={`px-2 py-1 text-[11px] font-semibold text-left rounded border transition-colors cursor-pointer truncate ${group.colorClass}`}
                    >
                      {item.shortLabel}
                    </button>
                  ))
                )}
              </div>

              {/* Compact Custom Snippets Row */}
              <div className="pt-1 border-t border-slate-200/70 dark:border-slate-800/70 flex flex-wrap items-center gap-1">
                {customSnippets.map((snip) => (
                  <div
                    key={snip.id}
                    onClick={() => appendLineToActiveNote(snip.text, snip.label)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        appendLineToActiveNote(snip.text, snip.label);
                      }
                    }}
                    title={snip.text}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border border-violet-400/40 bg-violet-500/15 text-violet-900 dark:text-violet-200 hover:bg-violet-500/25 cursor-pointer"
                  >
                    <span className="truncate max-w-[110px]">{snip.label}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSnippet(snip.id, e)}
                      className="opacity-70 hover:opacity-100 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}

                {customSnippets.length < 5 && !showSnippetForm && (
                  <button
                    type="button"
                    onClick={() => setShowSnippetForm(true)}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Snippet ({customSnippets.length}/5)</span>
                  </button>
                )}
              </div>

              {showSnippetForm && customSnippets.length < 5 && (
                <form
                  onSubmit={handleAddSnippet}
                  className="p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center gap-1"
                >
                  <input
                    type="text"
                    value={snippetLabelInput}
                    onChange={(e) => setSnippetLabelInput(e.target.value)}
                    placeholder="Label"
                    className="w-20 px-1.5 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={snippetInput}
                    onChange={(e) => setSnippetInput(e.target.value)}
                    placeholder="Snippet text..."
                    className="flex-1 min-w-0 px-1.5 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={!snippetInput.trim()}
                    className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-600 text-white disabled:opacity-40 cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSnippetForm(false)}
                    className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* DRAGGABLE SPLITTER BETWEEN BUTTONS & NOTEPAD */}
          {isVertical ? (
            <div
              onMouseDown={startTopPaneHeightDrag}
              title="Drag up or down to resize buttons area"
              className="shrink-0 h-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500/50 cursor-row-resize flex items-center justify-center transition-colors"
            >
              <GripHorizontal className="w-3 h-3 text-slate-400" />
            </div>
          ) : (
            <div
              onMouseDown={startSidebarWidthDrag}
              title="Drag left or right to resize sidebar"
              className="shrink-0 w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500/50 cursor-col-resize flex items-center justify-center transition-colors"
            >
              <GripVertical className="w-3 h-3 text-slate-400" />
            </div>
          )}

          {/* -----------------------------------------------------------------
              NOTES WORKSPACE AREA
              Every generated note block appears here with its own 4 clickable
              checklists directly below it (which are NEVER copied).
              ----------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white dark:bg-slate-950">
            {/* Compact Notepad Action Bar */}
            <div className="shrink-0 px-2.5 py-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyAllNotes}
                  disabled={noteEntries.length === 0}
                  title="Copies all generated notes to clipboard (checklists are never copied)"
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Notes</span>
                </button>

                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoStack.length === 0}
                  title="Undo last action"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Undo</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertTimestamp}
                  title="Insert current timestamp into active note"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Clock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                  <span>Time</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAutoUppercaseHeaders((prev) => !prev)}
                  title="Toggle auto-uppercase headers"
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium rounded border cursor-pointer ${
                    autoUppercaseHeaders
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <CaseUpper className="w-3 h-3" />
                  <span>CAPS</span>
                </button>

                {!showClearConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    disabled={noteEntries.length === 0}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium rounded border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 disabled:opacity-40 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Clear</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/70 border border-red-300 dark:border-red-800 rounded px-1.5 py-0.5">
                    <button
                      type="button"
                      onClick={handleConfirmClear}
                      className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-600 text-white cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-1 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {stats.count} {stats.count === 1 ? 'note' : 'notes'} ·{' '}
                {stats.words}w · {stats.chars}c
              </span>
            </div>

            {/* Scrollable Stack of Generated Notes + Per-Note Uncopyable Checklists */}
            <div
              ref={notesScrollContainerRef}
              className="flex-1 overflow-y-auto p-2.5 space-y-3 bg-slate-50/50 dark:bg-slate-950"
            >
              {noteEntries.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No Notes Generated Yet
                  </p>
                  <p className="text-[11px] max-w-xs leading-relaxed">
                    Enter your Agent Name above and press{' '}
                    <strong>Type 1</strong>, <strong>Type 2</strong>,{' '}
                    <strong>Type 3</strong>, or <strong>Type 4</strong> (or any
                    scenario button) to generate a note block together with its
                    4 checklists below.
                  </p>
                </div>
              ) : (
                noteEntries.map((entry, idx) => {
                  const isFocused =
                    activeNoteId === entry.id ||
                    (!activeNoteId && idx === noteEntries.length - 1);
                  const lineCount = Math.max(
                    6,
                    entry.text.split('\n').length
                  );

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setActiveNoteId(entry.id)}
                      className={`rounded-md border transition-colors overflow-hidden bg-white dark:bg-slate-900 ${
                        isFocused
                          ? 'border-blue-500 dark:border-blue-500 ring-1 ring-blue-500/30'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* Note Block Header Bar (Non-copyable metadata + Per-note Copy/Delete) */}
                      <div className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] select-none">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Note #{idx + 1} ·{' '}
                          {entry.templateType === 'free'
                            ? 'Free Note'
                            : `Type ${entry.templateType}`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySingleNote(entry, idx);
                            }}
                            title="Copy this note only (checklists excluded)"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSingleNote(entry.id);
                            }}
                            title="Delete this note block"
                            className="p-0.5 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Editable Monospace Note Textarea */}
                      <textarea
                        value={entry.text}
                        rows={lineCount}
                        placeholder={
                          entry.templateType === 'free'
                            ? 'Write your note here...'
                            : undefined
                        }
                        onFocus={() => setActiveNoteId(entry.id)}
                        onChange={(e) =>
                          handleNoteTextChange(entry.id, e.target.value)
                        }
                        spellCheck={true}
                        aria-label={`Call note ${idx + 1}`}
                        className="w-full resize-y border-0 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-[12.5px] leading-[1.55] p-2.5 focus:outline-none selection:bg-blue-600 selection:text-white select-text block"
                      />

                      {/* =======================================================
                          4 CLICKABLE-ONLY CHECKLISTS BELOW EVERY GENERATED NOTE
                          (select-none = NEVER copyable when copying notes!)
                          ======================================================= */}
                      <div
                        className="px-2.5 py-1.5 bg-slate-100/90 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 select-none"
                        onCopy={(e) => e.preventDefault()}
                      >
                        <div className="grid grid-cols-2 gap-1">
                          {CHECKLIST_ITEMS.map((checkItem) => {
                            const isChecked = entry.checks[checkItem];
                            return (
                              <button
                                key={checkItem}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleNoteChecklist(
                                    entry.id,
                                    checkItem
                                  );
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono font-bold transition-colors cursor-pointer select-none ${
                                  isChecked
                                    ? 'border-emerald-600 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-blue-500'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                                <span className="truncate">{checkItem}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Notepad Status Bar */}
            <footer className="shrink-0 px-2.5 py-0.5 border-t border-slate-200 dark:border-slate-800 bg-slate-200/60 dark:bg-slate-950 text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>
                {noteEntries.length} generated · Checklists excluded on copy
              </span>
              <span>PWA Ready · Drag edge to resize</span>
            </footer>
          </div>
        </div>

        {/* DRAGGABLE RIGHT-EDGE WIDTH HANDLE */}
        {isVertical && (
          <div
            onMouseDown={startContainerWidthDrag}
            title="Drag left or right to resize tool width"
            className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-blue-500/40 flex items-center justify-center group z-30"
          >
            <div className="w-0.5 h-10 bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 rounded-full" />
          </div>
        )}

        {/* iOS PWA Installation Guide Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Install on iPhone / iPad
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                1. Tap the <strong>Share</strong> button in Safari.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-3 w-full rounded bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Offline Connectivity Indicator */}
        {!isOnline && (
          <div className="fixed bottom-10 right-3 z-50 flex items-center gap-1.5 rounded bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
            <WifiOff className="w-3 h-3" />
            <span>Offline Mode — Notes saved locally</span>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            className="fixed bottom-10 left-3 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 dark:bg-blue-600 text-white text-[11px] font-semibold shadow-lg pointer-events-none"
          >
            <Check className="w-3 h-3" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

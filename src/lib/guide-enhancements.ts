export type GuideFaq = { q: string; a: string };

export type GuideEnhancement = {
  quickAnswer: string;
  faqs: GuideFaq[];
};

export const guideEnhancements: Record<string, GuideEnhancement> = {
  "must-have-mac-apps-2026": {
    quickAnswer:
      "For 2026, the essential Mac utility stack starts with Better Shot for screenshots & OCR, ClearBar for cleaning the menu bar, Tucket for on-device notch clipboard history, Voicera for offline voice dictation, and ScanMyDisk for visual disk analysis.",
    faqs: [
      {
        q: "What are the absolute must-have Mac apps to install first?",
        a: "We recommend starting with a lightweight clipboard manager (Tucket or Clippio), a fast screenshot utility (Better Shot or Shottr), and a menu bar organizer (ClearBar or Lounge). These three solve immediate macOS friction points.",
      },
      {
        q: "Are these Mac utilities optimized for Apple Silicon (M1/M2/M3/M4)?",
        a: "Yes. Every utility selected in this guide runs natively on Apple Silicon with minimal RAM and CPU idle overhead, preserving all-day battery life.",
      },
      {
        q: "Do any of these essential utilities require expensive subscriptions?",
        a: "No. Our recommendations prioritize free software, generous free tiers, and transparent one-time purchases over recurring monthly subscriptions.",
      },
    ],
  },
  "best-free-mac-apps": {
    quickAnswer:
      "The best completely free or free-tier Mac apps in 2026 are Better Shot (scrolling capture & OCR), Mole (deep app uninstaller and cache cleaner), Voicera (free weekly voice transcription), and Anytype (local-first encrypted knowledge base).",
    faqs: [
      {
        q: "Are these free Mac apps safe to install?",
        a: "Yes. Each app is verified to respect macOS Gatekeeper security, requests only necessary system permissions, and contains zero adware or unwanted telemetry.",
      },
      {
        q: "What is the catch with freemium Mac tools?",
        a: "The tools listed here provide genuinely useful free tiers with no forced trials or artificial export limits on essential daily features.",
      },
      {
        q: "Can I replace CleanMyMac with free alternatives?",
        a: "Yes. Combining Mole for app uninstallation with native macOS Storage Management provides effective disk maintenance without a costly yearly license.",
      },
    ],
  },
  "best-clipboard-manager-mac": {
    quickAnswer:
      "Tucket is the top pick for MacBook users wanting notch-integrated clipboard access with on-device encryption. Clippio is ideal for keyboard-driven power search, while Maclip offers a clean, lightweight history shelf.",
    faqs: [
      {
        q: "Which Mac clipboard manager is most secure for passwords?",
        a: "Tucket, Clippio, and Maclip all store clipboard history encrypted locally on-device. They ignore entries copied from password managers like 1Password and Bitwarden.",
      },
      {
        q: "Does Tucket work on Macs without a notch?",
        a: "Yes. On external displays or Mac mini / Mac Studio setups, Tucket smoothly anchors to the top center of the screen as a sleek drop-down drawer.",
      },
      {
        q: "Why avoid cloud-synced clipboard managers?",
        a: "Cloud clipboard sync risks exposing sensitive API keys, private messages, and credentials to remote servers. On-device managers eliminate remote leak vectors completely.",
      },
    ],
  },
  "best-notes-app-mac": {
    quickAnswer:
      "Choose Anytype if you need an offline-first, relational knowledge graph with databases and block-based pages. Choose iA Writer if you want distraction-free plain text prose with Markdown and syntax highlighting.",
    faqs: [
      {
        q: "Is Anytype completely private and offline?",
        a: "Yes. Anytype is built on an open-source, local-first architecture with peer-to-peer end-to-end encryption. Your notes remain on your Mac even without internet.",
      },
      {
        q: "Why do writers prefer iA Writer over Obsidian or Notion?",
        a: "iA Writer strips away sidebar distractions and complex configuration, offering typographic focus, syntax highlighting for parts of speech, and pure plain-text portability.",
      },
      {
        q: "Can I migrate notes easily between these apps?",
        a: "Both Anytype and iA Writer support standardized Markdown export and import, preventing proprietary database lock-in.",
      },
    ],
  },
  "best-mac-disk-space-analyzer": {
    quickAnswer:
      "ScanMyDisk is our Editor's Choice for interactive sunburst visualization and rapid large-file triage. For free uninstallation and leftover removal, Mole is our top recommendation.",
    faqs: [
      {
        q: "What is the difference between a disk analyzer and an app cleaner?",
        a: "A disk analyzer maps large folders, hidden caches, and disk hogs across your entire drive. An app cleaner specifically tracks down leftover preference files and application support folders when removing software.",
      },
      {
        q: "Does ScanMyDisk delete files without confirmation?",
        a: "No. ScanMyDisk uses safe trash staging and requires explicit user review before any file or directory is moved to macOS Trash.",
      },
      {
        q: "Why does macOS System Data take up so much space?",
        a: "System Data typically consists of Xcode caches, Docker VM images, browser caches, and orphaned application support data. A visual disk analyzer quickly pinpoints these hidden directories.",
      },
    ],
  },
  "best-bartender-alternative-mac": {
    quickAnswer:
      "ClearBar is the premier Bartender alternative for hiding and revealing menu bar icons on macOS Sonoma and Sequoia without system extensions. Lounge is the top pick for tucking icons behind the MacBook notch.",
    faqs: [
      {
        q: "Why are Mac users switching away from Bartender?",
        a: "Following an unannounced ownership change in 2024, many Mac power users sought lightweight, transparent alternatives with no background auto-updates or telemetry.",
      },
      {
        q: "Does ClearBar require Accessibility or Screen Recording permissions?",
        a: "ClearBar only requires standard Accessibility permissions to position menu bar items, with no invasive Screen Recording access needed.",
      },
      {
        q: "Can Lounge hide icons on external monitors?",
        a: "Yes. Lounge supports multi-monitor configurations and adapts its overflow panel whether a notch is present or absent.",
      },
    ],
  },
  "best-notch-apps-mac": {
    quickAnswer:
      "Alcove transforms the MacBook notch into an interactive Dynamic Island for media, timers, and notifications. Droppy adds a handy drag-and-drop file shelf, while Tucket hides a clipboard drawer right inside the cutout.",
    faqs: [
      {
        q: "Do notch apps slow down macOS animations or drain battery?",
        a: "The notch utilities featured on PickMacApps are native Swift apps built with AppKit and SwiftUI. They idle at near-zero CPU and activate only on hover or active events.",
      },
      {
        q: "What happens to notch apps when I plug into an external display?",
        a: "Apps like Alcove and Droppy automatically adapt by attaching to the top menu bar or displaying a floating pill on non-notch monitors.",
      },
      {
        q: "Which notch app is best for drag-and-drop file management?",
        a: "Droppy is purpose-built as a temporary file shelf: drag files to the top of your screen to hold them, then switch spaces or full-screen apps and drop them with ease.",
      },
    ],
  },
  "best-appcleaner-alternative-mac": {
    quickAnswer:
      "Mole is the best free, modern alternative to AppCleaner, providing instant leftover detection and cache cleanup. If your goal is reclaiming bulk storage, pair it with ScanMyDisk.",
    faqs: [
      {
        q: "Why is AppCleaner still so popular on Mac?",
        a: "AppCleaner is a classic, lightweight drag-and-drop tool that finds files in ~/Library/Application Support. Modern alternatives like Mole expand on this with faster scanning and batch cleanup.",
      },
      {
        q: "Is it safe to delete leftover application support files?",
        a: "Yes, once an application has been uninstalled, its preferences (.plist) and caches in Library can be safely trashed to free space.",
      },
      {
        q: "Can Mole remove system files by accident?",
        a: "No. Mole protects macOS system directories and SIP-protected locations, limiting removal strictly to user-level application residues.",
      },
    ],
  },
  "best-notchnook-alternative-mac": {
    quickAnswer:
      "Alcove is the superior NotchNook alternative for media controls and notifications, while Droppy excels as a dedicated notch drag-and-drop file temporary shelf.",
    faqs: [
      {
        q: "Why seek an alternative to NotchNook?",
        a: "Users often look for lighter, single-purpose alternatives that focus specifically on either media playback widgets or quick file staging without heavy background memory usage.",
      },
      {
        q: "Does Alcove support Spotify and Apple Music?",
        a: "Yes, Alcove integrates seamlessly with Apple Music, Spotify, and system Now Playing session controls.",
      },
    ],
  },
  "best-paste-alternative-mac": {
    quickAnswer:
      "Clippio and Tucket provide top-tier alternatives to Paste without recurring monthly or yearly subscription fees.",
    faqs: [
      {
        q: "Can I get a visual clipboard history without paying a subscription?",
        a: "Yes. Both Clippio and Tucket offer rich visual clipboard cards, quick search, and snippet pinning under transparent one-time purchase models.",
      },
    ],
  },
  "best-screen-studio-alternative-mac": {
    quickAnswer:
      "For cinematic screen recordings with smooth automated cursor zooming and motion blur, Screen Charm and CleanShot X provide compelling alternatives to Screen Studio.",
    faqs: [
      {
        q: "Do Screen Studio alternatives support 4K 60fps export?",
        a: "Yes, modern Mac screen capture utilities leverage Apple Silicon hardware encoding for crisp 4K recording with zero frame drops.",
      },
    ],
  },
  "best-cleanshot-x-alternative-mac": {
    quickAnswer:
      "Better Shot and Shottr are the top alternatives to CleanShot X, offering scrolling capture, OCR text extraction, and privacy blur tools.",
    faqs: [
      {
        q: "Can Better Shot capture scrolling web pages?",
        a: "Yes. Better Shot includes automated vertical scrolling capture for long documents, web pages, and chat threads.",
      },
    ],
  },
  "best-wispr-flow-alternative-mac": {
    quickAnswer:
      "Voicera and HoldSpeak provide lightning-fast speech-to-text dictation on macOS with privacy-first on-device speech models.",
    faqs: [
      {
        q: "Does voice dictation work offline on Mac?",
        a: "Yes. Voicera utilizes Apple Silicon neural engine Whisper models to transcribe speech directly on your Mac without sending audio to the cloud.",
      },
    ],
  },
  "best-logseq-alternative-notes": {
    quickAnswer:
      "Anytype is the leading local-first, privacy-focused alternative to Logseq, pairing outliner capabilities with relational databases and end-to-end sync.",
    faqs: [
      {
        q: "How does Anytype handle bi-directional linking?",
        a: "Anytype creates a visual graph view and supports backlink relations across pages, objects, and tasks.",
      },
    ],
  },
  "best-ulysses-alternative-writing": {
    quickAnswer:
      "iA Writer is the gold standard alternative to Ulysses for long-form writers who demand clean plain text Markdown files and zero subscription lock-in.",
    faqs: [
      {
        q: "Can iA Writer organize chapters for a full book?",
        a: "Yes. iA Writer supports content blocks and folder navigation so you can assemble chapters seamlessly into a manuscript.",
      },
    ],
  },
};

export function getGuideEnhancement(slug: string, fallbackExcerpt: string): GuideEnhancement {
  if (guideEnhancements[slug]) return guideEnhancements[slug];
  return {
    quickAnswer: fallbackExcerpt,
    faqs: [
      {
        q: `What is the best recommendation in this guide?`,
        a: fallbackExcerpt,
      },
      {
        q: `Are the tools in this guide tested on macOS?`,
        a: "Yes. Every utility reviewed on PickMacApps is evaluated on physical Mac hardware for performance, battery life, and privacy.",
      },
    ],
  };
}

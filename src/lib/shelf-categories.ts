export type CategoryFaq = {
  q: string;
  a: string;
};

export type ShelfCategory = {
  slug: string;
  name: string;
  emoji: string;
  paragraphs: string[];
  tips: string[];
  faqs: CategoryFaq[];
};

export const shelfCategories: ShelfCategory[] = [
  {
    slug: "productivity",
    name: "Productivity",
    emoji: "⚡",
    paragraphs: [
      "Discover the best Mac productivity apps in 2026 hand-picked for macOS Sequoia and Apple Silicon. From notch-aware clipboard managers and menu bar organizers to distraction-free window managers, these utilities streamline daily desktop workflows without battery drain or unnecessary system overhead.",
      "Rather than bloated all-in-one suites, modern Mac productivity favors lightweight, single-purpose utilities built in native Swift. Browse vetted tools offering one-time licenses, transparent offline local storage, and instant keyboard shortcuts that let you get things done faster.",
    ],
    tips: [
      "Native Swift vs Electron: Native Mac apps consume significantly less RAM and idle CPU, keeping your MacBook cool and responsive.",
      "System Resource Footprint: Prioritize background utilities that use fewer than 50MB RAM and draw zero continuous background CPU cycles.",
      "Privacy & Data Locality: Look for tools that process your clipboard, windows, and document history 100% on-device without cloud sync requirements.",
      "Pricing Transparency: Favor upfront one-time licenses or generous perpetual fallback options over aggressive recurring monthly subscriptions.",
    ],
    faqs: [
      {
        q: "What are the best Mac productivity apps to install first in 2026?",
        a: "Start with an essential clipboard manager (like Tucket or Maclip) to never lose copied text, a menu bar declutterer (like ClearBar or Lounge) to reclaim top-bar space, and a fast screenshot utility like Shottr or Better Shot.",
      },
      {
        q: "Do background productivity apps slow down my Mac?",
        a: "Lightweight, native macOS utilities built with Swift and AppKit run with virtually zero measurable impact on system speed or battery life. Avoid running dozens of Electron-based background daemons simultaneously.",
      },
      {
        q: "Are free Mac productivity utilities safe?",
        a: "Yes, provided they are notarized by Apple Gatekeeper or open-source. On PickMacApps, every free app undergoes manual review to ensure it contains no adware, tracking telemetry, or deceptive upsells.",
      },
      {
        q: "Should I buy one-time Mac apps or pay monthly subscriptions?",
        a: "Whenever possible, choose one-time purchase or freemium apps for utilities. Recurring subscriptions rarely make sense for static desktop tools like clipboard managers, calculators, or menu bar hiders.",
      },
    ],
  },
  {
    slug: "utility",
    name: "Utility",
    emoji: "🔧",
    paragraphs: [
      "Mac utility apps bridge the missing gaps in macOS, giving you finer control over disk space, battery health, notch widgets, and background process management. Whether you need to reclaim tens of gigabytes of hidden caches or customize the MacBook camera cutout, these utilities deliver precision control.",
      "Every tool in this directory has been vetted for macOS Sequoia compatibility and Apple Silicon architecture. We highlight transparent disk analyzers, menu bar cleaners, and notch companions that do one job exceptionally well without cluttering your system.",
    ],
    tips: [
      "Non-Destructive Cleaning: Ensure disk analyzers visualize storage and let you choose what to delete rather than running automated black-box cleanup scripts.",
      "Notch & Menu Bar Adaptability: Look for utilities that gracefully handle both notched MacBook displays and traditional external 4K/5K monitors.",
      "Apple Silicon Optimization: Confirm universal or native arm64 binary support for maximum power efficiency and instant launch times.",
      "System Permissions: Pay attention to apps requiring Full Disk Access or Accessibility permissions — ensure the developer provides transparent privacy disclosures.",
    ],
    faqs: [
      {
        q: "What is the best Mac disk space analyzer in 2026?",
        a: "Visual analyzers like Mole and ByteSweep allow you to spot bloated folders, lingering application caches, and unused iOS backups quickly, giving you complete manual control over what gets deleted.",
      },
      {
        q: "Do I need a Mac cleaner app?",
        a: "Modern macOS manages memory well, but applications still leave behind gigabytes of cached assets, logs, and leftover Application Support files. A focused disk utility helps you reclaim space safely without dangerous system modifications.",
      },
      {
        q: "Can Mac utility apps use the MacBook notch?",
        a: "Yes. Innovative notch apps like NotchDodo, Alcove, and Droppy turn the camera notch cutout into an interactive shelf for media controls, file staging, and quick timers.",
      },
      {
        q: "Are Mac utilities safe to grant Accessibility permissions?",
        a: "Accessibility permissions allow utilities to manage windows, intercept global hotkeys, or paste text into active windows. Only grant this permission to notarized apps from verified developers.",
      },
    ],
  },
  {
    slug: "video",
    name: "Video",
    emoji: "🎬",
    paragraphs: [
      "Explore top-rated Mac video recording and screen capture tools engineered for modern product demos, developer walkthroughs, and content creation. These utilities eliminate tedious timeline editing by automating click zooms, dynamic backgrounds, and smooth cursor physics.",
      "From instant recording tools that skip video editing entirely to AI-powered studio recorders, find the right video software to showcase software, record tutorials, and share clear visual explanations with your team.",
    ],
    tips: [
      "Automated Smooth Zooming: Look for recorders that intelligently follow mouse movements and zoom into active clicks automatically.",
      "Native Apple Silicon Encoding: Ensure the screen recorder leverages Apple Silicon's Media Engine for hardware-accelerated ProRes and H.264/HEVC exports.",
      "Local Processing: Screen recorders should store recordings locally on your SSD without mandatory cloud rendering queues.",
      "One-time Licensing: Check whether the app charges once or requires a recurring monthly subscription for 4K export capabilities.",
    ],
    faqs: [
      {
        q: "What is the best alternative to Screen Studio for Mac?",
        a: "Screen Charm and ScreenToast provide automated click-zooming and high-resolution exports with one-time purchase options, while Boom and Better Shot provide instant zero-timeline recording workflows.",
      },
      {
        q: "Can I record 4K 60fps screen video without lag on a MacBook?",
        a: "Yes, modern Apple Silicon Macs (M1 through M4) include dedicated hardware media engines that record 4K 60fps video with virtually zero CPU frame drops.",
      },
      {
        q: "Do these Mac screen recorders support audio transcription?",
        a: "Several advanced demo tools (such as ScreenToast) include drafted narration and automated voice synchronization, or integrate seamlessly with local whisper dictation apps.",
      },
      {
        q: "Is a free Mac screen recorder sufficient for software demos?",
        a: "For basic captures and tutorials, free utilities like Better Shot or native QuickTime are capable. For commercial product teasers, automated zoom-and-pan recorders deliver significantly higher production value.",
      },
    ],
  },
  {
    slug: "ai",
    name: "AI",
    emoji: "✦",
    paragraphs: [
      "The next generation of Mac AI applications leverages Apple Silicon Neural Engines to deliver private, on-device intelligence without leaking sensitive data to external cloud servers. From local speech-to-text dictation to personal knowledge bases, these tools run directly on your hardware.",
      "Browse hand-curated Mac AI software that respects user privacy, requires zero recurring API tokens, and offers instant system-wide hotkey access anywhere in macOS.",
    ],
    tips: [
      "On-Device vs Cloud Inference: Prioritize apps powered by local CoreML or whisper models for zero latency and complete privacy.",
      "Zero Cloud Telemetry: For voice dictation and confidential notes, ensure the app guarantees that audio or text never leaves your Mac.",
      "Neural Engine Acceleration: Verify that the tool utilizes Apple Silicon's 16-core Neural Engine to preserve MacBook battery life.",
      "BYOK (Bring Your Own Key): For tools that interact with cloud LLMs, check if they let you plug in your own API keys to avoid monthly markups.",
    ],
    faqs: [
      {
        q: "What is the best voice dictation app for Mac in 2026?",
        a: "HoldSpeak and Precis offer fast, on-device speech-to-text powered by local models that type anywhere your cursor is focused, without sending audio to the cloud. MacWhisper is ideal for transcribing recorded audio files.",
      },
      {
        q: "Does running local AI drain MacBook battery?",
        a: "When properly compiled for Apple Silicon CoreML and the Neural Engine, local models run with high energy efficiency. However, large language models (7B+ parameters) will consume more battery during extended continuous generation.",
      },
      {
        q: "Are on-device Mac AI apps truly private?",
        a: "Yes. Apps that run local CoreML or quantized models do not require an active internet connection and can operate in full offline airplane mode with zero outbound network requests.",
      },
      {
        q: "How much unified memory (RAM) is required for Mac AI apps?",
        a: "Lightweight speech recognition and dictation tools run smoothly on 8GB or 16GB Macs. For running local LLMs and image generation models, 16GB to 36GB+ of unified memory is recommended.",
      },
    ],
  },
  {
    slug: "writing",
    name: "Writing",
    emoji: "✍️",
    paragraphs: [
      "Mac writing apps combine typographical precision with distraction-free environments for novelists, technical authors, journalists, and note-takers. These editors prioritize plain-text longevity, local markdown files, and fluid keyboard navigation.",
      "Whether you need an opinionated markdown drafting tool like iA Writer or a networked, local-first database like Anytype, our curated selection focuses on speed, typographic elegance, and zero cloud lock-in.",
    ],
    tips: [
      "Plain-Text Future-Proofing: Store your writing in standard Markdown (.md) or plain text so your words remain readable decades from now in any editor.",
      "Distraction-Free Modes: Look for focus modes, typewriter scrolling, and minimal chrome that keep your eyes centered on the current sentence.",
      "Offline File Storage: Ensure documents are saved in local folders accessible via Finder rather than hidden inside proprietary cloud databases.",
      "One-Time Purchase: Seek out editors sold as perpetual licenses to keep your creative tools independent of ongoing monthly bills.",
    ],
    faqs: [
      {
        q: "What is the best focused markdown editor for Mac?",
        a: "iA Writer remains the benchmark for distraction-free Markdown writing, featuring custom monospace typography, syntax highlighting, and a one-time purchase price on macOS.",
      },
      {
        q: "What is the best alternative to Notion or Obsidian on Mac?",
        a: "Anytype provides a local-first, peer-to-peer encrypted knowledge base that combines Notion's flexible block databases with the offline privacy of local files.",
      },
      {
        q: "Can I sync local markdown files between Mac, iPhone, and iPad?",
        a: "Yes. Storing plain markdown files in iCloud Drive, Git, or folder-syncing tools allows seamless access across all your Apple devices without vendor lock-in.",
      },
      {
        q: "Why do writers prefer one-time purchase Mac software?",
        a: "Writing is a long-term craft. Writers prefer tools they own outright, ensuring their manuscript archive remains accessible regardless of subscription lapses.",
      },
    ],
  },
  {
    slug: "dev",
    name: "Dev",
    emoji: "🛠️",
    paragraphs: [
      "Streamline your software engineering workflow with Mac developer tools crafted for modern web, mobile, and systems programming. From local server orchestration to API testing and terminal enhancement, these tools optimize developer productivity.",
      "Find native macOS developer utilities optimized for zsh, Xcode, Git, and Docker workflows that minimize context-switching and accelerate your development loop.",
    ],
    tips: [
      "CLI & GUI Synergy: Great Mac dev tools offer both a fast visual UI and a command-line interface for scripting and terminal efficiency.",
      "Low CPU Overhead: Developer machines already run heavy Docker containers and builds — your auxiliary dev utilities should stay lean.",
      "Keyboard-First Navigation: Look for comprehensive command palettes and customizable hotkeys to stay in your coding flow.",
      "Security Audits: Ensure tools that handle API keys or database credentials store secrets in the secure macOS Keychain.",
    ],
    faqs: [
      {
        q: "What developer utilities are essential on a new Mac?",
        a: "In addition to Xcode Command Line Tools and Homebrew, developers rely on quick clipboard history, terminal managers, disk space monitors, and local API debugging utilities.",
      },
      {
        q: "Are Mac developer utilities compatible with Apple Silicon?",
        a: "All developer tools featured on PickMacApps run natively on Apple Silicon (M-series chips) with zero Rosetta translation overhead.",
      },
      {
        q: "How do I keep my Mac clean during software development?",
        a: "Use disk utilities like Mole or ByteSweep to clean orphaned Docker build caches, old Xcode derived data, and unused node_modules folders safely.",
      },
      {
        q: "Where should developer tools store sensitive API tokens?",
        a: "Trusted Mac utilities should always store API keys and environment secrets inside the encrypted macOS Keychain rather than plain text configuration files.",
      },
    ],
  },
  {
    slug: "design",
    name: "Design",
    emoji: "🎨",
    paragraphs: [
      "Curated Mac design tools for UI/UX designers, illustrators, and visual creators. From pixel-perfect screenshot measurement to palette generators and vector canvas tools, these utilities enhance your creative precision.",
      "Explore lightweight design companions that integrate into your menu bar or hotkey flow, enabling rapid asset extraction, OCR text grabbing, and design feedback.",
    ],
    tips: [
      "Sub-Pixel & Retina Accuracy: Verify that screenshot and measurement tools support 2x Retina display rendering and sub-pixel measurement.",
      "Instant Annotation: Look for screenshot tools that let you blur sensitive info, draw clean numbered steps, and copy to clipboard instantly.",
      "Built-in OCR: Built-in text recognition in screenshot utilities saves hours of manual transcription from static mockups.",
      "Export Flexibility: Support for SVG, WebP, PNG, and transparent background formats is crucial for web and mobile design.",
    ],
    faqs: [
      {
        q: "What is the best screenshot tool for Mac designers in 2026?",
        a: "Shottr is widely regarded as the fastest designer-oriented screenshot tool on Mac, featuring built-in pixel rulers, color sampling, OCR, and smart redaction. Better Shot is an excellent free alternative with recording.",
      },
      {
        q: "How do I take scrolling screenshots on Mac?",
        a: "Apps like Shottr support 1-click scrolling capture, seamlessly stitching long web pages, code listings, or chat threads into a single crisp image.",
      },
      {
        q: "Can I measure pixels on my Mac screen accurately?",
        a: "Yes, dedicated Mac utilities like Shottr include built-in screen rulers that calculate column widths and padding directly from screenshot previews.",
      },
      {
        q: "Are these design tools optimized for Display P3 wide color?",
        a: "Modern native macOS screenshot and color picker utilities preserve Display P3 color profiles, ensuring accurate reproduction on MacBook Pro Liquid Retina XDR screens.",
      },
    ],
  },
  {
    slug: "audio",
    name: "Audio",
    emoji: "🎧",
    paragraphs: [
      "Mac audio applications for podcasters, musicians, remote professionals, and content creators. Discover high-accuracy audio transcription, soundboard tools, microphone routing, and noise-canceling utilities.",
      "Harness local audio processing that transcribes hours of interviews in minutes using on-device neural models, without uploading your audio files to third-party servers.",
    ],
    tips: [
      "Local Transcription Speed: Whisper-based utilities should transcribe audio 5x to 10x faster than real-time on Apple Silicon.",
      "Microphone Routing: Look for tools that create virtual audio loopback cables with minimal latency.",
      "Format Versatility: Support for MP3, WAV, M4A, AAC, and FLAC imports ensures seamless integration with your existing audio gear.",
      "Offline Confidentiality: Choose audio transcription software that guarantees 100% offline local processing for private conversations.",
    ],
    faqs: [
      {
        q: "What is the fastest way to transcribe audio to text on Mac?",
        a: "MacWhisper utilizes OpenAI's Whisper model running locally on Apple Silicon, transcribing hour-long audio files in just a few minutes with near-perfect punctuation.",
      },
      {
        q: "Is an internet connection required for Mac audio transcription?",
        a: "No. Native on-device tools download model weights once and process all future speech recognition completely offline.",
      },
      {
        q: "Can I transcribe live meetings directly on my Mac?",
        a: "Yes, tools like Voicera and HoldSpeak support live microphone transcription, while MacWhisper can capture system audio with virtual audio drivers.",
      },
      {
        q: "What Whisper model size should I run on my Mac?",
        a: "The 'Base' and 'Small' models offer blazing speed with high accuracy on any Mac. For technical jargon or multi-language audio, the 'Medium' or 'Large' model provides superior precision on 16GB+ Macs.",
      },
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    emoji: "📣",
    paragraphs: [
      "Mac marketing tools to help founders, growth marketers, and social creators launch campaigns, schedule posts, and analyze competitors efficiently.",
      "Find lightweight utilities that assist with asset generation, content scheduling, and campaign tracking right from your macOS desktop.",
    ],
    tips: [
      "Campaign Automation: Look for tools that minimize repetitive asset resizing and social posting tasks.",
      "Privacy Compliant: Verify that analytics and tracking utilities comply with international privacy regulations.",
      "Unified Desktop Hub: Prefer utilities that integrate into your daily workflow rather than complex browser tab clutter.",
    ],
    faqs: [
      {
        q: "How do marketing apps on Mac improve campaign efficiency?",
        a: "Dedicated desktop utilities allow instant asset creation, screenshot annotations, and social previewing without logging into bloated web dashboards.",
      },
      {
        q: "Can Mac tools help automate social media demo videos?",
        a: "Yes. Screen recording tools like Screen Charm and ScreenToast turn plain product walkthroughs into polished social video clips with automatic zooming.",
      },
    ],
  },
  {
    slug: "photography",
    name: "Photography",
    emoji: "📷",
    paragraphs: [
      "Mac photography applications for photo organization, batch resizing, EXIF editing, and image enhancement. Built to take full advantage of Apple Silicon image processing pipelines.",
      "Browse hand-curated tools that respect your photo library structure, avoid proprietary cloud lock-in, and process RAW files with speed.",
    ],
    tips: [
      "Non-Destructive Workflows: Ensure editors save adjustments as metadata or sidecar files rather than overwriting originals.",
      "Batch Processing: Look for utilities that can resize, watermark, and convert hundreds of photos in parallel.",
      "Retina Display Calibration: Choose software that accurately renders wide-gamut Display P3 colors on Mac displays.",
    ],
    faqs: [
      {
        q: "What are the best lightweight photo tools for Mac?",
        a: "Focused utilities that specialize in screenshot editing, batch watermark removal, and quick crop/annotation provide speed without loading heavy photo suites.",
      },
      {
        q: "Can Mac photography apps edit RAW files natively?",
        a: "Yes, macOS includes system-level RAW support for hundreds of camera bodies, allowing native apps to render RAW files instantly.",
      },
    ],
  },
  {
    slug: "finance",
    name: "Finance",
    emoji: "💵",
    paragraphs: [
      "Manage personal budgeting, crypto assets, freelance invoicing, and financial tracking on your Mac. These utilities emphasize local data encryption and clear visual reporting.",
      "Avoid sharing your banking credentials with unnecessary cloud aggregators by opting for local-first finance utilities that keep your ledger on your drive.",
    ],
    tips: [
      "End-to-End Encryption: Sensitive financial ledgers must be encrypted with robust standards (AES-256) on your Mac.",
      "Multi-Currency Support: Ensure the utility accurately tracks real-time exchange rates and international payments.",
      "Export Freedom: Your transactions should be exportable to CSV, JSON, or standard spreadsheet formats at any time.",
    ],
    faqs: [
      {
        q: "Why use a native Mac finance app over a web tool?",
        a: "Native desktop finance tools keep your sensitive account balances and transaction history stored securely on your local SSD rather than on remote cloud servers.",
      },
      {
        q: "Can I track freelance invoices and revenue on Mac?",
        a: "Yes, lightweight accounting and invoice trackers on Mac help freelance creators monitor billable hours and outstanding payments with zero monthly fees.",
      },
    ],
  },
  {
    slug: "lifestyle",
    name: "Lifestyle",
    emoji: "🌿",
    paragraphs: [
      "Mac lifestyle apps designed for personal wellness, habit tracking, mindfulness, and ambient work environments. Create a balanced, focused workspace right on macOS.",
      "From notch ambient sounds and smart break reminders to daily journal prompts, these applications enhance your daily computer routine.",
    ],
    tips: [
      "Non-Intrusive Notifications: Choose break reminders and habit trackers that suggest pauses gently without disruptive popups.",
      "Clean Aesthetic: Look for minimalist interfaces that blend naturally with the modern macOS design language.",
      "Battery Efficiency: Ambient background apps should use minimal energy so your MacBook battery lasts all day.",
    ],
    faqs: [
      {
        q: "What lifestyle apps help prevent eye strain on Mac?",
        a: "Break reminder apps that enforce the 20-20-20 rule and ambient lighting adjusters help reduce eye fatigue during long desk sessions.",
      },
      {
        q: "Can notch apps play ambient sounds?",
        a: "Yes, utilities like NotchDodo integrate mini audio players and ambient timers directly into the camera notch area.",
      },
    ],
  },
  {
    slug: "business",
    name: "Business",
    emoji: "💼",
    paragraphs: [
      "Mac business software for founders, project managers, and growing teams. Streamline contracts, invoicing, client communication, and team operations.",
      "Equip your Mac with dependable business tools that deliver reliable performance, clear data privacy policies, and straightforward licensing.",
    ],
    tips: [
      "Document Signing & PDF Tools: Look for lightweight PDF utilities that allow signing and form-filling without hefty monthly subscriptions.",
      "Offline Reliability: Ensure business-critical client data remains accessible even during internet outages.",
      "Secure Storage: Choose apps that integrate with FileVault and the macOS Keychain for enterprise-grade security.",
    ],
    faqs: [
      {
        q: "What are the most essential business apps for a Mac user?",
        a: "Beyond email and spreadsheets, key utilities include secure PDF signers, clipboard history managers for repetitive data entry, and screen demo recorders for asynchronous team communication.",
      },
      {
        q: "How do one-time purchase Mac apps benefit small businesses?",
        a: "They eliminate recurring SaaS subscription fatigue, lowering operational overhead while giving teams perpetual software access.",
      },
    ],
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    emoji: "🎮",
    paragraphs: [
      "Unwind with Mac entertainment applications, media players, retro emulators, and casual desktop companions. Turn your Mac into an immersive entertainment hub.",
      "Discover media tools that play any video format natively, manage your movie collections, and deliver low-latency performance on Apple Silicon.",
    ],
    tips: [
      "Universal Codec Support: Media players should handle MKV, MP4, AVI, and HEVC files without requiring external codec packs.",
      "Metal Graphics Acceleration: Ensure games and media tools utilize Apple's Metal graphics API for smooth 120Hz ProMotion playback.",
      "Audio Pass-Through: Look for apps that support Dolby Atmos and spatial audio on compatible Mac speakers and AirPods.",
    ],
    faqs: [
      {
        q: "What is the best media player for Mac in 2026?",
        a: "Native open-source and modern media players built with Metal hardware acceleration play 4K HDR videos smoothly with low battery consumption.",
      },
      {
        q: "Can modern Macs run retro gaming emulators?",
        a: "Yes, Apple Silicon Macs handle retro console emulation with high performance and low power draw, supporting Bluetooth controllers out of the box.",
      },
    ],
  },
  {
    slug: "communication",
    name: "Communication",
    emoji: "💬",
    paragraphs: [
      "Mac communication tools to keep you connected with clients, teams, and friends. From unified chat docks to smart meeting assistants and microphone managers.",
      "Take back control over noisy chat notifications with intelligent desktop utilities that summarize messages and protect your focus hours.",
    ],
    tips: [
      "Unified Window Management: Look for tools that aggregate multiple messaging protocols into a single lightweight window.",
      "Mute Status Visibility: Menu bar indicators that clearly show whether your microphone is live prevent embarrassing meeting moments.",
      "Notification Filtering: Granular alert controls ensure you only get pinged for urgent direct mentions during work sessions.",
    ],
    faqs: [
      {
        q: "How can I manage multiple chat apps without slowing down my Mac?",
        a: "Use lightweight native client wrappers or dock hiders to prevent dozens of background Electron instances from consuming memory.",
      },
      {
        q: "Are there Mac utilities to mute my microphone with a global hotkey?",
        a: "Yes, several menu bar utilities allow you to toggle system-wide microphone mute instantly from any application using a keyboard shortcut.",
      },
    ],
  },
  {
    slug: "analytics",
    name: "Analytics",
    emoji: "📊",
    paragraphs: [
      "Mac analytics and data visualization utilities for tracking website traffic, app metrics, system performance, and API uptime from your desktop.",
      "Monitor vital business and system health metrics with glanceable menu bar widgets and privacy-conscious dashboards that require zero tracking scripts.",
    ],
    tips: [
      "Glanceable Menu Bar Metrics: Prioritize utilities that display real-time counters directly in your menu bar.",
      "Direct API Integration: Tools should connect directly to analytics APIs without routing confidential data through middleman proxies.",
      "Low Update Frequency Overhead: Ensure background polling is jittered and efficient to avoid unnecessary battery drain.",
    ],
    faqs: [
      {
        q: "Can I monitor website analytics directly from the Mac menu bar?",
        a: "Yes, lightweight menu bar analytics utilities connect to privacy-friendly services like Plausible or Google Analytics to show live visitors and daily pageviews.",
      },
      {
        q: "How do Mac analytics apps preserve data privacy?",
        a: "They query metrics using direct read-only API tokens stored in your local Keychain, ensuring your customer analytics are never stored on third-party servers.",
      },
    ],
  },
];

export function normalizeCategorySlug(slug: string) {
  if (slug === "utilities") return "utility";
  if (slug === "developer-tools") return "dev";
  return slug;
}

export function findShelfCategory(slug: string): ShelfCategory | undefined {
  const key = normalizeCategorySlug(slug);
  return shelfCategories.find((item) => item.slug === key);
}

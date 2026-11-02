export type GuideFaq = { q: string; a: string };

export type GuideEnhancement = {
  quickAnswer: string;
  faqs: GuideFaq[];
};

/** Answers below restate the directory listings. They do not add test results. */
export const guideEnhancements: Record<string, GuideEnhancement> = {
  "must-have-mac-apps-2026": {
    quickAnswer:
      "Shottr is the screenshot app with scrolling capture and OCR. Better Shot is the free one, and it records as well as capturing. Maclip is the clipboard app described as encrypted. Voicera streams audio for recognition. It is not described as offline.",
    faqs: [
      {
        q: "Which screenshot app on this shelf does scrolling capture and OCR?",
        a: "Shottr. The listing says it takes screenshots, including scrolling captures, and adds OCR, a screen ruler, and a color picker. Better Shot takes screenshots and records the screen. Its listing does not say it does OCR or scrolling capture.",
      },
      {
        q: "Which clipboard app is described as encrypted?",
        a: "Maclip. The listing says it stores clipboard history encrypted on the Mac. Tucket keeps history on the Mac and opens it from the notch. The Tucket listing does not say the history is encrypted.",
      },
      {
        q: "Does the directory say Voicera works offline?",
        a: "No. The Voicera listing says audio is streamed for recognition and not kept after the text comes back. A free plan was listed at 500 words a week. HoldSpeak is the listing that says transcription stays on the Mac.",
      },
    ],
  },
  "best-free-mac-apps": {
    quickAnswer:
      "Better Shot is the free app in this list: screenshots and screen recording, no account and no watermark. Shottr has a free period, then a paid license. Mole is not free. It was listed at $19 once.",
    faqs: [
      {
        q: "Which apps in the directory are actually free?",
        a: "Better Shot is marked Free. The developer says it is free, with no account and no watermark. Shottr is Freemium: scrolling capture and OCR, with a one-time Basic license listed at $12. Do not treat a paid app as free because it has a trial.",
      },
      {
        q: "Is Mole a free AppCleaner alternative?",
        a: "No. Mole is marked Paid. The site listed $19 once, with a 14-day refund. It uninstalls Mac apps together with leftover files, and it also maps disk usage and clears caches.",
      },
      {
        q: "What does the free Voicera plan include?",
        a: "The listing says a free plan was listed at 500 words a week. Pro was listed at $12 a month, or $5 a month on the yearly plan. Audio is streamed for recognition. The listing does not say transcription stays on the Mac.",
      },
    ],
  },
  "best-clipboard-manager-mac": {
    quickAnswer:
      "Maclip is the one described as encrypted clipboard history, listed at $9.99 once. Tucket opens history from the notch and was listed at $10 once. Clippio was listed at $6.90 once and says there is no cloud sync.",
    faqs: [
      {
        q: "Which of these clipboard apps is encrypted?",
        a: "Maclip. The listing says history is encrypted on the Mac, clips are not uploaded, and password-manager apps are ignored. Tucket says nothing you copy leaves the Mac. Clippio says there is no cloud sync. Those two listings do not say the store is encrypted.",
      },
      {
        q: "What prices were listed?",
        a: "Tucket: $10 once, with $15 shown as the regular price, macOS 14 or later. Clippio: $6.90 once, macOS 13 or later. Maclip: $9.99 once for up to two Macs, with a 7-day trial, macOS 13 or later. Check the developer sites before you pay.",
      },
      {
        q: "Does Tucket say it ignores password managers?",
        a: "No. That sentence is on the Maclip listing. Tucket's listing says the history opens from the MacBook notch and that nothing you copy leaves the Mac.",
      },
    ],
  },
  "best-notes-app-mac": {
    quickAnswer:
      "Anytype is the free-plan notes app: typed objects, local-first data, and peer-to-peer sync. iA Writer is the markdown editor sold as a one-time purchase on the Mac.",
    faqs: [
      {
        q: "What does the directory say about Anytype?",
        a: "Anytype organizes information as typed objects with relations, keeps data local-first, and syncs peer-to-peer. It has a free plan. Paid memberships add remote storage and sharing limits. Check current prices on anytype.io before you buy.",
      },
      {
        q: "How is iA Writer sold?",
        a: "The Mac app is a one-time purchase, sold separately from the iPhone, iPad, and Windows versions. It is a markdown editor built around a calm page and plain-text files.",
      },
    ],
  },
  "best-mac-disk-space-analyzer": {
    quickAnswer:
      "ScanMyDisk is the visual disk space analyzer. The listing does not quote a dollar price. Mole also maps disk usage, and the site listed it at $19 once. ScanMyDisk is built by the author of this site.",
    faqs: [
      {
        q: "What does ScanMyDisk say it does?",
        a: "It maps storage into an interactive visual breakdown so you can find oversized files and inspect hidden directories. The directory marks it Paid and does not record a dollar amount. It does not describe automatic deletion.",
      },
      {
        q: "What does Mole cost, and what else does it do?",
        a: "The site listed $19 once, with a 14-day refund, and macOS 14 or later. Mole uninstalls Mac apps together with leftover files, maps disk usage, and clears caches. It is not a free app.",
      },
      {
        q: "How is ByteSweep different?",
        a: "ByteSweep shows what is using disk space and cleans only what you approve. Cleaned items can be restored for 7 days. The site listed $29.99 once. It is not described as an uninstaller.",
      },
    ],
  },
  "best-bartender-alternative-mac": {
    quickAnswer:
      "ClearBar hides third-party menu bar icons in one panel. The developer says it needs macOS 26 or 27 on Apple silicon, and the site listed a launch price of $5, then $12, as a one-time purchase. Lounge also hides menu bar icons and opens them from a notch panel. Its site did not list a price.",
    faqs: [
      {
        q: "What did ClearBar's site list?",
        a: "A launch price of $5, then $12, as a one-time purchase. The listing says it hides third-party menu bar icons and keeps those apps in one panel, where you can open a menu or quit the app. It says the app needs macOS 26 or 27 on Apple silicon.",
      },
      {
        q: "What does Lounge add?",
        a: "Lounge hides and reveals menu bar icons and opens a panel near the notch, with clipboard history in that panel. The developer says it needs macOS 26 or later. The site did not list a price when this was checked.",
      },
    ],
  },
  "best-notch-apps-mac": {
    quickAnswer:
      "NotchDodo and Droppy were each listed at $9.99 once. Alcove puts notifications and now playing in the notch, and its site did not list a price. Tucket opens clipboard history from the notch and was listed at $10 once.",
    faqs: [
      {
        q: "What is in the NotchDodo listing?",
        a: "A hover panel for music, timers, calendar, files, notes, and clipboard. The site listed a lifetime license at $9.99 and said it needs macOS 14 or later.",
      },
      {
        q: "What if the Mac has no notch?",
        a: "Droppy is described as a Dynamic Island that, on a Mac without a notch or on an external display, uses that island instead of a camera cutout. The site listed $9.99 once, with a three-day trial, and macOS 14 or later.",
      },
    ],
  },
  "best-appcleaner-alternative-mac": {
    quickAnswer:
      "Mole is the paid alternative on this shelf, listed at $19 once. It uninstalls an app together with leftover files and also maps the disk. It is not a free app.",
    faqs: [
      {
        q: "What does Mole cost?",
        a: "The site listed $19 once, with a 14-day refund, and macOS 14 or later. The pricing label in the directory is Paid.",
      },
      {
        q: "What does the Mole listing say it does?",
        a: "It uninstalls Mac apps together with leftover files, maps disk usage, and clears caches. The listing does not describe System Integrity Protection or which system folders it refuses to touch.",
      },
      {
        q: "When is ByteSweep the closer fit?",
        a: "When the job is seeing what filled the disk. ByteSweep shows disk use and deletes only what you approve, with a 7-day restore. The site listed $29.99 once. It does not present itself as the tool you drag an app onto.",
      },
    ],
  },
  "best-notchnook-alternative-mac": {
    quickAnswer:
      "NotchDodo and Droppy both list $9.99 once. Alcove is the narrower notch display already on this shelf, and its site did not list a price when it was checked.",
    faqs: [
      {
        q: "What prices are on this shelf?",
        a: "NotchDodo: $9.99 lifetime, macOS 14 or later. Droppy: $9.99 once, a three-day trial, macOS 14 or later. Alcove: no price was listed. NotchNook itself is not an app in this directory.",
      },
    ],
  },
  "best-paste-alternative-mac": {
    quickAnswer:
      "Tucket, Clippio, and Maclip each charge once and keep clipboard history on the Mac. Maclip is the listing that says the history is encrypted.",
    faqs: [
      {
        q: "What were the one-time prices?",
        a: "Tucket $10 once, Clippio $6.90 once, and Maclip $9.99 once for up to two Macs. Tucket says nothing you copy leaves the Mac. Clippio says there is no cloud sync. Maclip says clips are not uploaded.",
      },
    ],
  },
  "best-screen-studio-alternative-mac": {
    quickAnswer:
      "Screen Charm and ScreenToast add zoom after you stop recording. Screen Charm was listed at $99 once. ScreenToast's export needs Pro, listed at $7 a month or $59 a year. Better Shot is the free recorder on this shelf.",
    faqs: [
      {
        q: "Which recorder is free?",
        a: "Better Shot. The developer says it is free, with no account and no watermark, and that it takes screenshots and records the screen. It needs macOS 14 or later on Apple silicon or Intel.",
      },
      {
        q: "What did Screen Charm's site list?",
        a: "A one-time price of $99, with $149 shown as the regular price, and no subscription. It records the screen, camera, and audio, then applies a zoom on each click. macOS 14 or later is recommended.",
      },
    ],
  },
  "best-cleanshot-x-alternative-mac": {
    quickAnswer:
      "Shottr is the screenshot tool with scrolling capture and OCR. Better Shot is free and also records. DejaShot does not take the shot. It searches screenshots you already saved.",
    faqs: [
      {
        q: "Does Better Shot do scrolling capture or OCR?",
        a: "The Better Shot listing does not say that. It takes screenshots and records the screen, then lets you annotate or edit the video. Scrolling capture, OCR, a screen ruler, and a color picker are on the Shottr listing.",
      },
      {
        q: "What was Shottr's license price?",
        a: "The purchase page lists a one-time Basic license at $12, for one person and up to five computers, and says a free copy asks you to upgrade after 30 days. A license is required for commercial use. The app runs on macOS 10.15 or later.",
      },
    ],
  },
  "best-wispr-flow-alternative-mac": {
    quickAnswer:
      "HoldSpeak and Precis say dictation stays on the Mac. Voicera says the audio is streamed for recognition and then not kept. Voicera is not described as offline.",
    faqs: [
      {
        q: "Which dictation apps say the audio stays on the Mac?",
        a: "HoldSpeak and Precis. HoldSpeak needs Apple silicon and macOS 14.6 or later, and you pay once after a 7-day trial. Precis was listed at a founding price of $19, then $29, paid once.",
      },
      {
        q: "What does Voicera do with the audio?",
        a: "The developer says audio is streamed for recognition and not kept after the text comes back. A free plan was listed at 500 words a week. Pro was listed at $12 a month, or $5 a month on the yearly plan.",
      },
    ],
  },
  "best-logseq-alternative-notes": {
    quickAnswer:
      "Anytype is the notes app in this directory for that job. It keeps data local-first, organizes notes as typed objects, and syncs peer-to-peer. It has a free plan.",
    faqs: [
      {
        q: "What do paid Anytype memberships add?",
        a: "The listing says paid memberships add remote storage and sharing limits. It says to check current prices on anytype.io. The free plan is the local-first one.",
      },
    ],
  },
  "best-ulysses-alternative-writing": {
    quickAnswer:
      "iA Writer is the markdown editor on this shelf. The Mac app is a one-time purchase, sold separately from the iPhone, iPad, and Windows versions.",
    faqs: [
      {
        q: "Does the directory quote iA Writer's price?",
        a: "The developer's buy page listed the Mac app at $49.99. Confirm the current price on ia.net before you buy. The Mac version is sold separately from the iPhone, iPad, and Windows versions.",
      },
    ],
  },
};

export function getGuideEnhancement(slug: string, fallbackExcerpt: string): GuideEnhancement {
  return (
    guideEnhancements[slug] ?? {
      quickAnswer: fallbackExcerpt,
      faqs: [],
    }
  );
}

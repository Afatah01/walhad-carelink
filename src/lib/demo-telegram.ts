/**
 * Canned Telegram conversation used only in "preview" mode.
 * Shown in the Telegram integration card when the deployment has no bot token,
 * so the command surface can be reviewed without sending real messages.
 */
export const DEMO_TELEGRAM_PREVIEWS: { from: "bot" | "user"; text: string; time: string }[] = [
  { from: "user", text: "/start 9fK2Qw", time: "19:42" },
  {
    from: "bot",
    text: "✅ Connected to Walhad CareLink\n\nYou will now receive glucose alerts for Aisha Mohamed.\n\nUseful commands:\n/glucose — latest reading\n/status — connection status\n/settings — notification preferences",
    time: "19:42",
  },
  { from: "user", text: "/glucose", time: "19:43" },
  {
    from: "bot",
    text: "Aisha Mohamed\nGlucose: 63 mg/dL • CRITICAL LOW\nTrend: Falling\nReading time: 01 Nov, 19:43 (just now)\n\nPlease contact the patient and follow the care plan.",
    time: "19:43",
  },
  { from: "user", text: "/acknowledge", time: "19:44" },
  {
    from: "bot",
    text: "✅ Acknowledged alert #41 for Aisha Mohamed.\n\nPlease also contact the patient and follow their care plan.",
    time: "19:44",
  },
];

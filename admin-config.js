/* Predict2U v169 operator configuration.
   This file is safe to commit: do not place passwords, tokens or API keys here. */
window.P2U_ADMIN_CONFIG = Object.freeze({
  version: "v169",
  updatedAt: "",
  board: {
    published: true,
    message: "Today’s board is being prepared. Please check back shortly."
  },
  announcement: {
    enabled: false,
    tone: "info",
    message: "",
    linkLabel: "",
    linkUrl: "",
    expiresAt: ""
  },
  featured: {
    engines: [],
    leagues: []
  },
  community: {
    hiddenIds: [],
    verifiedIds: []
  },
  operations: {
    repository: "https://github.com/riddimbossy-prog/golden-banker-v2",
    qualityWorkflow: "https://github.com/riddimbossy-prog/golden-banker-v2/actions/workflows/site-quality.yml",
    liveScoresWorkflow: "https://github.com/riddimbossy-prog/golden-banker-v2/actions/workflows/live-scores.yml"
  }
});

# What to Expect from Predict2U v264

## On the first visit

1. A short branded football/engine launch screen appears.
2. A three-step walkthrough explains the product.
3. Closing or completing the walkthrough stores the choice locally.
4. The walkthrough can be replayed from **More → Replay walkthrough**.

## When the packaged data is still stale

- A banner says **Predictions temporarily paused**.
- Home shows **Paused** instead of pretending the old fixture set is current.
- Today and Bankers show no old picks.
- Engine pages show a publication-paused state.
- Proof and historical records remain accessible.
- The site resumes publishing automatically after fresh current data is committed.

## After the data workflows run successfully

- Home shows today's match count, qualified picks and active model families.
- Today ranks exact-market picks by independent model-family agreement.
- Bankers may show zero, one, two or three-plus qualified selections; it never invents a third leg.
- **Add all 3** adds the top three available Bankers to the local slip. When only one or two qualify, the button says Add all 1 or Add all 2.
- Adding to the device slip does not require an account.
- Saving privately or posting publicly while signed out redirects to the sign-in page.

## Engine behavior

- The Engine Hub shows 22 registered machines: 11 Active and 11 Shadow in this release.
- Shadow engines remain visible for transparency but do not publish public picks or influence Bankers.
- Agreement is shown as independent model families, not duplicated generations.
- A family can contribute only one vote to the same exact market.

## Team Intelligence behavior

- **Next Match Edge** uses current fixture, odds, venue split and streak rules.
- **Season Power** ranks reliable venue profiles independently of the next-match price.
- Minimum sample is eight home/away venue matches.
- The page considers fixtures from today through seven days ahead.
- Empty lists mean no team passed every threshold; they are not errors.

## UI behavior

- Primary navigation: Home, Today, Bankers, Engines, Proof.
- Mobile and Z Fold use the same five-item bottom dock plus More.
- News and Community remain under More.
- Desktop engine pills are removed from the board; filters and the Engine Hub replace the crowded row.
- Cards emphasize teams, market, odds, data support, Why and Add to Slip.

## PWA behavior

- Android/desktop browsers show their native installation confirmation when supported.
- iPhone/iPad shows Add to Home Screen instructions because Apple does not permit websites to trigger installation automatically.
- The installed icon is the official white-and-green Bold P.
- The service worker cache is v264 and updates the compact current-data bundle network-first.

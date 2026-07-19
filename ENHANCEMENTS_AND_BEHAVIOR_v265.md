# Predict2U v265 — Enhancements and expected behavior

## Why these changes were added

### One navigation behavior through 920px
The previous shell could switch between a squeezed top rail and a bottom dock depending on device pointer reporting. v265 uses the five-tab bottom dock on phones, Z Fold cover/open and tablet portrait widths up to 920px. This avoids hidden or compressed navigation.

### Final responsive override
`mobile-responsive-v265.css` loads last on public pages. It resolves older CSS conflicts without deleting working feature styles. It controls safe areas, card grids, touch targets, sticky filters, modals, horizontal chip scrolling and bottom-dock spacing.

### Team Intelligence restored to Home
Teams now appears in three visible homepage locations:
- Hero button
- Dedicated Team Intelligence panel
- Explore Predict2U card

The dedicated panel links directly to Best Teams, Worst Teams, Best Attack and Best Defence.

### Team deep links
The Team Intelligence page now reads `view`, `category` and `polarity` from the URL. A homepage category opens the correct tab automatically instead of always reopening the default Best Team view.

## What users should expect

### Phone and Z Fold cover
- One-column cards
- Two-column compact statistics where readable
- Two-by-two match-card action buttons
- Horizontal date chips that scroll instead of squeezing
- Sticky filters positioned below the header
- Five-tab bottom navigation always visible
- No page content hidden behind the dock

### Z Fold open and tablets
- Two-column prediction, engine, team and news cards
- Bottom navigation instead of a crowded desktop rail
- Wider Team Intelligence category row
- Responsive forms and filters without overflow

### Desktop
- Existing desktop layout remains intact
- Team Intelligence gains a prominent homepage panel and third hero action

### Team Intelligence
- `Best Teams` opens Next Match Edge → Best
- `Worst Teams` opens Next Match Edge → Worst
- `Best Attack` opens Season Power → Attack → Best
- `Best Defence` opens Season Power → Defence → Best

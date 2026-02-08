# SAP Fiori Design Reference for Centre3

## Color Palette
- Primary Blue: #0070F2 (links, active states, primary buttons)
- Dark Text: #1D2D3E (headings, primary text)
- Label Text: #6B7B8D (form labels, secondary text)
- Body Text: #32363A (regular body text)
- Border: #E5E5E5 (card borders, dividers)
- Background: #F5F6FA (page background)
- White: #FFFFFF (cards, inputs)
- Active Highlight BG: #E8F0FE (active nav item background)
- Active Border: #0070F2 (left border on active nav item)

## Page Headers
- Title: text-2xl font-semibold text-[#1D2D3E]
- Subtitle: text-sm text-[#6B7B8D] mt-1
- Action buttons on the right side
- No gradient backgrounds, no dark bars

## Form Patterns
- Group Header: font-semibold text-[#1D2D3E] text-base with border-b border-[#E5E5E5] pb-2 mb-4
- Labels: text-sm text-[#6B7B8D] font-normal
- Inputs: border border-[#E5E5E5] rounded bg-white focus:border-[#0070F2]
- Read-only fields: Label left (text-[#6B7B8D]), Value right (text-[#1D2D3E] font-medium)

## Tables
- Header row: bg-[#F5F6FA] text-[#6B7B8D] text-xs uppercase tracking-wider
- Body rows: bg-white hover:bg-[#F5F6FA]
- Link columns: text-[#0070F2] hover:underline
- Row borders: border-b border-[#E5E5E5]

## Sidebar Navigation
- Background: white
- Active item: blue left border (3px #0070F2), bg-[#E8F0FE], text-[#0070F2]
- Inactive item: text-[#32363A] hover:bg-[#F5F6FA]
- Section headers: text-xs uppercase text-[#6B7B8D] tracking-wider

## Dialogs/Modals
- Header: font-semibold text-[#1D2D3E], border-b border-[#E5E5E5]
- Footer: border-t border-[#E5E5E5], primary button blue, cancel as text link
- Primary button: bg-[#0070F2] text-white
- Cancel: text-[#0070F2] bg-transparent

## Status Badges
- Active/Success: bg-[#D1FAE5] text-[#059669]
- Warning/Pending: bg-[#FEF3C7] text-[#D97706]
- Error/Rejected: bg-[#FFE5E5] text-[#DC2626]
- Info/Draft: bg-[#F0F0F0] text-[#6B6B6B]
- Neutral: bg-[#F5F6FA] text-[#32363A]

## Switches
- Non-semantic: Blue (#0070F2) when on
- Semantic success: Green (#059669) when on
- Semantic error: Red (#DC2626) when on

## Buttons
- Primary: bg-[#0070F2] text-white rounded-md
- Secondary/Outline: border border-[#0070F2] text-[#0070F2] bg-transparent
- Ghost: text-[#0070F2] bg-transparent
- Destructive: bg-[#DC2626] text-white
- Cancel/Close: text-[#32363A] or text-[#0070F2] bg-transparent

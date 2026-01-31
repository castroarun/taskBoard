# Glassmorphism Design Research & Specifications

> Research compiled for Taskboard mobile dashboard mockups
> Date: 2026-01-30

---

## Table of Contents

1. [Overview](#overview)
2. [Variant A: Light Glassmorphism (Apple-style)](#variant-a-light-glassmorphism-apple-style)
3. [Variant B: Dark Glassmorphism (Linear / Neon style)](#variant-b-dark-glassmorphism-linear--neon-style)
4. [Key CSS Snippets](#key-css-snippets)
5. [Typography Specifications](#typography-specifications)
6. [Shadow Treatment Reference](#shadow-treatment-reference)
7. [Color Palettes](#color-palettes)
8. [Do's and Don'ts](#dos-and-donts)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Performance Considerations](#performance-considerations)
11. [Sources](#sources)

---

## Overview

Glassmorphism creates UI elements that appear as frosted glass floating above layered backgrounds. The effect relies on four pillars:

1. **Semi-transparent backgrounds** using `rgba()` with controlled alpha
2. **Background blur** via `backdrop-filter: blur()`
3. **Subtle borders** at low white opacity for edge definition
4. **Soft shadows** for elevation and depth perception

### Production apps using glassmorphism:
- **Apple** -- iOS Control Center, macOS widgets, Vision Pro UI, Liquid Glass (iOS 26)
- **Microsoft** -- Windows 11 Fluent Design System
- **Linear** -- Dark mode UI with glass elements, custom theme system
- **Robinhood** -- Trading interface with frosted glass panels
- **Tomorrow.io** -- Weather app with glassmorphic overlays
- **Adobe** -- Login form with glassmorphism effect

---

## Variant A: Light Glassmorphism (Apple-style)

### Background Gradient

```css
/* Option 1: Soft pastel gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Option 2: Apple-inspired warm gradient */
background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

/* Option 3: Vibrant pastel mesh (use positioned radial gradients) */
background: #e8eaf6;
background-image:
  radial-gradient(at 20% 30%, rgba(102, 126, 234, 0.4) 0%, transparent 50%),
  radial-gradient(at 80% 20%, rgba(118, 75, 162, 0.3) 0%, transparent 50%),
  radial-gradient(at 50% 80%, rgba(240, 147, 251, 0.3) 0%, transparent 50%);
```

### Glass Card Properties

```css
.glass-card-light {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

### Property Breakdown

| Property | Value | Notes |
|----------|-------|-------|
| `background` | `rgba(255, 255, 255, 0.20)` to `rgba(255, 255, 255, 0.30)` | White tint, 20-30% opacity |
| `backdrop-filter` | `blur(10px)` | Standard frost; up to `blur(20px)` for heavy frost |
| `border` | `1px solid rgba(255, 255, 255, 0.18)` | Subtle white edge |
| `border-radius` | `16px` to `20px` | Rounded, soft corners |
| `box-shadow` | `0 8px 32px 0 rgba(31, 38, 135, 0.37)` | Blue-tinted shadow for depth |
| Text color | `#1a1a2e` or `#2d2d44` | Dark text on light glass |

### Apple iOS Control Center Style (Heavy Frost)

```css
.ios-control-center {
  background-color: rgba(255, 255, 255, 0.49);
  backdrop-filter: blur(33px);
  -webkit-backdrop-filter: blur(33px);
  background-blend-mode: overlay;
  border-radius: 20px;
}
```

### Apple Vision Pro Style

```css
.vision-pro-panel {
  background-color: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### Best Use Cases
- Task cards and list items over soft pastel backgrounds
- Navigation bars and tab bars
- Modal sheets and bottom drawers
- Status/summary cards on dashboards
- Settings panels and form containers

---

## Variant B: Dark Glassmorphism (Linear / Neon style)

### Background Gradient

```css
/* Option 1: Deep dark with neon orbs */
body {
  background: #0D0D2B;
  background-image:
    radial-gradient(at 20% 30%, rgba(106, 0, 244, 0.4) 0%, transparent 50%),
    radial-gradient(at 80% 20%, rgba(41, 121, 255, 0.3) 0%, transparent 50%),
    radial-gradient(at 60% 70%, rgba(0, 229, 255, 0.2) 0%, transparent 50%),
    radial-gradient(at 30% 80%, rgba(255, 20, 147, 0.2) 0%, transparent 50%);
}

/* Option 2: Dark ocean gradient */
background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);

/* Option 3: Deep purple-to-black */
background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%);
background-image:
  radial-gradient(at 30% 40%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
  radial-gradient(at 70% 60%, rgba(59, 130, 246, 0.2) 0%, transparent 50%);
```

### Glass Card Properties

```css
.glass-card-dark {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);
}
```

### Property Breakdown

| Property | Value | Notes |
|----------|-------|-------|
| `background` | `rgba(255, 255, 255, 0.05)` to `rgba(255, 255, 255, 0.10)` | Very subtle white tint |
| `backdrop-filter` | `blur(12px) saturate(150%)` | Saturate makes neon colors pop through |
| `border` | `1px solid rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.15)` | Very subtle edge |
| `border-radius` | `16px` to `20px` | Same as light variant |
| `box-shadow` | `0 8px 32px 0 rgba(0, 0, 0, 0.36)` | Dark shadow, not blue-tinted |
| Text color (primary) | `#ffffff` or `rgba(255, 255, 255, 0.95)` | White text |
| Text color (secondary) | `rgba(255, 255, 255, 0.6)` to `rgba(255, 255, 255, 0.7)` | Muted white |

### Hover / Interactive State

```css
.glass-card-dark:hover {
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.36),
    0 0 30px rgba(139, 92, 246, 0.15);  /* Purple neon glow */
}
```

### Neon Accent Glow Effect

```css
.glass-card-accent {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(139, 92, 246, 0.3);  /* Colored border */
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.36),
    0 0 20px rgba(139, 92, 246, 0.1),    /* Subtle outer glow */
    inset 0 1px 0 rgba(255, 255, 255, 0.1); /* Top edge highlight */
}
```

### Best Use Cases
- Task dashboards and project trackers
- Developer/productivity tools (Linear-style)
- Data visualization overlays
- Night mode / dark theme primary UI
- Notification panels and action sheets
- Progress indicators and metric cards

---

## Key CSS Snippets

### 1. Complete Light Glass Card

```css
.glass-card-light {
  /* Glass effect */
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  /* Border - shiny edge */
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;

  /* Shadow - floating depth */
  box-shadow:
    0 8px 32px 0 rgba(31, 38, 135, 0.37),
    inset 0 4px 20px rgba(255, 255, 255, 0.3);

  /* Spacing */
  padding: 24px;

  /* Text */
  color: #1a1a2e;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 2. Complete Dark Glass Card

```css
.glass-card-dark {
  /* Glass effect */
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);

  /* Border - subtle edge */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;

  /* Shadow - depth on dark */
  box-shadow:
    0 8px 32px 0 rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);

  /* Spacing */
  padding: 24px;

  /* Text */
  color: rgba(255, 255, 255, 0.95);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 3. Background Gradient (Light)

```css
.bg-light-glass {
  min-height: 100vh;
  background: #e8eaf6;
  background-image:
    radial-gradient(at 20% 30%, rgba(102, 126, 234, 0.4) 0%, transparent 50%),
    radial-gradient(at 80% 20%, rgba(118, 75, 162, 0.3) 0%, transparent 50%),
    radial-gradient(at 50% 80%, rgba(240, 147, 251, 0.3) 0%, transparent 50%);
}
```

### 4. Background Gradient (Dark / Neon)

```css
.bg-dark-glass {
  min-height: 100vh;
  background: #0D0D2B;
  background-image:
    radial-gradient(at 20% 30%, rgba(106, 0, 244, 0.4) 0%, transparent 50%),
    radial-gradient(at 80% 20%, rgba(41, 121, 255, 0.3) 0%, transparent 50%),
    radial-gradient(at 60% 70%, rgba(0, 229, 255, 0.2) 0%, transparent 50%),
    radial-gradient(at 30% 80%, rgba(255, 20, 147, 0.15) 0%, transparent 50%);
}
```

### 5. Apple Liquid Glass Effect

```css
.liquid-glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(2px) saturate(180%);
  -webkit-backdrop-filter: blur(2px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 2rem;
  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.2),
    inset 0 4px 20px rgba(255, 255, 255, 0.3);
}
```

### 6. Feature Detection Fallback

```css
/* Fallback for browsers without backdrop-filter */
.glass-card {
  background: rgba(255, 255, 255, 0.85); /* Opaque fallback */
}

@supports (backdrop-filter: blur(10px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}
```

### 7. Prefers Reduced Transparency

```css
@media (prefers-reduced-transparency: reduce) {
  .glass-card {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: none;
    border: 1px solid rgba(0, 0, 0, 0.12);
  }
}
```

---

## Typography Specifications

### Recommended Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Alternative pairings:**
- **Montserrat** -- More geometric, works well for headings
- **Poppins** -- Slightly rounder, friendly feel
- **SF Pro Display** -- Apple's system font (for Apple-style mockups)

### Type Hierarchy for Mobile Dashboard

| Element | Font | Weight | Size | Line Height | Letter Spacing |
|---------|------|--------|------|-------------|----------------|
| Page title | Inter | 700 (Bold) | 28px | 1.2 | -0.02em |
| Section header | Inter | 600 (SemiBold) | 18px | 1.3 | -0.01em |
| Card title | Inter | 600 (SemiBold) | 16px | 1.4 | 0 |
| Body text | Inter | 400 (Regular) | 14px | 1.5 | 0.01em |
| Caption/meta | Inter | 400 (Regular) | 12px | 1.4 | 0.02em |
| Large metric | Inter | 700 (Bold) | 36px | 1.1 | -0.02em |
| Small label | Inter | 500 (Medium) | 11px | 1.3 | 0.05em |

### Text Colors on Glass

**Light variant:**
| Role | Color | Notes |
|------|-------|-------|
| Primary text | `#1a1a2e` | Near-black for maximum contrast |
| Secondary text | `#4a4a6a` | Muted dark purple-gray |
| Tertiary/disabled | `#8888a8` | Mid-tone gray |
| Accent | `#6366f1` | Indigo |

**Dark variant:**
| Role | Color | Notes |
|------|-------|-------|
| Primary text | `rgba(255, 255, 255, 0.95)` | Near-white |
| Secondary text | `rgba(255, 255, 255, 0.6)` | Muted white |
| Tertiary/disabled | `rgba(255, 255, 255, 0.35)` | Faded white |
| Accent | `#a78bfa` | Light purple/violet |
| Accent alt | `#22d3ee` | Cyan/teal |

### Text Enhancement on Glass

```css
/* Light variant -- subtle shadow for lift */
.glass-text-light {
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

/* Dark variant -- subtle shadow for depth */
.glass-text-dark {
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
```

---

## Shadow Treatment Reference

### Shadow Layers Explained

Glass cards use multi-layer shadows for realism:

| Layer | CSS | Purpose |
|-------|-----|---------|
| Outer float | `0 8px 32px rgba(31, 38, 135, 0.2)` | Elevation / floating effect |
| Inner glow | `inset 0 4px 20px rgba(255, 255, 255, 0.3)` | Light refracting inside glass |
| Inner shadow | `inset -1px -2px 3px rgba(49, 49, 49, 0.3)` | Glass depth on edges |
| Top highlight | `inset 0 1px 0 rgba(255, 255, 255, 0.1)` | Light catching top edge |

### Light Variant Shadows

```css
/* Standard elevation */
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);

/* With inner glow */
box-shadow:
  0 8px 32px 0 rgba(31, 38, 135, 0.37),
  inset 0 4px 20px rgba(255, 255, 255, 0.3);

/* Subtle floating */
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
```

### Dark Variant Shadows

```css
/* Standard dark elevation */
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.36);

/* With top edge highlight */
box-shadow:
  0 8px 32px 0 rgba(0, 0, 0, 0.4),
  inset 0 1px 0 rgba(255, 255, 255, 0.08);

/* Neon glow on hover */
box-shadow:
  0 8px 32px 0 rgba(0, 0, 0, 0.36),
  0 0 30px rgba(139, 92, 246, 0.15);
```

### Advanced Multi-Layer (Dark Glass)

```css
box-shadow:
  inset 1px 1px 3px rgba(255, 255, 255, 0.08),  /* Inner highlight */
  inset -1px -2px 3px rgba(49, 49, 49, 0.3),     /* Inner shadow */
  0px 0px 12px rgba(0, 0, 0, 0.46);              /* Outer glow */
```

---

## Color Palettes

### Light Palette (Apple-inspired)

| Role | Color | Hex/RGBA |
|------|-------|----------|
| Background base | Soft lavender | `#e8eaf6` |
| Gradient orb 1 | Soft indigo | `rgba(102, 126, 234, 0.4)` |
| Gradient orb 2 | Soft purple | `rgba(118, 75, 162, 0.3)` |
| Gradient orb 3 | Soft pink | `rgba(240, 147, 251, 0.3)` |
| Card fill | White glass | `rgba(255, 255, 255, 0.25)` |
| Card border | White edge | `rgba(255, 255, 255, 0.18)` |
| Primary accent | Indigo | `#6366f1` |
| Success | Green | `#22c55e` |
| Warning | Amber | `#f59e0b` |
| Error | Rose | `#f43f5e` |

### Dark Neon Palette (Linear-inspired)

| Role | Color | Hex/RGBA |
|------|-------|----------|
| Background base | Deep navy | `#0D0D2B` |
| Gradient orb 1 | Neon purple | `rgba(106, 0, 244, 0.4)` |
| Gradient orb 2 | Electric blue | `rgba(41, 121, 255, 0.3)` |
| Gradient orb 3 | Neon teal | `rgba(0, 229, 255, 0.2)` |
| Gradient orb 4 | Hot pink | `rgba(255, 20, 147, 0.15)` |
| Card fill | White tint | `rgba(255, 255, 255, 0.06)` |
| Card border | White edge | `rgba(255, 255, 255, 0.1)` |
| Primary accent | Violet | `#a78bfa` |
| Secondary accent | Cyan | `#22d3ee` |
| Success | Emerald | `#34d399` |
| Warning | Amber | `#fbbf24` |
| Error | Rose | `#fb7185` |

### Gradient Combinations That Work Well

| Name | Colors | CSS |
|------|--------|-----|
| Purple Dawn | Purple to blue | `linear-gradient(135deg, #667eea, #764ba2)` |
| Ocean Dark | Teal to navy | `linear-gradient(135deg, #0f2027, #203a43, #2c5364)` |
| Neon Night | Purple to pink | `linear-gradient(135deg, #6A00F4, #FF1493)` |
| Cool Mist | Blue to teal | `linear-gradient(135deg, #2979FF, #00E5FF)` |
| Sunset Glow | Pink to orange | `linear-gradient(135deg, #f093fb, #f5576c)` |
| Deep Space | Black to purple | `linear-gradient(135deg, #0a0a1a, #1a0a2e)` |

---

## Do's and Don'ts

### DO

1. **Use vibrant or gradient backgrounds** -- Glass is invisible on flat/solid backgrounds. The effect needs something to blur and distort. Always place glass over gradients, images, or colored surfaces.

2. **Keep glass effects sparse** -- Reserve for high-priority elements: navigation, key cards, modals. 3-5 glass elements on screen maximum for mobile.

3. **Maintain consistent light source** -- All glass panels should reflect light from the same direction. Use the inset white highlight on the same edge across all cards.

4. **Add semi-opaque overlay behind text** -- A 10-30% tinted overlay under text areas ensures readability regardless of what background content sits behind the glass.

5. **Use `saturate()` with blur on dark themes** -- `backdrop-filter: blur(12px) saturate(150%)` makes background colors more vibrant through the glass, creating a premium feel.

6. **Test on real devices** -- Glass blur rendering varies significantly across devices and browsers. Always test on actual mobile hardware.

7. **Provide fallbacks** -- Use `@supports` for browsers without `backdrop-filter` and honor `prefers-reduced-transparency`.

8. **Use rounded corners** -- 16px minimum border-radius. Glassmorphism looks wrong with sharp corners.

9. **Layer depth with opacity** -- Closer/higher z-index elements = more opaque background + higher blur. Distant elements = more transparent + lower blur.

10. **Design the background first** -- The background environment defines how every glass element will look. Start with the gradient, then add glass on top.

### DON'T

1. **Don't use glass on flat/solid backgrounds** -- No gradient = no visible glass effect. The card just looks like a semi-transparent box.

2. **Don't apply glassmorphism to everything** -- Overuse makes the UI look foggy, unfocused, and cheap. Be selective.

3. **Don't use pure white borders on dark glass** -- White borders glow harshly on dark backgrounds. Use `rgba(255, 255, 255, 0.08)` to `rgba(255, 255, 255, 0.15)` instead.

4. **Don't use dark text on dark glass** -- Even if the background seems bright in one area, it may scroll over a dark area. Use white text on dark glass, always.

5. **Don't set `opacity` on the whole element** -- Use `rgba()` alpha channels instead. Setting `opacity: 0.5` on the container fades everything including text and children.

6. **Don't use heavy blur (30px+) on mobile** -- `backdrop-filter` is GPU-intensive. Keep blur at 10-16px on mobile for smooth performance.

7. **Don't animate blur values** -- Animating `backdrop-filter` causes frame drops and jank. Animate `opacity` or `transform` instead.

8. **Don't place text over high-contrast background areas** -- If the background behind the glass has sharp light-to-dark transitions, text will be unreadable in certain scroll positions.

9. **Don't ignore accessibility** -- Always provide `prefers-reduced-transparency` fallback. Apple devices offer "Reduce Transparency" for a reason.

10. **Don't use glassmorphism for long-form text containers** -- Glass works for cards, metrics, navigation. Not for paragraphs of text. The transparency creates eye strain over extended reading.

---

## Accessibility Guidelines

### Contrast Requirements (WCAG 2.2)

| Element | Minimum Ratio | Standard |
|---------|---------------|----------|
| Normal text (< 18pt) | 4.5:1 | WCAG AA |
| Large text (>= 18pt or 14pt bold) | 3:1 | WCAG AA |
| UI components / graphical objects | 3:1 | WCAG AA |
| Enhanced (Level AAA) | 7:1 / 4.5:1 | WCAG AAA |

### Making Glass Accessible

1. **Add semi-opaque backing behind text areas** -- 10-30% opacity overlay stabilizes contrast without killing the glass effect.

2. **Use `prefers-reduced-transparency` media query** -- Replace glass with solid backgrounds when the user has enabled this OS-level preference.

3. **Provide a high-contrast mode** -- Linear's approach: define just 3 theme variables (base, accent, contrast) and auto-generate high-contrast versions.

4. **Test against multiple background positions** -- If the background scrolls or if the glass element is positioned over varying content, test contrast at every position.

5. **Use text shadows sparingly** -- A subtle `text-shadow: 0 1px 2px rgba(0,0,0,0.2)` can lift text off the glass surface without looking heavy.

6. **Minimum card opacity guidance:**
   - Light glass: `rgba(255, 255, 255, 0.25)` minimum for readable text
   - Dark glass: `rgba(0, 0, 0, 0.3)` overlay behind text, or `rgba(255, 255, 255, 0.06)` card + white text

7. **Never use glassmorphism for critical interactive elements** without solid-color fallbacks.

---

## Performance Considerations

### Mobile-Specific Guidelines

| Consideration | Recommendation |
|---------------|----------------|
| Max blur value | 16px on mobile (10-12px preferred) |
| Max glass elements on screen | 3-5 simultaneously |
| Animate glass? | Never animate `backdrop-filter`. Use `opacity` / `transform` |
| Pre-blur backgrounds | Consider using a pre-blurred image instead of CSS blur |
| Hardware acceleration | Add `transform: translateZ(0)` to glass elements |
| Stacking glass | Avoid stacking multiple glass layers; each layer compounds GPU cost |

### CSS Performance Optimization

```css
.glass-card {
  /* Enable GPU compositing */
  transform: translateZ(0);
  will-change: transform; /* Only if element will animate */

  /* Contain paint to reduce reflow */
  contain: layout paint;
}
```

### Fallback Strategy

```css
/* Base: opaque fallback */
.glass-card {
  background: rgba(255, 255, 255, 0.85);
}

/* Progressive enhancement */
@supports (backdrop-filter: blur(10px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
}

/* Respect user transparency preferences */
@media (prefers-reduced-transparency: reduce) {
  .glass-card {
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border: 1px solid rgba(0, 0, 0, 0.12);
  }
}
```

---

## Blur Value Quick Reference

| Blur Value | Effect | Use Case |
|------------|--------|----------|
| `blur(2px)` | Very subtle, almost clear | Apple Liquid Glass (with saturate) |
| `blur(4px)` | Light frost | Subtle card overlays |
| `blur(8px)` | Medium frost | Standard cards, navigation |
| `blur(10px)` | Standard glassmorphism | Most glass cards (recommended default) |
| `blur(12px)` | Strong frost | Dark theme cards |
| `blur(16px)` | Heavy frost | Prominent panels, featured cards |
| `blur(20px)` | Very heavy frost | Vision Pro style, modal overlays |
| `blur(33px)` | Maximum frost | iOS Control Center style |

---

## Sources

- [Recreating Apple's Liquid Glass Effect with Pure CSS - DEV Community](https://dev.to/kevinbism/recreating-apples-liquid-glass-effect-with-pure-css-3gpl)
- [Apple's Liquid Glass UI design + CSS guide - DEV Community](https://dev.to/gruszdev/apples-liquid-glass-revolution-how-glassmorphism-is-shaping-ui-design-in-2025-with-css-code-1221)
- [Getting Clarity on Apple's Liquid Glass - CSS-Tricks](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/)
- [Dark Glassmorphism: The Aesthetic That Will Define UI in 2026 - Medium](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f)
- [Glassmorphism: Definition and Best Practices - NN/Group](https://www.nngroup.com/articles/glassmorphism/)
- [12 Glassmorphism UI Features, Best Practices, and Examples - UXPilot](https://uxpilot.ai/blogs/glassmorphism-ui)
- [Glassmorphism UI Design Complete 2025 Guide - CoderCrafter](https://codercrafter.in/blogs/react-native/glassmorphism-ui-design-complete-2025-guide-with-examples-code)
- [How to Implement Glassmorphism in Web Design - FranWBU](https://franwbu.com/blog/glassmorphism-in-web-design/)
- [Glass UI - CSS Library for Glassmorphism](https://ui.glass/)
- [Glass UI CSS Generator](https://ui.glass/generator/)
- [Glassmorphism CSS Generator - Hype4 Academy](https://hype4.academy/tools/glassmorphism-generator)
- [How to Implement Glassmorphism with CSS - LogRocket](https://blog.logrocket.com/implement-glassmorphism-css/)
- [iOS Crystalline Blurred Backgrounds with CSS - Fjolt](https://fjolt.com/article/css-ios-crystalline-effect-backdrop-filter)
- [Vision Pro Frosted Glass with 2 Lines of CSS - Medium](https://medium.com/write-your-world/with-only-2-lines-of-css-we-restored-the-frosted-glass-effect-of-vision-pro-08d4663043df)
- [Linear App UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Glassmorphism Meets Accessibility - Axess Lab](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/)
- [Glassmorphism with Accessibility in Mind - New Target](https://www.newtarget.com/web-insights-blog/glassmorphism/)
- [What Is Glassmorphism - Interaction Design Foundation](https://www.interaction-design.org/literature/topics/glassmorphism)
- [10 Mind-Blowing Glassmorphism Examples for 2026 - Onyx8](https://onyx8agency.com/blog/glassmorphism-inspiring-examples/)
- [CSS Glassmorphism Examples - Free Frontend](https://freefrontend.com/css-glassmorphism/)
- [Glassmorphism in 2025: Apple's Liquid Glass - Everyday UX](https://www.everydayux.net/glassmorphism-apple-liquid-glass-interface-design/)

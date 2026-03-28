# AgentsPan v1 Design System

## Visual direction

- Minimalist 2D top-down systems map
- Grid-based layout (32x32 fallback 24x24)
- No pixel-art production burden
- No 3D and no heavy effects

## Palette

Light:
- background `#F5F5F7`
- surface `#FFFFFF`
- text primary `#111317`
- text secondary `#5F6672`
- border `#E5E7EB`

Dark:
- background `#0F1115`
- surface `#151922`
- text primary `#F3F5F7`
- text secondary `#98A2B3`
- border `#262B36`

Accents:
- active `#5B8CFF`
- success `#49B675`
- warning `#D9A441`
- error `#C85D5D`
- info `#7C8DFF`

## Components

- AppShell / Sidebar / TopBar
- ModeSwitch / QuickCommand
- WorldCanvas / WorldToolbar
- ZoneBlock / StationNode / LinkPath
- AgentMarker / ArtifactMarker
- QueueBadge / AlertBadge / SelectionRing
- AgentCard / TaskRow / EventRow / ArtifactTile

## Interaction rules

- Main actions in 1–2 steps
- Important status visible without opening details
- Instant mode switch preserving selected object
- Context panel shared by both modes

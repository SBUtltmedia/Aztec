# Full Playthrough Test Log

## Purpose
Document all interactions for each character to:
1. Verify the game works end-to-end
2. Test different branching paths
3. Verify faction initialization fix
4. Create reference for Puppeteer automation script

## Test Date
2025-12-22

---

## Moctezuma (Aztec Leader)

**URL:** `http://localhost:53134/?nick=Moctezuma&id=playtest_moc`

### Interactions Log

1. **Passage: The Library (Start)**
   - Action: Click link "you're startled by a loud noise"
   - Target passage: Character intro

2. **Passage: Character Setup**
   - Current: Assigning stat points (Strength, Loyalty, Wisdom)
   - Total points: 20
   - Need to distribute and continue

# Game Flow Documentation
## Purpose
Document the complete game flow for creating automated Puppeteer tests.

## Character Setup (COMPLETED)
### Valid Characters:
**Aztecs**: Moctezuma, Tlacaelel, Cuauhtemoc
**Spanish**: Cortes, Alvarado, Marina
**Tlaxcalans**: Xicotencatl_Elder, Xicotencatl_Younger

### Setup Flow:
1. Navigate to `http://localhost:53134/?nick={CHARACTER_NAME}&id={test_id}`
2. Click link: "you're startled by a loud noise"
3. Click link: "begin your journey"
4. Wait for all players (3 Spanish, 3 Aztecs, 2 Tlaxcalans)

## Game Play-Through

### Moctezuma (Aztec Leader)
**Current Page**: Introduction to Quetzalcoatl story
**Available Actions**:
- Link: "the blessing that you seek"

**State**: Game has started, Moctezuma is team leader

---

### Next Steps:
Continue clicking through each character's available choices and document...

# Game Testing Instructions

## Running Automated Tests Without Permissions

To test the multiplayer game state synchronization efficiently, run Claude Code with the `--dangerously-skip-permissions` flag to avoid constant approval prompts.

## Test Objectives

1. **State Synchronization Testing**: Verify that when one character makes a choice or sets a stat, all other connected clients see that change in real-time
2. **Multiplayer Progression**: Ensure the game allows progression when minimum player counts are met (3 Aztec, 3 Spanish, 2 Tlaxcalan)
3. **Full Playthrough**: Test all 15 characters from start to finish through different story branches

## Critical Bug to Investigate

From previous testing sessions, there's a potential state synchronization issue where:
- Each client's `$users` object only shows their own choices
- Updates sent via `<<th-set>>` POST to `/action` endpoint don't propagate to other clients
- `setup.getTotalChoices()` can't count total players because it only sees local state

## Test Procedure

### Setup
1. Start game server: `npm run dev`
2. Launch Chrome DevTools MCP (it will auto-launch Chrome)
3. Run Claude Code with: `--dangerously-skip-permissions`

### Test Steps

1. **Open Multiple Character Tabs**
   - Moctezuma (Aztec): `http://localhost:53134/?nick=Moctezuma&id=moc_test`
   - Tlacaelel (Aztec): `http://localhost:53134/?nick=Tlacaelel&id=tlac_test`
   - Cuauhtemoc (Aztec): `http://localhost:53134/?nick=Cuauhtemoc&id=cuau_test`
   - Cortes (Spanish): `http://localhost:53134/?nick=Cortes&id=cor_test`
   - Alvarado (Spanish): `http://localhost:53134/?nick=Alvarado&id=alv_test`
   - Narvaez (Spanish): `http://localhost:53134/?nick=Narvaez&id=nar_test`
   - Xicotencatl_Elder (Tlaxcalan): `http://localhost:53134/?nick=Xicotencatl_Elder&id=xic_test`
   - Xicotencatl_Younger (Tlaxcalan): `http://localhost:53134/?nick=Xicotencatl_Younger&id=xicy_test`

2. **For Each Character**
   - Click "you're startled by a loud noise"
   - Assign stats (20 points distributed across Strength, Wisdom, Loyalty)
   - Click "submit stats"
   - Click "begin your journey"

3. **Verify State Sync**
   After each "begin your journey" click:
   - Switch to another character's tab
   - Use evaluate_script to check: `SV.users[characterName].choices.Aztec_Tot_Play` (or Spanish_Tot_Play/Tlax_Tot_Play)
   - Verify the choice count increments for all clients

4. **Check Player Count Logic**
   - After 3 Aztec, 3 Spanish, 2 Tlaxcalan complete "begin your journey"
   - Verify all characters can now proceed past the waiting screen
   - Check if `setup.getTotalChoices()` returns correct counts

5. **Monitor Network & Console**
   - Use `list_network_requests` to verify POST /action requests
   - Use `list_console_messages` to check for Socket.io "difference" events
   - Verify state updates are being broadcast and received

## Files to Monitor

- [Twine/Aztec/00_Setup.twee](Twine/Aztec/00_Setup.twee#L85-L88) - `setup.getTotalChoices` implementation
- [Twine/Aztec/00_Setup.twee](Twine/Aztec/00_Setup.twee#L180-L269) - `<<th-set>>` macro
- [sharedRoutes.js](sharedRoutes.js#L54-L123) - `/action` endpoint handler
- [static/Client.js](static/Client.js#L435-L464) - Socket.io difference receiver
- [Twine/Aztec/04_Aztec.twee](Twine/Aztec/04_Aztec.twee#L2809-L2818) - Player count check

## Expected Results

✅ **Success Criteria:**
- All clients see updates when any client makes a choice
- `SV.users` object is consistent across all tabs
- Game progression is allowed when minimum player counts are met
- No JavaScript errors in console
- Socket.io broadcasts are being received

❌ **Failure Indicators:**
- `SV.users` only shows local client's data
- `/action` POST requests succeed but don't broadcast
- `setup.getTotalChoices()` returns 0 or 1 instead of actual count
- Game stuck at "waiting for players" despite enough participants

## Documentation

Create comprehensive logs of:
- Each interaction (click, fill, navigation)
- Network requests sent
- Console messages received
- State changes observed

This documentation will be used to create a Puppeteer automation script for continuous testing.

## README Creation

After testing is complete, create a comprehensive README.md documenting:
- Project overview (multiplayer Twine/SugarCube game about Spanish-Aztec conflict)
- Architecture (Express server, Socket.io, SugarCube macros, th-set for state management)
- Setup instructions
- How to play
- Development workflow
- Testing procedures
- Known issues and fixes

# Incremental Migration Plan: Hybrid Role Architecture

## Goal
Migrate from role-keyed user data to userId-keyed data while maintaining backward compatibility.

## Current Architecture
```javascript
$userId = "test001"                    // Exception (local)
$role = "Marina"                       // Exception (local, used as key)
$god = false                           // Exception (local)
$users["Marina"] = {choices, stats}    // Keyed by role name
```

## Target Architecture (Hybrid)
```javascript
$userId = "test001"                         // Exception (local only)
$viewAsRole = null                          // Exception (admin spoofing)
$users["test001"] = {                       // Keyed by userId
  officialRole: "Marina",                   // Synced, visible to all
  god: false,                               // Synced (or keep local for security)
  choices: {},
  stats: {}
}
$role = $viewAsRole || $users[$userId].officialRole  // Computed
```

## Migration Steps (Incremental - Safe)

### Phase 1: Add Dual Support ✅ START HERE
- [ ] Add `officialRole` to `$users[$userId]` structure
- [ ] Keep existing `$users[$role]` working
- [ ] Ensure both structures stay in sync during transition
- [ ] No breaking changes to existing passages

**Implementation:**
```javascript
// In initialization (Client.js or similar)
$users[$userId] = {
  officialRole: $role,  // Duplicate data
  ...existingData
}
// Keep both $users[$role] AND $users[$userId] pointing to same object
```

### Phase 2: Migrate Passages Gradually
- [ ] Start with test passages (90_ConsolidatedTests.twee)
- [ ] Migrate non-critical passages one file at a time
- [ ] Test after each file migration
- [ ] Update references: `$users[$role]` → `$users[$userId]`

**Priority Order:**
1. Test passages (90_ConsolidatedTests.twee)
2. Setup/initialization (00_Setup.twee)
3. UI passages (11_Dashboard.twee, etc.)
4. Game logic passages
5. Admin/God passages (save for last - most complex)

### Phase 3: Add Admin Spoofing
- [ ] Introduce `$viewAsRole` exception variable
- [ ] Add to exceptions list in 00_Setup.twee
- [ ] Update admin passages to set `$viewAsRole` instead of `$role`
- [ ] Ensure `$role` computation works: `$role = $viewAsRole || $users[$userId].officialRole`

### Phase 4: Deprecate Old Structure
- [ ] Remove `$users[$role]` references (after all passages migrated)
- [ ] Remove `$role` and `$god` from exceptions list
- [ ] Clean up synchronization code

### Phase 5: Testing & Validation
- [ ] Test all multiplayer scenarios
- [ ] Verify admin spoofing works
- [ ] Check that all players can see each other's roles
- [ ] Confirm no data loss or sync issues

## Benefits After Migration
- ✅ Only 2 exception variables instead of 3
- ✅ All players can see who's online and their roles
- ✅ Cleaner data model with single source of truth
- ✅ Admin spoofing still works via `$viewAsRole`
- ✅ Better debugging - userId is natural key

## Risks & Mitigation
- **Risk**: Breaking existing multiplayer sync
  - **Mitigation**: Incremental migration, keep both structures during transition
- **Risk**: Data loss if keys change
  - **Mitigation**: Sync both structures until migration complete
- **Risk**: Missing edge cases in 1000+ references
  - **Mitigation**: Migrate file-by-file, test thoroughly

## Tracking Progress
- Current Phase: **Phase 0 - Planning**
- Files Migrated: **0 / 20**
- References Updated: **0 / 636**
- Last Updated: 2025-12-26

## Notes
- Keep this file updated as migration progresses
- Document any issues or edge cases discovered
- Test thoroughly after each phase
- Can pause/resume migration at any phase boundary

This is a sugarcube twine project which is meant to allow for multiplayer games, the @Twine/Aztec folder is meant to be a full conversion to the "th-set" macro, but I am unsure of how comprehensive it is. Please take a look, ignore @unity for now

## Recent Improvements

### Discord OAuth Session Persistence (2025-11-13)

Users no longer have to re-authenticate with Discord on every page refresh.

- **Implementation**: Server-side sessions with express-session
- **Duration**: 7 days
- **Logout**: Available at `/logout` endpoint
- **Documentation**: See [SESSION_AUTH.md](./SESSION_AUTH.md)

# Patient App Migration Plan

## Overview

Migrate patient app from `~/Projects/pmono/apps/client` to `~/Projects/pmb/apps/client` following the same successful pattern used for the provider app.

## Reference Implementation

Use the **account app** as the template, just like we did for provider app.

## Source Analysis Needed

Check `~/Projects/pmono/apps/client` for:
- Route structure
- Patient-specific features
- Booking functionality (client-side)
- Custom components
- Feature scope vs provider app

## Migration Strategy (Proven Pattern)

### Phase 1: Foundation
1. Copy base structure from `apps/account/`
2. Update port to 3003 (account=3001, provider=3002, client=3003)
3. Create package.json with minimal dependencies
4. Update all config files

### Phase 2: SDK/UI Package Updates
Check if client needs new modules:
- Patient-specific features?
- Booking from client side (already in SDK)
- Any client-only functionality?

### Phase 3: App Implementation
1. Copy full implementations from pmono/apps/client
2. Update all imports @parmazip → @monobase
3. Replace custom hooks with SDK hooks
4. Use UI package components

### Phase 4: Architecture Cleanup
1. Delete any src/api/ duplicates
2. Keep only client-specific hooks
3. Ensure using SDK for: person, booking, billing, notifications, storage, comms

### Phase 5: Testing
1. Fix TypeScript errors
2. Test `bun dev`
3. Commit

## Key Differences from Provider App

**Provider App Had:**
- Schedule/availability management
- Appointment approval workflows
- Earnings analytics
- Patient management (EMR)
- Merchant accounts

**Patient/Client App Likely Has:**
- Browse providers
- Book appointments
- View own appointments
- Medical records access (own)
- Payment/invoicing (client side)

## Estimated Work

- If similar scope to provider: 2-3 sessions
- If simpler (less features): 1-2 sessions
- Use parallel agents for speed

## Success Criteria

- ✅ Full feature parity with pmono client app
- ✅ Clean architecture (no src/api/)
- ✅ Minimal dependencies
- ✅ All imports use @monobase
- ✅ TypeScript compiles
- ✅ Ready for testing

## Commands to Start

```bash
# Check source app
ls ~/Projects/pmono/apps/client

# Copy account app structure
cp -r apps/account apps/client

# Update package.json, vite.config (port 3003), etc.
```

## Notes

- Follow EXACT same pattern as provider migration
- Use account app as template
- Leverage all SDK/UI work already done
- Should be faster since infrastructure exists

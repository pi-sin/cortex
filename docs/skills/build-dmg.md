# Skill: Build DMG

When building the macOS .dmg for distribution, follow this sequence:

## Pre-Build Checks

1. Run `npm run lint` — fix all errors
2. Run `npm run test` — all tests must pass
3. Bump version in package.json if this is a release
4. Verify electron-builder.yml has correct appId and signing config

## Build Steps

1. Run `npm run build` to compile TypeScript and bundle renderer
2. Run `npx electron-builder --mac --universal` for universal binary (arm64 + x64)
3. Run notarization: `node scripts/notarize.ts`
4. Verify output .dmg in `dist/` folder

## Required Entitlements (entitlements.plist)

- `com.apple.security.cs.allow-jit` (ONNX Runtime needs JIT)
- `com.apple.security.network.client` (API calls)
- `com.apple.security.keychain-access-groups` (Keytar token storage)

## Common Issues

- **Notarization fails:** Check Apple Developer certificate validity
- **Crash on launch:** Rebuild native modules (better-sqlite3, keytar) for correct Electron version via `npx electron-rebuild`
- **Universal binary fails:** Ensure both arm64 and x64 native deps are available
- **Code signing error:** Ensure APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and TEAM_ID env vars are set

# Rollback Instructions

## To return to pre-redesign state

The visual redesign is on the `visual-redesign` branch. The `main` branch is untouched.

### Option 1: Switch to main branch

```bash
git checkout main
```

This gives you the codebase exactly as it was before the redesign started.

### Option 2: Return to the base commit of this redesign

Base commit on `visual-redesign` branch: `5e271b7b`

```bash
git checkout 5e271b7b
```

Or to reset the branch to that commit:

```bash
git checkout visual-redesign
git reset --hard 5e271b7b
```

### Option 3: Revert specific commits

The redesign was done in sequential commits on `visual-redesign`:

1. `redesign: step 1 - design system foundation`
2. `redesign: step 2 - fix UI primitive inconsistencies`
3. `redesign: step 3 - homepage redesign`
4. `redesign: steps 4-7 - marketing pages, cards, map`
5. (final step 5/8 commit with navbar + docs)

To revert a specific commit without losing others:
```bash
git revert <commit-hash>
```

### Notes
- The `main` branch was never touched during this redesign.
- No dependencies were added or removed.
- No database schema, API routes, or TypeScript types were changed.
- Any rollback is purely cosmetic — no functionality is affected.

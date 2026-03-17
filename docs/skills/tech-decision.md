# Skill: Tech Decision

When making a significant technical choice, structure the analysis as follows:

## 1. Context

What problem are we solving? What are the constraints?

## 2. Options

List 3-4 realistic options. For each:

- What it is (1 sentence)
- Pros (specific to our stack: Electron + React + TypeScript + macOS)
- Cons (include hidden costs: maintenance burden, bundle size, learning curve)
- Who uses it successfully (real companies/products)

## 3. Recommendation

Pick one. Justify with:

- Why it wins for our CURRENT phase (don't over-engineer for Phase 4)
- Migration cost if we change our mind later
- Worst-case failure mode

## 4. Decision Record

Write a 3-line ADR and save in `docs/decisions/NNNN-<title>.md`:

- **Decision:** We will use X
- **Reason:** Because Y
- **Revisit when:** Z

## Biases to Apply

- Boring, proven tech > cutting-edge
- Fewer dependencies > more
- What team already knows > what's theoretically best
- If two options are close, pick the one easier to reverse
- Always check: does this work well inside Electron specifically?

---
name: thinker-plan
description: Build implementation plan using architect in Self-Consistency mode (N parallel reasoning paths)
---

$1

Utilise l'outil `task` avec subagent_type="architect", pour obtenir une planification complète et détaillée pour cette demande.

### Instructions de délégation à l'agent `architect` (en anglais) :

**Role**: Act as a Senior Software Architect operating in SELF-CONSISTENCY mode.

**Context**: [Verbatim the user request]

**Mode**: SELF-CONSISTENCY

**Constraints**:
- Execute N=3 **parallel** reasoning paths (spawn 3 parallel architect-thinker subagent calls)
- Each path must conclude with a CORE_DECISION tag (1-3 words)
- Perform majority voting across all paths
- Produce a consolidated Technical Design Report
- Include an Implementation Plan broken down into autonomous tasks

**Format**:
- Follow the "Technical Design Report" template from your system instructions
- Include Implementation Plan with task breakdown
- Append Self-Consistency Analysis section with:
  - Confidence Score (calculated below)
  - Alternative Approaches Considered
  - Arbitration Notes (if tie)

**Confidence Score Calculation**:
- Formula: Confidence = (majority_votes / N) × 100
- High: ≥80% consensus (e.g., 3/3 or 4/5 paths agree)
- Medium: 60-79% consensus (e.g., 3/5 paths agree)
- Low: <60% or tie (document all alternatives and provide arbitration rationale)

**Merge Protocol**:
When consolidating N reasoning paths, explicitly state:
- Points of Consensus: Where 2+ paths agree
- Points of Divergence: Where paths disagree
- Arbitration Rationale: Why you selected the winning approach (if tie, document your decision criteria)

**Self-Verification**: Before finalizing, verify:
- All N reasoning paths were executed and documented
- CORE_DECISION tags were extracted from each path
- Confidence score calculation is accurate
- Alternative approaches are summarized even if rejected

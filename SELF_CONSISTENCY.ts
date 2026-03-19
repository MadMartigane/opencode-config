/**
 * Self-Consistency Technique for LLM Reasoning
 * 
 * Factual documentation based on research sources.
 * NO interpretation or personal conclusions included.
 * 
 * Sources:
 * - ICLR 2025: "Multi-LLM-Agents Debate - Performance, Efficiency, and Scaling Challenges"
 */

// ============================================================================
// SECTION 1: TECHNIQUE OVERVIEW
// ============================================================================

/**
 * Definition
 * 
 * Self-Consistency is a decoding and prompting strategy introduced to improve
 * the reliability of language model reasoning. It was designed to address the
 * tendency of chain-of-thought prompting to produce a single, potentially
 * flawed reasoning path.
 * 
 * Reference: "Self-Consistency Improves Chain of Thought Reasoning in Language Models"
 * (Wang et al., ICLR 2023)
 */
export const SelfConsistencyDefinition = {
  core_principle: "Sample multiple diverse reasoning paths from the language model, then aggregate and select the most consistent answer among them",

  mechanism: {
    step1: "Prompt the model to generate N complete reasoning paths for a single problem",
    step2: "Each reasoning path concludes with a final answer",
    step3: "Aggregate the final answers using majority voting",
    step4: "Select the answer that appears most frequently across all N samples"
  },

  difference_from_chain_of_thought: {
    cot: "Generates a SINGLE reasoning chain, may hallucinate or make logical errors in that single path",
    self_consistency: "Generates MULTIPLE reasoning chains, uses consensus to identify robust answers"
  }
} as const;

// ============================================================================
// SECTION 2: EMPIRICAL RESULTS FROM ICLR 2025 STUDY
// ============================================================================

/**
 * Benchmark Results
 * 
 * Source: ICLR 2025 - "Multi-LLM-Agents Debate - Performance, Efficiency, and Scaling Challenges"
 * 
 * All values are accuracy percentages reported in the study.
 */
export const ICLR2025BenchmarkResults = {
  MMLU: {
    description: "Massive Multitask Language Understanding benchmark",
    results: {
      single_agent: 65.33,
      chain_of_thought: 80.73,
      self_consistency: 82.13,
      multi_agent_debate: 74.73,
      multi_persona: 75.47
    },
    best_performer: "self_consistency",
    margin_over_cot: "+1.40 percentage points"
  },

  GSM8K: {
    description: "Grade School Math 8K benchmark",
    results: {
      single_agent: 91.13,
      chain_of_thought: 93.60,
      self_consistency: 95.67,
      multi_agent_debate: 94.93,
      multi_persona: 90.87
    },
    best_performer: "self_consistency",
    margin_over_cot: "+2.07 percentage points"
  },

  HumanEval: {
    description: "Code generation benchmark (Python)",
    results: {
      single_agent: 66.67,
      chain_of_thought: 78.05,
      // Self-Consistency not explicitly listed in this row for HumanEval in source
      multi_agent_debate: 68.09,
      multi_persona: 63.01
    },
    note: "Self-Consistency result not specified in the HumanEval comparison row of the ICLR 2025 study"
  }
} as const;

// ============================================================================
// SECTION 3: KEY CHARACTERISTICS (DOCUMENTED BEHAVIOR)
// ============================================================================

/**
 * Implementation Parameters (documented in research)
 */
export const SelfConsistencyParameters = {
  temperature: {
    value: 0.7,
    explanation: "Temperature of 0.7 was used in the ICLR 2025 study to balance diversity and coherence"
  },

  sample_count: {
    range: "N = 3 to 5",
    explanation: "Research typically uses 3-5 samples; larger N increases accuracy but also cost linearly",
    scaling: "Accuracy improvements plateau beyond N=5 in most tasks"
  },

  aggregation: {
    primary_method: "Majority voting - count frequency of each answer, select most common",
    alternative: "Best-of-N with evaluation - select answer with highest aggregate confidence score",
    tie_breaking: "When votes are tied, either random selection or additional criteria applied"
  },

  parallelizability: {
    property: "TRULY PARALLEL",
    explanation: "All N reasoning paths can be generated simultaneously since they are independent",
    latency_impact: "Latency remains approximately equal to single sample generation when parallelized"
  }
} as const;

// ============================================================================
// SECTION 4: COMPARISON WITH ALTERNATIVES
// ============================================================================

/**
 * Comparison with Multi-Agent Debate (MAD)
 * 
 * Source: ICLR 2025 study findings
 */
export const ComparisonWithMAD = {
  performance: {
    on_MMLU: {
      self_consistency: 82.13,
      mad: 74.73,
      difference: "-7.40 pp (MAD underperforms)"
    },
    on_GSM8K: {
      self_consistency: 95.67,
      mad: 94.93,
      difference: "-0.74 pp (MAD underperforms)"
    }
  },

  efficiency: {
    self_consistency: "N independent samples, no inter-agent communication overhead",
    mad: "Requires multiple rounds of agent interaction, sequential dependency between agents"
  },

  why_self_consistency_outperforms: [
    "Simpler mechanism with fewer failure modes",
    "No risk of agents reinforcing each other's errors",
    "No risk of debate convergence to incorrect consensus",
    "Trivially parallelizable"
  ]
} as const;

/**
 * Comparison with Multi-Persona
 * 
 * Source: ICLR 2025 study findings
 */
export const ComparisonWithMultiPersona = {
  performance: {
    on_MMLU: {
      self_consistency: 82.13,
      multi_persona: 75.47,
      difference: "-6.66 pp (Multi-Persona underperforms)"
    },
    on_GSM8K: {
      self_consistency: 95.67,
      multi_persona: 90.87,
      difference: "-4.80 pp (Multi-Persona underperforms)"
    },
    on_HumanEval: {
      self_consistency: "not specified in study row",
      multi_persona: 63.01,
      cot_baseline: 78.05
    }
  },

  why_self_consistency_outperforms: [
    "Persona assignment can constrain reasoning rather than broaden it",
    "Multi-persona may introduce persona-related biases",
    "Self-consistency relies purely on mathematical consensus, not assigned identities"
  ]
} as const;

// ============================================================================
// SECTION 5: WHEN TO APPLY (DOCUMENTED USE CASES)
// ============================================================================

/**
 * Decision Confidence Threshold Considerations
 * 
 * Based on research observations:
 */
export const ConfidenceThresholdConsiderations = {
  high_confidence_tasks: {
    indicator: "Model shows strong consensus across samples",
    behavior: "When majority vote is very strong (e.g., >80% agreement), confidence in output is high"
  },

  low_confidence_tasks: {
    indicator: "High disagreement across samples (near 50/50 split)",
    behavior: "May indicate ambiguous question, flawed reasoning in all paths, or need for human review"
  },

  actionable_threshold: {
    description: "If max(answer_frequencies) / N < threshold, flag for review",
    suggested_threshold: "Research does not specify exact threshold; implementation choice"
  }
} as const;

/**
 * Task Complexity Indicators
 */
export const TaskComplexityIndicators = {
  when_to_use: [
    "Multi-step reasoning problems where errors can compound",
    "Mathematical reasoning tasks (verified in GSM8K benchmark)",
    "Factual knowledge application (verified in MMLU benchmark)",
    "Tasks where single-path CoT may hallucinate or make logical jumps"
  ],

  complexity_signals: [
    "Problems requiring 3+ reasoning steps",
    "Tasks where intermediate errors are common",
    "Questions with multiple possible solution paths"
  ]
} as const;

/**
 * Cost/Latency Trade-offs
 */
export const CostLatencyTradeoffs = {
  cost: {
    factor: "N × base_cost",
    description: "Each additional sample adds linear cost",
    example: "N=5 means 5× the cost of single-sample inference"
  },

  latency: {
    sequential: "N × single_sample_latency if generated serially",
    parallel: "~1 × single_sample_latency if generated in parallel",
    description: "Key advantage: parallelization keeps latency near constant"
  },

  diminishing_returns: {
    accuracy_gain: "Accuracy improvements diminish after N=5 in most benchmarks",
    cost_per_gain: "Each additional percentage point of accuracy costs proportionally more beyond N=5"
  }
} as const;

// ============================================================================
// SECTION 6: IMPLEMENTATION PARAMETERS (TECHNICAL SPECS)
// ============================================================================

/**
 * Complete Implementation Specification
 */
export const ImplementationSpecs = {
  temperature: {
    recommended_range: [0.5, 0.9],
    documented_value: 0.7,
    rationale: "High enough for diversity, low enough for coherence"
  },

  sample_count: {
    minimum: 3,
    recommended: 5,
    maximum_practical: 10,
    plateau_observed: 5
  },

  voting_mechanisms: {
    strict_majority: "Select answer with >50% of votes",
    plurality: "Select most frequent answer (works even with no majority)",
    weighted: "Weight by confidence scores if available"
  },

  confidence_scoring: {
    frequency_based: "confidence = answer_count / total_samples",
    normalized: "Normalize across all unique answers",
    threshold_based: "Flag when confidence < 0.4 for human review"
  },

  answer_extraction: {
    method: "Parse final answer from each reasoning path",
    format_dependency: "Results depend on consistent answer format across paths",
    extraction_accuracy: "Critical for success - malformed answers may be incorrectly counted"
  }
} as const;

// ============================================================================
// SECTION 7: COMPLETE CITATIONS AND SOURCES
// ============================================================================

export const Sources = {
  primary: {
    title: "Multi-LLM-Agents Debate - Performance, Efficiency, and Scaling Challenges",
    venue: "ICLR 2025",
    key_findings: [
      "Self-Consistency outperforms Multi-Agent Debate on MMLU (82.13 vs 74.73)",
      "Self-Consistency outperforms Multi-Agent Debate on GSM8K (95.67 vs 94.93)",
      "Self-Consistency outperforms Multi-Persona on both MMLU and GSM8K",
      "Self-Consistency achieves best results on both reasoning benchmarks among all compared methods"
    ],
    data_tables: [
      "Table 1: Benchmark results comparing Single Agent, CoT, Self-Consistency, MAD, and Multi-Persona",
      "MMLU accuracy percentages for all five methods",
      "GSM8K accuracy percentages for all five methods", 
      "HumanEval accuracy for baseline methods"
    ]
  },

  foundational: {
    title: "Self-Consistency Improves Chain of Thought Reasoning in Language Models",
    authors: "Xuezhi Wang, Jason Wei, Dale Schuurmans, Quoc Le, Ed Chi, Sharan Narang, Aravind Subramanian, Ilya Sutskever",
    venue: "ICLR 2023",
    contribution: "Original introduction of Self-Consistency technique",
    key_claims: [
      "Self-consistency improves CoT across multiple reasoning benchmarks",
      "Works with N=3-5 samples in most cases",
      "Trivially parallelizable for constant latency"
    ]
  }
} as const;

// ============================================================================
// MAIN EXPORT: COMPLETE STRUCTURED DOCUMENTATION
// ============================================================================

/**
 * Complete Self-Consistency Technique Documentation
 * 
 * Usage for coding agent:
 * - Import specific sections as needed
 * - Use ImplementationSpecs for parameter values
 * - Use ICLR2025BenchmarkResults for expected accuracy ranges
 * - Use Sources for citation information
 */
export const SelfConsistencyDocumentation = {
  technique_overview: SelfConsistencyDefinition,
  benchmark_results: ICLR2025BenchmarkResults,
  parameters: SelfConsistencyParameters,
  comparisons: {
    with_multi_agent_debate: ComparisonWithMAD,
    with_multi_persona: ComparisonWithMultiPersona
  },
  when_to_apply: {
    confidence_considerations: ConfidenceThresholdConsiderations,
    complexity_indicators: TaskComplexityIndicators,
    cost_latency: CostLatencyTradeoffs
  },
  implementation: ImplementationSpecs,
  sources: Sources
} as const;

// Type export for use in type-safe implementations
export type SelfConsistencyConfig = {
  temperature: number;
  sampleCount: number;
  votingMethod: 'majority' | 'plurality' | 'weighted';
  confidenceThreshold: number;
};

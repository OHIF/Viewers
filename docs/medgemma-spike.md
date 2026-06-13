# MIMPS-23 — MedGemma API Connectivity Spike — Notes

- **Date:** 2026-06-13
- **Timebox:** 2 hours. **Actual time:** ~0.5 hour.
- **Status:** Complete (with a premise correction — see headline).

## Headline finding (changes the task premise)

**MedGemma is NOT available through Google AI Studio / the Gemini API.** A valid
AI Studio key lists 55 models — only `gemini-*` and the general
`gemma-4-26b-a4b-it` / `gemma-4-31b-it`. There is **no `medgemma-4b-it` or
`medgemma-27b`**. So the task as written (call `medgemma-4b-it` via
`google-generativeai` with an AI Studio key) is not executable. MedGemma is
open-weights from the Health AI Developer Foundations program and is reachable
only two ways:

1. **Self-host** the gated Hugging Face weights (`google/medgemma-4b-it`) —
   accept the HAI-DEF license + HF token, run via transformers/vLLM on your own
   GPU (or in-region cloud GPU).
2. **Vertex AI Model Garden** — deploy MedGemma to a managed GPU endpoint
   (needs a GCP project + GPU billing).

Also confirmed: the current platform report helper (`backend/services/llm_service.py`)
is **labeled MedGemma in its docstring but actually calls `gemini-2.5-flash` /
`gemini-2.0-flash`**. There is no MedGemma anywhere in the live pipeline today.

Because MedGemma couldn't be called directly, the four questions below were
de-risked using the closest reachable substitute (`gemini-2.5-flash`, the model
the code already uses) for the prose/Portuguese/latency layer, clearly labeled.

## The 4 questions

**a. Which model variant — 4b-it or 27b?**
Not benchmarkable here (neither is on AI Studio). From published specs + the
hosting constraint: **`medgemma-4b-it` (multimodal)** is the practical
MVP/demo path — ~single modest GPU (T4/L4-class), can take the CXR image
directly, faster. **`medgemma-27b`** (text; a 27B multimodal also exists) gives
better prose but needs a bigger GPU and is slower. Recommendation: start with
**4b-it** for the first validated release; revisit 27B only if prose quality is
the bottleneck. Note: real selection should be made against the
findings->report eval (below), not vibes.

**b. AI Studio rate limits — viable for demo, or need Vertex?**
**Moot — AI Studio does not serve MedGemma at all.** The path is **Vertex AI
Model Garden** (managed endpoint) or **self-host**. For a Brazilian / LGPD
product handling medical images, self-hosting MedGemma in-region is arguably the
cleaner answer than a US-region cloud endpoint — it solves data residency and
rate limits at once. Vertex is faster to stand up but adds residency + per-hour
GPU cost considerations.

**c. Latency.**
MedGemma not measured directly. Substitute (`gemini-2.5-flash`, thinking off):
**~1.3 s English, ~1.8 s Portuguese** for a text-only findings->report
generation. This is a *floor*, not a MedGemma number — real latency is a hosting
decision: 4b-it on a warm L4 likely a few seconds/report; 27B notably slower;
self-host on CPU/Mac much slower. Gemini-2.5-flash with **thinking enabled** blew
the 600-token budget on internal reasoning and truncated the report — set
`thinkingBudget: 0` (or use a non-thinking model) for report generation.

**d. Portuguese output quality.**
Portuguese prompting **does** yield fluent Brazilian Portuguese on the
substitute (correct TÉCNICA/ACHADOS/IMPRESSÃO structure, idiomatic pt-BR,
disclaimer included). **BIG caveat:** that was Gemini, which is strongly
multilingual. **MedGemma is documented as English-leaning**, so its pt-BR quality
will be worse and is the single most important thing to actually measure once a
MedGemma endpoint exists. Options if pt-BR is weak: pt-BR prompt engineering,
generate-then-translate (introduces medical-translation errors — risky), or a
pt-BR fine-tune.

## Cross-cutting risk surfaced by the test (important)

The substitute **hallucinated negative findings not in the input** — it asserted
no pleural effusion/pneumothorax, normal cardiac contour, clear costophrenic
angles, intact bones, when the input findings JSON contained only pneumonia /
right lower lobe / 0.87. Authoritative-sounding invented negatives are exactly
the failure mode that harms patients. **A findings->report factual-consistency
gate is mandatory**, and feeding the model structured findings only (not the raw
image) does NOT remove this risk. This must exist before any clinical framing.

## Recommended Sprint 2 reshaping

1. Replace "call MedGemma via AI Studio" with **"deploy `medgemma-4b-it`
   (Vertex Model Garden or self-host HF weights) and benchmark"** — this is the
   real connectivity task.
2. **Decide hosting:** self-host in-region (residency, rate limits) vs Vertex
   (speed to stand up). Lean self-host for a pt-BR/ANVISA product.
3. **Build the factual-consistency eval gate** (findings <-> report): impression
   references only produced findings, laterality matches, no invented entities.
4. **Measure MedGemma's real pt-BR quality** — the load-bearing unknown.
5. **Fix the mislabeled `llm_service`** — either deploy real MedGemma or stop
   calling the Gemini helper "MedGemma" in code/docs (regulatory-credibility).

See `medgemma-spike-output.txt` for the raw generations and the hallucination
example.

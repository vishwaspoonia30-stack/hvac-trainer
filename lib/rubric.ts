export const SCORING_RUBRIC = `
SCORING RUBRIC — HVAC Sales Call Evaluation

You are evaluating a sales rep's pitch for the NestZero energy assessment program in Ontario. Score each axis from 1–10 based on the transcript.

=== PRIORITY AXES (weight 2x — manager-flagged weaknesses) ===

1. SMALL TALK & RAPPORT (weight 2x)
   - Did the rep build genuine rapport at the door and during transitions?
   - Did they acknowledge the homeowner's comments, not just bulldoze through?
   - Did they use the homeowner's name and mirror their energy?
   Score 9-10: Warm, natural rapport. Homeowner visibly relaxed. Transitions felt human.
   Score 7-8: Some rapport but missed a few beats or felt a little scripted.
   Score 4-6: Minimal small talk. Felt transactional. Homeowner kept their guard up.
   Score 1-3: Jumped straight to pitch. Zero relationship building.

2. SAVINGS EMPHASIS (weight 2x)
   - Did the rep consistently anchor to the homeowner's specific bills (gas/hydro)?
   - Did they calculate the overspend number and name it clearly ($188/mo)?
   - Did they frame everything as "you're already spending this — the program just reallocates it"?
   Score 9-10: Used actual bill numbers. Named the overspend. Made savings feel real and personal.
   Score 7-8: Mentioned savings but stayed general. Didn't anchor to specific dollar amounts.
   Score 4-6: Talked about savings occasionally but no clear calculation or frame.
   Score 1-3: Barely mentioned savings. Focused on equipment features instead of money.

3. CONVERSATION CONTROL (weight 2x)
   - Did the rep guide the conversation through both parts of the pitch?
   - When interrupted or objected to, did they acknowledge and redirect — not capitulate?
   - Did they move toward the table (close of Part 1) and toward paperwork (close of Part 2)?
   Score 9-10: Smooth flow through both parts. Objections handled and redirected. Got to the table.
   Score 7-8: Mostly on track but lost the thread once or twice. Got distracted by tangents.
   Score 4-6: Struggled with objections. Let homeowner derail the flow. Didn't close Part 1 cleanly.
   Score 1-3: Conversation went wherever homeowner took it. Rep was reactive, not leading.

=== STANDARD AXES (weight 1x) ===

4. DISCOVERY & PAIN PINNING
   - Did the rep ask which bill is higher?
   - Did they get the homeowner to name a pain point before pitching solutions?
   Score 9-10: Directly asked, homeowner named a bill, rep referenced it throughout.
   Score 5-7: Asked but didn't use the answer as a consistent hook.
   Score 1-4: Skipped discovery or guessed the pain point without asking.

5. INSPECTION FLOW (Part 1)
   - Did they cover: thermostat, furnace, water heater, heat pump?
   - Did they anchor rebates/qualifications at each step?
   Score 9-10: Hit all 4 stops in natural order. Each stop produced a qualifier/anchor.
   Score 5-7: Hit most stops but skipped one or rushed.
   Score 1-4: Missed major inspection steps or didn't anchor anything.

6. OBJECTION HANDLING
   - When the homeowner objected, did the rep acknowledge → validate → reframe?
   - Did they stay calm and not get defensive?
   Score 9-10: Every objection acknowledged, validated, and reframed cleanly.
   Score 5-7: Most objections handled. One or two left unresolved.
   Score 1-4: Got flustered, over-explained, or capitulated to objections.

7. RENTAL TRAP EXPLANATION
   - Did the rep explain the Reliance/Enercare rental trap correctly?
   - Did they use the 20-year math (paying 10x) and the Ontario ownership angle?
   Score 9-10: Clear, compelling explanation. Homeowner understood why renting is bad.
   Score 5-7: Mentioned it but skipped the math or made it vague.
   Score 1-4: Skipped entirely or fumbled the explanation.

8. CLOSE QUALITY
   - Did the rep ask for the driver's license and initiate paperwork?
   - Was the close recap delivered clearly: "$188 overspend → $144 program → save $44/month"?
   Score 9-10: Clean close with recap. Asked for license. Paperwork initiated.
   Score 5-7: Attempted close but skipped the recap or didn't fully commit.
   Score 1-4: Didn't close. Ended vaguely or let homeowner put off signing.

=== SIGN DECISION RULE ===
- If the overall weighted score is 8.0 or above: the homeowner agrees to proceed (didSign: true)
- If below 8.0: homeowner says "let me think about it" (didSign: false)
- On Hard personas, require 8.5+ to sign
`;

export const SCORE_PROMPT = (transcript: string, personaName: string, personaDifficulty: string) => `
You are evaluating a sales training call. The trainee was playing an HVAC energy assessment sales rep. The AI played the homeowner (persona: ${personaName}, difficulty: ${personaDifficulty}).

Here is the full transcript:
<transcript>
${transcript}
</transcript>

${SCORING_RUBRIC}

Return your evaluation as a JSON object with this exact structure:
{
  "axes": [
    { "name": "Small Talk & Rapport", "score": <1-10>, "weight": 2, "feedback": "<1-2 sentences specific to this call>" },
    { "name": "Savings Emphasis", "score": <1-10>, "weight": 2, "feedback": "<1-2 sentences>" },
    { "name": "Conversation Control", "score": <1-10>, "weight": 2, "feedback": "<1-2 sentences>" },
    { "name": "Discovery & Pain Pinning", "score": <1-10>, "weight": 1, "feedback": "<1-2 sentences>" },
    { "name": "Inspection Flow", "score": <1-10>, "weight": 1, "feedback": "<1-2 sentences>" },
    { "name": "Objection Handling", "score": <1-10>, "weight": 1, "feedback": "<1-2 sentences>" },
    { "name": "Rental Trap Explanation", "score": <1-10>, "weight": 1, "feedback": "<1-2 sentences>" },
    { "name": "Close Quality", "score": <1-10>, "weight": 1, "feedback": "<1-2 sentences>" }
  ],
  "overallScore": <weighted average, one decimal>,
  "summaryFeedback": "<3-5 sentences: what went well, what to fix, most important coaching point>",
  "didSign": <true if weighted score >= 8.0 (or 8.5 for Hard), false otherwise>
}

Return only the JSON object. No markdown fences, no explanation.
`;

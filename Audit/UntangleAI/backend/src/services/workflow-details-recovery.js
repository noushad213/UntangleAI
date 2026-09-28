const FACT_FIELDS = ['fee', 'deadline', 'documentsRequired', 'eligibility', 'office'];

function missingDetails(workflow) {
  return [...new Set((workflow.missingInformation || []).filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
}

function needsDetailsRecovery(workflow) {
  return workflow.status !== 'verified' && !workflow.detailsRecoveryAttempted && missingDetails(workflow).length > 0;
}

function hasFact(value) {
  return Array.isArray(value) ? value.length > 0 : typeof value === 'string' && value.trim().length > 0;
}

async function recoverWorkflowDetails(original, options) {
  const gaps = missingDetails(original);
  if (!gaps.length) return original;
  try {
    for (const gap of gaps.slice(0, 2)) {
      await options.collectSources([options.issueLabel, options.cityName, gap.slice(0, 250)].filter(Boolean).join(' '));
    }
    const candidate = await options.reextract(gaps);
    options.validate(candidate);
    let addedFacts = 0;
    for (const step of original.steps) {
      const enriched = candidate.steps.find((item) => item.stepId === step.stepId);
      if (!enriched) return original;
      if (JSON.stringify(step.dependsOn || []) !== JSON.stringify(enriched.dependsOn || [])) return original;
      for (const field of FACT_FIELDS) {
        if (hasFact(step[field]) && JSON.stringify(step[field]) !== JSON.stringify(enriched[field])) return original;
        if (!hasFact(step[field]) && hasFact(enriched[field])) {
          if (!(enriched.evidence || []).some((item) => typeof item.quote === 'string' && item.quote.trim())) return original;
          addedFacts++;
        }
      }
      if ((step.sourceIds || []).some((id) => !(enriched.sourceIds || []).map(String).includes(String(id)))) return original;
    }
    const remainingGaps = missingDetails(candidate).length;
    if (!addedFacts || remainingGaps > gaps.length || gaps.length - remainingGaps > addedFacts) return original;
    if ((original.conflicts || []).some((conflict) => !(candidate.conflicts || []).some((item) => item.description === conflict.description))) return original;
    options.onRecovered?.({ addedFacts, remainingDetails: missingDetails(candidate).length });
    return candidate;
  } catch (error) {
    options.onFailure?.(error);
    return original;
  }
}

module.exports = { recoverWorkflowDetails, needsDetailsRecovery };

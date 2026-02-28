import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_PATH = path.resolve(__dirname, "../assets/data/site-content.json");
const SCHEMA_PATH = path.resolve(__dirname, "../assets/data/site-content.schema.json");

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidContactUri(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:";
  } catch {
    return false;
  }
}

function assert(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

function validateContentShape(content, errors) {
  assert(isObject(content), "Root content must be an object.", errors);
  if (!isObject(content)) {
    return;
  }

  const requiredRootKeys = ["site", "trust_signals", "cta", "capabilities", "process_steps", "case_studies", "seo"];
  requiredRootKeys.forEach((key) => {
    assert(key in content, `Missing required root key: ${key}`, errors);
  });

  validateSite(content.site, errors);
  validateTrustSignals(content.trust_signals, errors);
  validateCta(content.cta, errors);
  validateCapabilities(content.capabilities, errors);
  validateProcessSteps(content.process_steps, errors);
  validateCaseStudies(content.case_studies, errors);
  validateSeo(content.seo, errors);
}

function validateTrustSignals(trustSignals, errors) {
  assert(Array.isArray(trustSignals), "trust_signals must be an array.", errors);
  if (!Array.isArray(trustSignals)) {
    return;
  }

  assert(trustSignals.length >= 4, "trust_signals must include at least 4 entries.", errors);

  trustSignals.forEach((signal, index) => {
    const prefix = `trust_signals[${index}]`;
    assert(isObject(signal), `${prefix} must be an object.`, errors);
    if (!isObject(signal)) {
      return;
    }

    assert(typeof signal.label === "string" && signal.label.trim().length >= 3, `${prefix}.label must be at least 3 characters.`, errors);
    assert(typeof signal.value === "string" && signal.value.trim().length >= 3, `${prefix}.value must be at least 3 characters.`, errors);
  });
}

function validateCta(cta, errors) {
  assert(isObject(cta), "cta must be an object.", errors);
  if (!isObject(cta)) {
    return;
  }

  const keys = ["primary_label", "secondary_label", "email_subject", "email_body_template"];
  keys.forEach((key) => {
    assert(typeof cta[key] === "string" && cta[key].trim().length > 0, `cta.${key} must be a non-empty string.`, errors);
  });
}

function validateSite(site, errors) {
  assert(isObject(site), "site must be an object.", errors);
  if (!isObject(site)) {
    return;
  }

  const keys = ["studio_name", "hero_headline", "hero_subhead", "booking_url", "contact_email"];
  keys.forEach((key) => {
    assert(typeof site[key] === "string" && site[key].trim().length > 0, `site.${key} must be a non-empty string.`, errors);
  });

  if (typeof site.booking_url === "string") {
    assert(isValidContactUri(site.booking_url), "site.booking_url must be a valid http(s) or mailto URI.", errors);
  }

  if (typeof site.contact_email === "string") {
    assert(isValidEmail(site.contact_email), "site.contact_email must be a valid email address.", errors);
  }
}

function validateCapabilities(capabilities, errors) {
  assert(Array.isArray(capabilities), "capabilities must be an array.", errors);
  if (!Array.isArray(capabilities)) {
    return;
  }

  assert(capabilities.length >= 3, "capabilities must include at least 3 entries.", errors);

  capabilities.forEach((capability, index) => {
    const prefix = `capabilities[${index}]`;
    assert(isObject(capability), `${prefix} must be an object.`, errors);
    if (!isObject(capability)) {
      return;
    }

    assert(typeof capability.title === "string" && capability.title.trim().length >= 3, `${prefix}.title must be at least 3 characters.`, errors);
    assert(typeof capability.description === "string" && capability.description.trim().length >= 10, `${prefix}.description must be at least 10 characters.`, errors);
  });
}

function validateProcessSteps(processSteps, errors) {
  assert(Array.isArray(processSteps), "process_steps must be an array.", errors);
  if (!Array.isArray(processSteps)) {
    return;
  }

  assert(processSteps.length === 3, "process_steps must include exactly 3 steps.", errors);

  processSteps.forEach((step, index) => {
    const prefix = `process_steps[${index}]`;
    assert(isObject(step), `${prefix} must be an object.`, errors);
    if (!isObject(step)) {
      return;
    }

    assert(typeof step.step === "string" && /^[0-9]{2}$/.test(step.step), `${prefix}.step must match two-digit format (01, 02, ...).`, errors);
    assert(typeof step.title === "string" && step.title.trim().length >= 3, `${prefix}.title must be at least 3 characters.`, errors);
    assert(typeof step.description === "string" && step.description.trim().length >= 10, `${prefix}.description must be at least 10 characters.`, errors);
  });
}

function validateCaseStudies(caseStudies, errors) {
  assert(Array.isArray(caseStudies), "case_studies must be an array.", errors);
  if (!Array.isArray(caseStudies)) {
    return;
  }

  assert(caseStudies.length >= 1, "case_studies must include at least 1 entry.", errors);

  const validAudience = new Set(["Internal", "External"]);
  const validConfidentiality = new Set(["public", "anonymized", "restricted"]);
  const seenIds = new Set();

  caseStudies.forEach((caseStudy, index) => {
    const prefix = `case_studies[${index}]`;
    assert(isObject(caseStudy), `${prefix} must be an object.`, errors);
    if (!isObject(caseStudy)) {
      return;
    }

    const keys = [
      "id",
      "title",
      "audience_type",
      "problem",
      "prototype",
      "outcome",
      "metrics",
      "confidentiality",
      "redaction_note",
      "cta_label"
    ];

    keys.forEach((key) => {
      assert(typeof caseStudy[key] === "string" && caseStudy[key].trim().length > 0, `${prefix}.${key} must be a non-empty string.`, errors);
    });

    if (typeof caseStudy.id === "string") {
      assert(/^[a-z0-9-]+$/.test(caseStudy.id), `${prefix}.id must match /^[a-z0-9-]+$/.`, errors);
      assert(!seenIds.has(caseStudy.id), `${prefix}.id must be unique; duplicate id '${caseStudy.id}' found.`, errors);
      seenIds.add(caseStudy.id);
    }

    if (typeof caseStudy.audience_type === "string") {
      assert(validAudience.has(caseStudy.audience_type), `${prefix}.audience_type must be Internal or External.`, errors);
    }

    if (typeof caseStudy.confidentiality === "string") {
      assert(validConfidentiality.has(caseStudy.confidentiality), `${prefix}.confidentiality must be one of public|anonymized|restricted.`, errors);
    }
  });
}

function validateSeo(seo, errors) {
  assert(isObject(seo), "seo must be an object.", errors);
  if (!isObject(seo)) {
    return;
  }

  const keys = ["title", "description", "og_title", "og_description", "canonical_url"];
  keys.forEach((key) => {
    assert(typeof seo[key] === "string" && seo[key].trim().length > 0, `seo.${key} must be a non-empty string.`, errors);
  });

  if (typeof seo.canonical_url === "string") {
    assert(isValidUrl(seo.canonical_url), "seo.canonical_url must be a valid http(s) URL.", errors);
  }
}

async function main() {
  const [contentRaw, schemaRaw] = await Promise.all([
    readFile(CONTENT_PATH, "utf8"),
    readFile(SCHEMA_PATH, "utf8")
  ]);

  let content;
  let schema;

  try {
    content = JSON.parse(contentRaw);
  } catch (error) {
    console.error("Invalid JSON in site-content.json:", error.message);
    process.exit(1);
  }

  try {
    schema = JSON.parse(schemaRaw);
  } catch (error) {
    console.error("Invalid JSON in site-content.schema.json:", error.message);
    process.exit(1);
  }

  if (!schema || schema.title !== "HuTech Studio Site Content") {
    console.error("Unexpected schema metadata. Ensure site-content.schema.json is present and valid.");
    process.exit(1);
  }

  const errors = [];
  validateContentShape(content, errors);

  if (errors.length > 0) {
    console.error("Content validation failed:");
    errors.forEach((message, index) => {
      console.error(`${index + 1}. ${message}`);
    });
    process.exit(1);
  }

  console.log("Content validation passed.");
}

main().catch((error) => {
  console.error("Validation script failed:", error.message);
  process.exit(1);
});

const fetch = require("node-fetch");
const crypto = require("crypto");
const cheerio = require("cheerio");
const fs = require("fs");
const fsp = fs.promises;
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);
const { assertSafeUrl } = require("../utils/urlSecurity");
const { makeError } = require("../utils/errors");
const logger = require("../utils/logger");
const fileStackService = require("./filestack.service");
const { chunkPages } = require("./civicChunker");

const MAX_BYTES = Number(process.env.FETCH_MAX_BYTES) || 2_000_000;
const TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS) || 8_000;
const MAX_REDIRECTS = Number(process.env.ALLOWED_REDIRECTS) || 3;
const MAX_ALTERNATES = Number(process.env.MAX_ALTERNATE_SOURCES) || 3;
const MIN_TEXT_CHARS = Number(process.env.MIN_SOURCE_TEXT_CHARS) || 160;
const MIN_TEXT_WORDS = Number(process.env.MIN_SOURCE_TEXT_WORDS) || 25;

const ENABLE_BROWSER_FALLBACK =
  /^(1|true|yes)$/i.test(process.env.ENABLE_BROWSER_FALLBACK || "");

const ENABLE_FILESTACK_FALLBACK =
  /^(1|true|yes)$/i.test(process.env.ENABLE_FILESTACK_FALLBACK || "");

const ENABLE_LOCAL_OCR =
  /^(1|true|yes)$/i.test(process.env.ENABLE_LOCAL_OCR || "true");

const ENABLE_OFFICE_CONVERSION =
  /^(1|true|yes)$/i.test(process.env.ENABLE_OFFICE_CONVERSION || "true");

const OCR_MAX_PAGES = Number(process.env.OCR_MAX_PAGES) || 10;
const OCR_DPI = Number(process.env.OCR_DPI) || 180;

const OFFICE_TIMEOUT_MS =
  Number(process.env.OFFICE_TIMEOUT_MS) || 20_000;

const PLACEHOLDER_PATTERNS = [
  /could not open\s+iview/i,
  /iview is not compatible/i,
  /contact your system administrator/i,
  /please wait(?:\.{3}|…)?\s*$/i,
  /enable javascript to view/i,
  /javascript is required/i,
  /this site requires javascript/i,
  /loading(?:\.{3}|…)?\s*$/i,
  /browser is not supported/i,
  /unsupported browser/i,
  /checking your browser/i,
  /just a moment(?:\.{3}|…)?\s*$/i,
];

const HARD_BROWSER_ERROR_PATTERNS = [
  /could not open\s+iview/i,
  /iview is not compatible/i,
  /enable javascript to view/i,
  /javascript is required/i,
  /this site requires javascript/i,
  /browser is not supported/i,
  /unsupported browser/i,
  /checking your browser/i,
  /just a moment(?:\.{3}|…)?\s*$/i,
];

function normalizeText(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\r\n]+/g, " ")
    .trim();
}

function extensionForUrl(url) {
  try {
    return path.extname(new URL(url).pathname).toLowerCase();
  } catch {
    return path.extname(String(url || "")).toLowerCase();
  }
}

function detectFormat(resource) {
  const ext = extensionForUrl(resource.finalUrl);
  const header = resource.buffer.subarray(0, 16).toString("ascii");
  const mime = resource.contentType.split(";")[0].trim();

  if (
    resource.contentType.includes("application/pdf") ||
    header.startsWith("%PDF") ||
    ext === ".pdf"
  ) {
    return "pdf";
  }

  if (
    resource.contentType.includes("text/html") ||
    resource.contentType.includes("application/xhtml") ||
    ext === ".html" ||
    ext === ".htm"
  ) {
    return "html";
  }

  if (
    resource.contentType.startsWith("text/") ||
    ext === ".txt" ||
    ext === ".csv" ||
    ext === ".json" ||
    ext === ".xml"
  ) {
    return "text";
  }

  if (
    mime.startsWith("image/") ||
    /^\x89PNG|^GIF8|^JFIF/.test(header) ||
    [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp"].includes(ext)
  ) {
    return "image";
  }

  if (
    [
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".odt",
      ".ods",
      ".odp",
    ].includes(ext) ||
    [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.oasis.opendocument.text",
      "application/vnd.oasis.opendocument.spreadsheet",
      "application/vnd.oasis.opendocument.presentation",
    ].includes(mime)
  ) {
    return "office";
  }

  return "other";
}

async function runCommand(command, args, options = {}) {
  try {
    return await execFileAsync(command, args, {
      timeout: options.timeout || OFFICE_TIMEOUT_MS,
      maxBuffer: options.maxBuffer || MAX_BYTES,
    });
  } catch (err) {
    if (err.code === "ENOENT") {
      throw makeError(
        "SOURCE_PARSE_FAILED",
        `${command} is not installed; install it or use FileStack fallback`
      );
    }

    throw makeError(
      "SOURCE_PARSE_FAILED",
      `${command} conversion failed`
    );
  }
}

function assessContentQuality(text, metadata = {}) {
  const normalized = normalizeText(text);

  const reasons = [];

  const words = normalized
    ? normalized.split(/\s+/).filter(Boolean)
    : [];

  const placeholderMatches = PLACEHOLDER_PATTERNS.filter((pattern) =>
    pattern.test(normalized)
  );

  if (!normalized) {
    reasons.push("empty_content");
  }

  if (normalized.length < MIN_TEXT_CHARS) {
    reasons.push("content_too_short");
  }

  if (words.length < MIN_TEXT_WORDS) {
    reasons.push("too_few_words");
  }

  if (placeholderMatches.length > 0) {
    reasons.push("browser_or_loading_placeholder");
  }

  if (metadata.statusCode && metadata.statusCode >= 400) {
    reasons.push("http_error");
  }

  const sample = normalized.slice(0, 10000);

  const devanagariCount = [...sample].filter((character) =>
    /[\u0900-\u097f]/u.test(character)
  ).length;

  const latinExtendedCount = [...sample].filter((character) =>
    /[\u00c0-\u024f]/u.test(character)
  ).length;

  const replacementCount = [...sample].filter(
    (character) => character === "\ufffd"
  ).length;

  const devanagariRatio = sample.length
    ? devanagariCount / sample.length
    : 0;

  const latinExtendedRatio = sample.length
    ? latinExtendedCount / sample.length
    : 0;

  const replacementCharacterRatio = sample.length
    ? replacementCount / sample.length
    : 0;

  if (replacementCharacterRatio > 0.01) {
    reasons.push("replacement_characters");
  }

  if (latinExtendedRatio > 0.03 && devanagariRatio < 0.01) {
    reasons.push("legacy_font_suspected");
  }

  const placeholderRatio =
    placeholderMatches.length && normalized.length
      ? placeholderMatches.reduce((sum, pattern) => {
          const match = normalized.match(pattern);
          return sum + (match ? match[0].length : 0);
        }, 0) / normalized.length
      : 0;

  if (placeholderRatio > 0.35) {
    reasons.push("placeholder_dominates_content");
  }

  const score = Math.max(
    0,
    Math.min(
      1,
      (Math.min(normalized.length, 4000) / 4000) * 0.45 +
        (Math.min(words.length, 500) / 500) * 0.35 +
        (placeholderMatches.length ? 0 : 0.2)
    )
  );

  return {
    usable: reasons.length === 0,
    score: Number(score.toFixed(3)),
    reasons,
    characterCount: normalized.length,
    wordCount: words.length,
    language:
      devanagariRatio > 0.15
        ? /[A-Za-z]/.test(sample)
          ? "mixed"
          : "devanagari"
        : "latin_or_unknown",
    devanagariRatio: Number(devanagariRatio.toFixed(3)),
    replacementCharacterRatio: Number(
      replacementCharacterRatio.toFixed(3)
    ),
    legacyFontSuspected:
      latinExtendedRatio > 0.03 && devanagariRatio < 0.01,
  };
}

function assessBrowserContentQuality(text) {
  const normalized = normalizeText(text);

  const words = normalized
    ? normalized.split(/\s+/).filter(Boolean)
    : [];

  const hardErrorMatches = HARD_BROWSER_ERROR_PATTERNS.filter(
    (pattern) => pattern.test(normalized)
  );

  const MIN_BROWSER_TEXT_CHARS = Math.max(
    MIN_TEXT_CHARS,
    300
  );

  const MIN_BROWSER_TEXT_WORDS = Math.max(
    MIN_TEXT_WORDS,
    50
  );

  const reasons = [];

  if (!normalized) {
    reasons.push("empty_content");
  }

  if (normalized.length < MIN_BROWSER_TEXT_CHARS) {
    reasons.push("content_too_short");
  }

  if (words.length < MIN_BROWSER_TEXT_WORDS) {
    reasons.push("too_few_words");
  }

  if (hardErrorMatches.length > 0) {
    reasons.push("browser_error_page");
  }

  const sample = normalized.slice(0, 10000);

  const devanagariCount = [...sample].filter((character) =>
    /[\u0900-\u097f]/u.test(character)
  ).length;

  const replacementCount = [...sample].filter(
    (character) => character === "\ufffd"
  ).length;

  const devanagariRatio = sample.length
    ? devanagariCount / sample.length
    : 0;

  const replacementCharacterRatio = sample.length
    ? replacementCount / sample.length
    : 0;

  if (replacementCharacterRatio > 0.02) {
    reasons.push("replacement_characters");
  }

  const score = Math.max(
    0,
    Math.min(
      1,
      (Math.min(normalized.length, 8000) / 8000) * 0.55 +
        (Math.min(words.length, 1000) / 1000) * 0.35 +
        (hardErrorMatches.length === 0 ? 0.1 : 0)
    )
  );

  return {
    usable: reasons.length === 0,
    score: Number(score.toFixed(3)),
    reasons,
    characterCount: normalized.length,
    wordCount: words.length,
    language:
      devanagariRatio > 0.15
        ? /[A-Za-z]/.test(sample)
          ? "mixed"
          : "devanagari"
        : "latin_or_unknown",
    devanagariRatio: Number(devanagariRatio.toFixed(3)),
    replacementCharacterRatio: Number(
      replacementCharacterRatio.toFixed(3)
    ),
    retrievalMethod: "browser",
  };
}

function extractHtmlText(html) {
  const $ = cheerio.load(html);

  $(
    "script, style, nav, header, footer, noscript, svg, iframe, template, form"
  ).remove();

  const main = $(
    "main, article, [role='main'], .content, #content"
  ).first();

  const text = (
    main.length ? main : $("body")
  ).text();

  return normalizeText(text);
}

function discoverAlternateLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("javascript:")
    ) {
      return;
    }

    try {
      const url = new URL(href, baseUrl);
      const label = normalizeText($(element).text()).toLowerCase();
      const urlPath = `${url.pathname} ${url.search}`.toLowerCase();

      const likelyDocument =
        /\.pdf(?:$|[?#])|\.docx?(?:$|[?#])|download|document|notice|circular|form|print|view|attachment/.test(
          `${urlPath} ${label}`
        );

      if (likelyDocument) {
        links.push(url.toString());
      }
    } catch {
      // Ignore malformed links from untrusted source HTML.
    }
  });

  return [...new Set(links)].slice(0, MAX_ALTERNATES);
}

async function fetchResource(
  rawUrl,
  allowedDomains,
  visited = new Set()
) {
  const initialUrl = await assertSafeUrl(
    rawUrl,
    allowedDomains
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  let finalUrl = initialUrl.toString();
  let redirects = 0;

  try {
    res = await fetch(finalUrl, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent":
          process.env.SOURCE_USER_AGENT ||
          "CivicPathBot/1.0 (+source-grounded civic workflow assistant)",
        Accept:
          "text/html,application/xhtml+xml,application/pdf,text/plain;q=0.8,*/*;q=0.1",
      },
    });

    while ([301, 302, 303, 307, 308].includes(res.status)) {
      if (redirects >= MAX_REDIRECTS) {
        throw makeError(
          "SOURCE_FETCH_FAILED",
          "Too many redirects"
        );
      }

      const location = res.headers.get("location");

      if (!location) {
        throw makeError(
          "SOURCE_FETCH_FAILED",
          "Redirect missing location"
        );
      }

      const nextUrl = new URL(location, finalUrl);

      await assertSafeUrl(
        nextUrl.toString(),
        allowedDomains
      );

      finalUrl = nextUrl.toString();

      res = await fetch(finalUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            process.env.SOURCE_USER_AGENT ||
            "CivicPathBot/1.0",
        },
      });

      redirects += 1;
    }

    if (!res.ok) {
      throw makeError(
        "SOURCE_FETCH_FAILED",
        `Source returned status ${res.status}`
      );
    }

    const contentLength = Number(
      res.headers.get("content-length") || 0
    );

    if (contentLength && contentLength > MAX_BYTES) {
      throw makeError(
        "SOURCE_FETCH_FAILED",
        "Source exceeds max allowed size"
      );
    }

    const buffer = await res.buffer();

    if (buffer.length > MAX_BYTES) {
      throw makeError(
        "SOURCE_FETCH_FAILED",
        "Source exceeds max allowed size"
      );
    }

    return {
      buffer,
      finalUrl,
      contentType: (
        res.headers.get("content-type") || ""
      ).toLowerCase(),
      statusCode: res.status,
    };
  } catch (err) {
    if (err.code) {
      throw err;
    }

    logger.error("Source fetch failed", {
      url: rawUrl,
      error: err.message,
    });

    throw makeError(
      "SOURCE_FETCH_FAILED",
      "Failed to fetch source URL"
    );
  } finally {
    clearTimeout(timer);
  }
}

/*
 * Browser extraction for legacy government portals.
 *
 * IMPORTANT:
 * MCGM works correctly with Playwright when navigation starts
 * with "commit". Waiting for "domcontentloaded" can leave some
 * legacy portal pages in an unusable intermediate state.
 */
async function extractWithBrowser(url, allowedDomains) {
  let playwright;

  try {
    playwright = require("playwright");
  } catch {
    return null;
  }

  const safeUrl = await assertSafeUrl(
    url,
    allowedDomains
  );

  const browser = await playwright.chromium.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    /*
     * Start navigation at commit instead of waiting for
     * domcontentloaded. This is important for legacy MCGM pages.
     */
    await page.goto(safeUrl.toString(), {
      waitUntil: "commit",
      timeout: TIMEOUT_MS,
    });

    /*
     * Give the legacy portal time to render its actual content.
     */
    await page.waitForTimeout(5000);

    /*
     * Try networkidle, but do not fail if the portal keeps
     * background requests open.
     */
    await page
      .waitForLoadState("networkidle", {
        timeout: 4000,
      })
      .catch(() => {});

    /*
     * Additional rendering time after network activity.
     */
    await page.waitForTimeout(1500);

    const html = await page.content();

    let text = "";

    try {
      text = normalizeText(
        await page.locator("body").innerText()
      );
    } catch {
      text = extractHtmlText(html);
    }

    /*
     * If the page is unexpectedly short, give it one more
     * opportunity to render before declaring failure.
     */
    if (text.length < 300) {
      await page.waitForTimeout(3000);

      try {
        text = normalizeText(
          await page.locator("body").innerText()
        );
      } catch {
        text = extractHtmlText(
          await page.content()
        );
      }
    }

    return {
      documentType: "html",
      extractedText: text,
      finalUrl: page.url(),
      retrievalMethod: "browser",
      extractionMethod: "playwright-browser",
      pages: [
        {
          pageNumber: 1,
          text,
        },
      ],
      alternateUrls: [],
    };
  } finally {
    await browser.close();
  }
}

async function extractImageText(
  buffer,
  extension = ".png"
) {
  if (!ENABLE_LOCAL_OCR) {
    throw makeError(
      "SOURCE_PARSE_FAILED",
      "Local OCR is disabled"
    );
  }

  const tempDir = await fsp.mkdtemp(
    path.join(os.tmpdir(), "civicpath-ocr-")
  );

  const inputPath = path.join(
    tempDir,
    `source${extension || ".png"}`
  );

  try {
    await fsp.writeFile(inputPath, buffer);

    const { stdout } = await runCommand(
      "tesseract",
      [
        inputPath,
        "stdout",
        "-l",
        process.env.OCR_LANG || "eng",
      ],
      {
        timeout:
          Number(process.env.OCR_TIMEOUT_MS) || 60_000,
        maxBuffer: MAX_BYTES,
      }
    );

    return normalizeText(stdout);
  } finally {
    await fsp.rm(tempDir, {
      recursive: true,
      force: true,
    });
  }
}

async function extractScannedPdfText(buffer) {
  if (!ENABLE_LOCAL_OCR) {
    throw makeError(
      "SOURCE_PARSE_FAILED",
      "Local OCR is disabled"
    );
  }

  const tempDir = await fsp.mkdtemp(
    path.join(os.tmpdir(), "civicpath-pdf-ocr-")
  );

  const pdfPath = path.join(
    tempDir,
    "source.pdf"
  );

  const prefix = path.join(
    tempDir,
    "page"
  );

  try {
    await fsp.writeFile(pdfPath, buffer);

    await runCommand(
      "pdftoppm",
      [
        "-png",
        "-r",
        String(OCR_DPI),
        "-f",
        "1",
        "-l",
        String(OCR_MAX_PAGES),
        pdfPath,
        prefix,
      ],
      {
        timeout:
          Number(process.env.OCR_TIMEOUT_MS) || 120_000,
        maxBuffer: MAX_BYTES,
      }
    );

    const pages = (
      await fsp.readdir(tempDir)
    )
      .filter((name) =>
        /^page-\d+\.png$/.test(name)
      )
      .sort();

    if (!pages.length) {
      throw makeError(
        "SOURCE_PARSE_FAILED",
        "PDF rendering produced no pages for OCR"
      );
    }

    const texts = [];

    for (const page of pages) {
      texts.push(
        await extractImageText(
          await fsp.readFile(
            path.join(tempDir, page)
          ),
          ".png"
        )
      );
    }

    return normalizeText(
      texts.join(" ")
    );
  } finally {
    await fsp.rm(tempDir, {
      recursive: true,
      force: true,
    });
  }
}

async function extractOfficeText(
  buffer,
  extension
) {
  if (!ENABLE_OFFICE_CONVERSION) {
    throw makeError(
      "SOURCE_PARSE_FAILED",
      "Local Office conversion is disabled"
    );
  }

  const tempDir = await fsp.mkdtemp(
    path.join(os.tmpdir(), "civicpath-office-")
  );

  const inputPath = path.join(
    tempDir,
    `source${extension || ".docx"}`
  );

  try {
    await fsp.writeFile(inputPath, buffer);

    const spreadsheet = [
      ".xls",
      ".xlsx",
      ".ods",
    ].includes(
      String(extension || "").toLowerCase()
    );

    const outputExtension = spreadsheet
      ? ".csv"
      : ".txt";

    const conversionFormat = spreadsheet
      ? "csv"
      : "txt:Text";

    await runCommand(
      "libreoffice",
      [
        `-env:UserInstallation=file://${path.join(
          tempDir,
          "lo-profile"
        )}`,
        "--headless",
        "--convert-to",
        conversionFormat,
        "--outdir",
        tempDir,
        inputPath,
      ],
      {
        timeout: OFFICE_TIMEOUT_MS,
        maxBuffer: MAX_BYTES,
      }
    );

    const outputPath = path.join(
      tempDir,
      `source${outputExtension}`
    );

    return normalizeText(
      await fsp.readFile(
        outputPath,
        "utf8"
      )
    );
  } finally {
    await fsp.rm(tempDir, {
      recursive: true,
      force: true,
    });
  }
}

async function parseResource(resource) {
  const format = detectFormat(resource);

  if (format === "pdf") {
    const parsedPdf =
      await extractPdfDocument(
        resource.buffer
      );

    let extractedText = parsedPdf.text;
    let pages = parsedPdf.pages;
    let extractionMethod = "pdf-parse";

    if (
      !assessContentQuality(
        extractedText
      ).usable &&
      ENABLE_LOCAL_OCR
    ) {
      try {
        const ocrText =
          await extractScannedPdfText(
            resource.buffer
          );

        if (ocrText.length > extractedText.length) {
          extractedText = ocrText;

          pages = [
            {
              pageNumber: 1,
              text: ocrText,
              ocr: true,
            },
          ];

          extractionMethod = "pdf-ocr";
        }
      } catch (err) {
        if (!extractedText) {
          throw err;
        }

        logger.warn(
          "PDF OCR fallback unavailable; retaining parser text",
          {
            error: err.message,
          }
        );
      }
    }

    return {
      documentType: "pdf",
      extractedText,
      pages,
      extractionMethod,
      alternateUrls: [],
    };
  }

  if (format === "html") {
    const html =
      resource.buffer.toString(
        "utf-8"
      );

    const text =
      extractHtmlText(html);

    return {
      documentType: "html",
      extractedText: text,
      pages: [
        {
          pageNumber: 1,
          text,
        },
      ],
      extractionMethod: "cheerio",
      alternateUrls:
        discoverAlternateLinks(
          html,
          resource.finalUrl
        ),
    };
  }

  if (format === "text") {
    const text = normalizeText(
      resource.buffer.toString("utf8")
    );

    return {
      documentType: "other",
      extractedText: text,
      pages: [
        {
          pageNumber: 1,
          text,
        },
      ],
      extractionMethod: "plain-text",
      alternateUrls: [],
    };
  }

  if (format === "image") {
    const text =
      await extractImageText(
        resource.buffer,
        extensionForUrl(
          resource.finalUrl
        ) || ".png"
      );

    return {
      documentType: "other",
      extractedText: text,
      pages: [
        {
          pageNumber: 1,
          text,
          ocr: true,
        },
      ],
      extractionMethod: "image-ocr",
      alternateUrls: [],
    };
  }

  if (format === "office") {
    const text =
      await extractOfficeText(
        resource.buffer,
        extensionForUrl(
          resource.finalUrl
        )
      );

    return {
      documentType: "other",
      extractedText: text,
      pages: [
        {
          pageNumber: 1,
          text,
        },
      ],
      extractionMethod: "libreoffice",
      alternateUrls: [],
    };
  }

  throw makeError(
    "SOURCE_PARSE_FAILED",
    `Unsupported content type: ${
      resource.contentType || "unknown"
    }`
  );
}

async function fetchAndExtract(
  url,
  allowedDomains = []
) {
  const visited = new Set();
  const attempts = [];

  const queue = [
    {
      url,
      method: "http",
    },
  ];

  while (
    queue.length &&
    attempts.length <= MAX_ALTERNATES + 1
  ) {
    const current = queue.shift();

    if (visited.has(current.url)) {
      continue;
    }

    visited.add(current.url);

    try {
      const resource =
        await fetchResource(
          current.url,
          allowedDomains,
          visited
        );

      const parsed =
        await parseResource(resource);

      parsed.chunks = chunkPages(
        parsed.pages || [
          {
            pageNumber: 1,
            text: parsed.extractedText,
          },
        ]
      );

      const quality =
        assessContentQuality(
          parsed.extractedText,
          resource
        );

      attempts.push({
        url: current.url,
        method: current.method,
        quality,
      });

      if (quality.usable) {
        const extractedText =
          normalizeText(
            parsed.extractedText
          );

        return {
          documentType:
            parsed.documentType,
          extractedText,
          contentHash:
            crypto
              .createHash("sha256")
              .update(extractedText)
              .digest("hex"),
          finalUrl:
            resource.finalUrl,
          retrievalMethod:
            current.method,
          extractionMethod:
            parsed.extractionMethod,
          pages: parsed.pages,
          chunks: parsed.chunks,
          quality,
          attemptedUrls:
            attempts,
          alternateUrls:
            parsed.alternateUrls,
        };
      }

      if (current.method === "http") {
        for (const alternateUrl of
          parsed.alternateUrls || []) {
          try {
            await assertSafeUrl(
              alternateUrl,
              allowedDomains
            );

            if (
              !visited.has(
                alternateUrl
              )
            ) {
              queue.push({
                url: alternateUrl,
                method:
                  "alternate_document",
              });
            }
          } catch {
            // Ignore unsafe alternate links.
          }
        }
      }
    } catch (err) {
      attempts.push({
        url: current.url,
        method: current.method,
        error: err.message,
      });
    }
  }

  /*
   * Browser fallback.
   */
  if (ENABLE_BROWSER_FALLBACK) {
    try {
      const rendered =
        await extractWithBrowser(
          url,
          allowedDomains
        );

      if (rendered) {
        const quality =
          assessBrowserContentQuality(
            rendered.extractedText
          );

        logger.info(
          "Browser source extraction completed",
          {
            url,
            quality,
          }
        );

        if (quality.usable) {
          const extractedText =
            normalizeText(
              rendered.extractedText
            );

          const pages =
            rendered.pages || [
              {
                pageNumber: 1,
                text: extractedText,
              },
            ];

          return {
            ...rendered,
            extractedText,
            contentHash:
              crypto
                .createHash("sha256")
                .update(extractedText)
                .digest("hex"),
            pages,
            chunks:
              chunkPages(pages),
            quality,
            attemptedUrls:
              attempts,
            alternateUrls: [],
          };
        }

        attempts.push({
          url,
          method: "browser",
          quality,
        });
      }
    } catch (err) {
      attempts.push({
        url,
        method: "browser",
        error: err.message,
      });

      logger.warn(
        "Browser source fallback failed",
        {
          url,
          error: err.message,
        }
      );
    }
  }

  if (
    ENABLE_FILESTACK_FALLBACK &&
    process.env.FILESTACK_API_KEY
  ) {
    try {
      const converted =
        await fileStackService.convertUrlToText(
          url,
          {
            format:
              process.env
                .FILESTACK_OUTPUT_FORMAT ||
              "txt",
          }
        );

      const quality =
        assessContentQuality(
          converted.extractedText
        );

      attempts.push({
        url,
        method: "filestack",
        quality,
      });

      if (quality.usable) {
        const extractedText =
          normalizeText(
            converted.extractedText
          );

        const pages = [
          {
            pageNumber: 1,
            text: extractedText,
          },
        ];

        return {
          documentType: "other",
          extractedText,
          contentHash:
            crypto
              .createHash("sha256")
              .update(extractedText)
              .digest("hex"),
          finalUrl:
            converted.conversionUrl,
          retrievalMethod:
            "filestack",
          extractionMethod:
            "filestack-output",
          pages,
          chunks:
            chunkPages(pages),
          quality,
          attemptedUrls:
            attempts,
          alternateUrls: [],
        };
      }
    } catch (err) {
      attempts.push({
        url,
        method: "filestack",
        error: err.message,
      });

      logger.warn(
        "FileStack source fallback failed",
        {
          url,
          error: err.message,
        }
      );
    }
  }

  const reason = attempts
    .flatMap(
      (a) =>
        a.quality?.reasons || []
    )
    .filter(Boolean);

  throw makeError(
    "SOURCE_CONTENT_UNUSABLE",
    "Source contained no reliable readable civic content",
    {
      attemptedUrls: attempts,
      reasons: [
        ...new Set(reason),
      ],
      browserFallbackEnabled:
        ENABLE_BROWSER_FALLBACK,
      fileStackFallbackEnabled:
        ENABLE_FILESTACK_FALLBACK,
    }
  );
}

async function extractPdfDocument(
  buffer
) {
  let pdfParse;

  try {
    pdfParse =
      require("pdf-parse");
  } catch {
    throw makeError(
      "SOURCE_PARSE_FAILED",
      "PDF extraction requested but 'pdf-parse' is not installed"
    );
  }

  if (
    typeof pdfParse ===
    "function"
  ) {
    const data =
      await pdfParse(buffer);

    const text =
      normalizeText(data.text);

    return {
      text,
      pages: [
        {
          pageNumber: 1,
          text,
        },
      ],
    };
  }

  if (pdfParse.PDFParse) {
    const parser =
      new pdfParse.PDFParse({
        data: buffer,
      });

    try {
      const data =
        await parser.getText();

      const pages =
        Array.isArray(data.pages)
          ? data.pages.map(
              (page, index) => ({
                pageNumber:
                  page.num ||
                  index + 1,
                text:
                  normalizeText(
                    page.text
                  ),
              })
            )
          : [
              {
                pageNumber: 1,
                text: normalizeText(
                  data.text
                ),
              },
            ];

      const text =
        normalizeText(
          data.text ||
            pages
              .map(
                (page) =>
                  page.text
              )
              .join(" ")
        );

      return {
        text,
        pages,
      };
    } finally {
      await parser.destroy();
    }
  }

  throw makeError(
    "SOURCE_PARSE_FAILED",
    "Unsupported pdf-parse API"
  );
}

async function extractPdfText(
  buffer
) {
  const document =
    await extractPdfDocument(
      buffer
    );

  return document.text;
}

module.exports = {
  fetchAndExtract,
  extractHtmlText,
  assessContentQuality,
  assessBrowserContentQuality,
  discoverAlternateLinks,
  extractPdfText,
  extractPdfDocument,
  extractImageText,
  extractScannedPdfText,
  extractOfficeText,
  detectFormat,
  PLACEHOLDER_PATTERNS,
};
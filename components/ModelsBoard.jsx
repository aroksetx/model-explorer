"use client";

import { useEffect, useMemo, useState } from "react";
import PixelLoaderGame from "./PixelLoaderGame";

const PAGE_SIZE = 120;
const COMPARE_LIMIT = 4;

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatInteger(value) {
  return typeof value === "number" ? value.toLocaleString("en-US") : "-";
}

function formatCost(value) {
  if (typeof value !== "number") {
    return "-";
  }
  if (value === 0) {
    return "free";
  }
  const fractionDigits = value < 0.01 ? 4 : value < 1 ? 3 : 2;
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: fractionDigits })}`;
}

function toolResult(payload) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function normalizeLimit(limit) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed)) {
    return 20;
  }
  return Math.max(1, Math.min(100, Math.floor(parsed)));
}

function compactRow(row) {
  return {
    providerId: row.providerId,
    providerName: row.providerName,
    modelId: row.modelId,
    family: row.family,
    modalities: row.modalitiesLabel,
    contextLimit: row.contextLimit,
    outputLimit: row.outputLimit,
    reasoning: row.reasoning,
    inputCost: row.costInput,
    outputCost: row.costOutput,
  };
}

function modelRowKey(row) {
  return `${row.providerId}:${row.modelId}`;
}

function normalizeRegistry(payload) {
  const rows = [];
  const providers = Object.entries(payload ?? {});

  for (const [providerKey, providerData] of providers) {
    const provider = providerData && typeof providerData === "object" ? providerData : {};
    const providerId = provider.id || providerKey;
    const providerName = provider.name || providerId;
    const models = Object.entries(provider.models ?? {});

    for (const [modelKey, modelData] of models) {
      const model = modelData && typeof modelData === "object" ? modelData : {};
      const modelId = model.id || modelKey;
      const modelName = model.name || modelId;
      const family = model.family || "-";
      const inputModalities = toArray(model.modalities?.input);
      const outputModalities = toArray(model.modalities?.output);
      const modalitiesLabel = `${inputModalities.join("+") || "-"} -> ${outputModalities.join("+") || "-"}`;

      rows.push({
        providerId,
        providerName,
        modelId,
        modelName,
        family,
        modalitiesLabel,
        contextLimit: toNumber(model.limit?.context),
        outputLimit: toNumber(model.limit?.output),
        reasoning: Boolean(model.reasoning),
        multimodal: inputModalities.some((item) => item !== "text"),
        costInput: toNumber(model.cost?.input),
        costOutput: toNumber(model.cost?.output),
        queryBlob: `${providerName} ${providerId} ${modelId} ${modelName} ${family} ${modalitiesLabel}`
          .toLowerCase()
          .trim(),
      });
    }
  }

  return rows.sort((left, right) => {
    const providerSort = left.providerName.localeCompare(right.providerName);
    if (providerSort !== 0) {
      return providerSort;
    }
    return left.modelId.localeCompare(right.modelId);
  });
}

export default function ModelsBoard() {
  const [allRows, setAllRows] = useState([]);
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [webMcpEnabled, setWebMcpEnabled] = useState(false);
  const [selectedModelKeys, setSelectedModelKeys] = useState([]);
  const [compareNotice, setCompareNotice] = useState("");

  const providerOptions = useMemo(() => {
    const uniqueProviders = new Set(allRows.map((row) => row.providerId));
    return Array.from(uniqueProviders).sort((left, right) => left.localeCompare(right));
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allRows.filter((row) => {
      if (provider !== "all" && row.providerId !== provider) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return row.queryBlob.includes(normalizedQuery);
    });
  }, [allRows, provider, query]);

  const visibleRows = useMemo(
    () => filteredRows.slice(0, Math.min(visibleCount, filteredRows.length)),
    [filteredRows, visibleCount],
  );

  const rowLookup = useMemo(() => {
    const map = new Map();
    for (const row of allRows) {
      map.set(modelRowKey(row), row);
    }
    return map;
  }, [allRows]);

  const selectedRows = useMemo(
    () => selectedModelKeys.map((key) => rowLookup.get(key)).filter(Boolean),
    [selectedModelKeys, rowLookup],
  );

  const selectedKeySet = useMemo(() => new Set(selectedModelKeys), [selectedModelKeys]);

  const bestInputCost = useMemo(() => {
    const numericCosts = selectedRows
      .map((row) => row.costInput)
      .filter((value) => typeof value === "number");
    return numericCosts.length > 0 ? Math.min(...numericCosts) : null;
  }, [selectedRows]);

  const bestOutputCost = useMemo(() => {
    const numericCosts = selectedRows
      .map((row) => row.costOutput)
      .filter((value) => typeof value === "number");
    return numericCosts.length > 0 ? Math.min(...numericCosts) : null;
  }, [selectedRows]);

  const stats = useMemo(() => {
    const totalProviders = new Set(allRows.map((row) => row.providerId)).size;
    const matchedProviders = new Set(filteredRows.map((row) => row.providerId)).size;
    const totalModels = allRows.length;
    const matchedModels = filteredRows.length;
    const reasoningModels = filteredRows.filter((row) => row.reasoning).length;
    const multimodalModels = filteredRows.filter((row) => row.multimodal).length;
    const reasoningPercent = matchedModels === 0 ? 0 : Math.round((reasoningModels / matchedModels) * 100);

    return [
      {
        label: "Providers (Matched / Total)",
        value: `${matchedProviders.toLocaleString("en-US")} / ${totalProviders.toLocaleString("en-US")}`,
      },
      {
        label: "Models (Matched / Total)",
        value: `${matchedModels.toLocaleString("en-US")} / ${totalModels.toLocaleString("en-US")}`,
      },
      {
        label: "Reasoning Models",
        value: `${reasoningPercent}%`,
      },
      {
        label: "Multimodal Models",
        value: multimodalModels.toLocaleString("en-US"),
      },
    ];
  }, [allRows, filteredRows]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, provider]);

  useEffect(() => {
    const availableKeys = new Set(allRows.map((row) => modelRowKey(row)));
    setSelectedModelKeys((prev) => {
      const next = prev.filter((key) => availableKeys.has(key));
      return next.length === prev.length ? prev : next;
    });
  }, [allRows]);

  useEffect(() => {
    if (!compareNotice) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      setCompareNotice("");
    }, 2400);
    return () => window.clearTimeout(timeoutId);
  }, [compareNotice]);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/models", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }

        if (!alive) {
          return;
        }

        const normalizedRows = normalizeRegistry(payload);
        setAllRows(normalizedRows);
        setUpdatedAt(new Date().toLocaleString());
      } catch (loadError) {
        if (!alive) {
          return;
        }
        const message = loadError instanceof Error ? loadError.message : String(loadError);
        setError(message);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setWebMcpEnabled(false);
      return undefined;
    }

    const modelContext = window.navigator?.modelContext;
    if (!modelContext) {
      setWebMcpEnabled(false);
      return undefined;
    }
    setWebMcpEnabled(true);

    const findMatches = (rawQuery = "", rawProvider = "all") => {
      const normalizedQuery = typeof rawQuery === "string" ? rawQuery.trim().toLowerCase() : "";
      const normalizedProvider = typeof rawProvider === "string" ? rawProvider : "all";

      return allRows.filter((row) => {
        if (normalizedProvider !== "all" && row.providerId !== normalizedProvider) {
          return false;
        }
        if (!normalizedQuery) {
          return true;
        }
        return row.queryBlob.includes(normalizedQuery);
      });
    };

    const tools = [
      {
        name: "get_registry_status",
        description:
          "Get current models registry status including sync state, model counts, and active dashboard filters.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: async () => {
          const providerCount = new Set(allRows.map((row) => row.providerId)).size;
          return toolResult({
            status: "ok",
            loading,
            error: error || null,
            totalModels: allRows.length,
            totalProviders: providerCount,
            activeQuery: query,
            activeProvider: provider,
            updatedAt: updatedAt || null,
          });
        },
      },
      {
        name: "search_models",
        description: "Search models in the loaded registry by query and provider, then return matching rows.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Free text search against provider, model id, family, and modalities.",
            },
            providerId: {
              type: "string",
              description: "Provider id or 'all'.",
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              description: "Maximum number of rows to return.",
            },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: async (input = {}) => {
          const matches = findMatches(input.query, input.providerId ?? "all");
          const limit = normalizeLimit(input.limit);
          return toolResult({
            status: "ok",
            totalMatches: matches.length,
            rows: matches.slice(0, limit).map(compactRow),
          });
        },
      },
      {
        name: "get_model_details",
        description: "Return detailed metadata for a single model id, with optional provider id filter.",
        inputSchema: {
          type: "object",
          properties: {
            modelId: {
              type: "string",
              description: "Model id to find, for example 'gpt-4.1' or 'claude-sonnet-4'.",
            },
            providerId: {
              type: "string",
              description: "Optional provider id.",
            },
          },
          required: ["modelId"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: async (input = {}) => {
          const providerFilter = typeof input.providerId === "string" ? input.providerId : null;
          const normalizedModelId = typeof input.modelId === "string" ? input.modelId.trim() : "";
          const match = allRows.find((row) => {
            if (providerFilter && row.providerId !== providerFilter) {
              return false;
            }
            return row.modelId === normalizedModelId;
          });

          if (!match) {
            return toolResult({
              status: "not_found",
              message: "No model found for the requested input.",
              modelId: normalizedModelId,
              providerId: providerFilter,
            });
          }

          return toolResult({
            status: "ok",
            model: compactRow(match),
          });
        },
      },
      {
        name: "set_dashboard_filters",
        description: "Update the dashboard search query and provider filters visible in the UI.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
            },
            providerId: {
              type: "string",
            },
          },
          additionalProperties: false,
        },
        execute: async (input = {}) => {
          const nextQuery = typeof input.query === "string" ? input.query : "";
          const nextProvider = typeof input.providerId === "string" ? input.providerId : "all";
          const safeProvider =
            nextProvider === "all" || providerOptions.includes(nextProvider) ? nextProvider : "all";

          setQuery(nextQuery);
          setProvider(safeProvider);

          return toolResult({
            status: "ok",
            appliedQuery: nextQuery,
            appliedProvider: safeProvider,
          });
        },
      },
      {
        name: "refresh_registry",
        description: "Reload the page and fetch the latest models registry snapshot.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: async () => {
          window.location.reload();
          return toolResult({
            status: "ok",
            message: "Reloading dashboard now.",
          });
        },
      },
    ];

    try {
      if (typeof modelContext.provideContext === "function") {
        modelContext.provideContext({ tools });
      } else if (typeof modelContext.registerTool === "function") {
        if (typeof modelContext.clearContext === "function") {
          modelContext.clearContext();
        }
        for (const tool of tools) {
          modelContext.registerTool(tool);
        }
      }
    } catch (registrationError) {
      console.error("WebMCP tool registration failed", registrationError);
    }

    return () => {
      try {
        if (typeof modelContext.clearContext === "function") {
          modelContext.clearContext();
        } else if (typeof modelContext.unregisterTool === "function") {
          for (const tool of tools) {
            modelContext.unregisterTool(tool.name);
          }
        }
      } catch (cleanupError) {
        console.error("WebMCP cleanup failed", cleanupError);
      }
    };
  }, [allRows, error, loading, provider, providerOptions, query, updatedAt]);

  const shownCount = visibleRows.length;
  const totalMatches = filteredRows.length;
  const hasMoreRows = shownCount < totalMatches;
  const remaining = totalMatches - shownCount;
  const increment = Math.min(PAGE_SIZE, remaining);
  const canHighlightBestPrice = selectedRows.length > 1;

  function toggleCompareModel(row) {
    const key = modelRowKey(row);
    setSelectedModelKeys((previousKeys) => {
      if (previousKeys.includes(key)) {
        return previousKeys.filter((item) => item !== key);
      }
      if (previousKeys.length >= COMPARE_LIMIT) {
        setCompareNotice(`Compare up to ${COMPARE_LIMIT} models at once.`);
        return previousKeys;
      }
      return [...previousKeys, key];
    });
  }

  function clearCompare() {
    setSelectedModelKeys([]);
    setCompareNotice("");
  }

  return (
    <main className="shell">
      <header className="hero panel">
        <div className="brand">
          <p className="eyebrow">Live AI Model Registry</p>
          <h1>MODELS.DEV API EXPLORER</h1>
          <p>
            Search providers, model families, limits, reasoning support, and token pricing from{" "}
            <code>models.dev/api.json</code> in one live dashboard.
          </p>
          <div className="hero-flags">
            <span className={loading ? "flag status-loading" : "flag status-live"}>
              {loading ? "Syncing feed" : "Feed live"}
            </span>
            <span className="flag">{allRows.length.toLocaleString("en-US")} models tracked</span>
            <span className={webMcpEnabled ? "flag status-mcp-on" : "flag status-mcp-off"}>
              {webMcpEnabled ? "WebMCP EPP ready" : "WebMCP not detected"}
            </span>
          </div>
        </div>

        <div className="top-actions">
          <a href="https://models.dev/" target="_blank" rel="noreferrer">
            Reference
          </a>
          <a href="https://github.com/anomalyco/models.dev" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="accent" href="https://models.dev/api.json" target="_blank" rel="noreferrer">
            Raw API
          </a>
        </div>
      </header>

      <section className="ticker panel" aria-hidden="true">
        <p className="ticker-track">
          <span>
            LIVE AI MODEL REGISTRY • EXPLORE PROVIDERS + FAMILIES • COMPARE CONTEXT, OUTPUT, REASONING, COST •
            POWERED BY MODELS.DEV API
          </span>
          <span>
            LIVE AI MODEL REGISTRY • EXPLORE PROVIDERS + FAMILIES • COMPARE CONTEXT, OUTPUT, REASONING, COST •
            POWERED BY MODELS.DEV API
          </span>
        </p>
      </section>

      <form
        className="controls panel"
        toolname="set_dashboard_filters"
        tooldescription="Set dashboard query and provider filters for model exploration."
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="field">
          <span>Search</span>
          <input
            type="search"
            name="query"
            placeholder="provider, model id, family, capability..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Provider</span>
          <select name="providerId" value={provider} onChange={(event) => setProvider(event.target.value)}>
            <option value="all">All providers</option>
            {providerOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button className="sr-only" type="submit">
          Apply filters
        </button>
      </form>

      <section className="stats" aria-live="polite">
        {stats.map((stat) => (
          <article key={stat.label} className="stat panel">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="compare-shell panel" aria-live="polite">
        {selectedRows.length === 0 ? (
          <div className="compare-cta">
            <p className="compare-cta-kicker">Model Compare</p>
            <p className="compare-cta-title">
              Select up to {COMPARE_LIMIT} models to compare their main specs.
            </p>
            <p className="compare-cta-copy">
              Use the <code>Pick</code> checkbox in the table to build a side-by-side view for limits, reasoning, and
              pricing.
            </p>
            <a className="compare-cta-action" href="#models-table">
              Start Selecting Models
            </a>
          </div>
        ) : (
          <>
            <div className="compare-meta">
              <p>{`${selectedRows.length} model${selectedRows.length > 1 ? "s" : ""} selected for comparison`}</p>
              <button type="button" onClick={clearCompare}>
                Clear Compare
              </button>
            </div>

            {compareNotice && <p className="compare-notice">{compareNotice}</p>}

            <div className="compare-grid">
              {selectedRows.map((row) => (
                <article key={modelRowKey(row)} className="compare-card">
                  <p className="compare-provider">{row.providerName}</p>
                  <p className="compare-model">
                    <code>{row.modelId}</code>
                  </p>

                  <dl>
                    <div>
                      <dt>Family</dt>
                      <dd>
                        <code>{row.family}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Modalities</dt>
                      <dd>
                        <code>{row.modalitiesLabel}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Context</dt>
                      <dd>{formatInteger(row.contextLimit)}</dd>
                    </div>
                    <div>
                      <dt>Output</dt>
                      <dd>{formatInteger(row.outputLimit)}</dd>
                    </div>
                    <div>
                      <dt>Reasoning</dt>
                      <dd className={row.reasoning ? "status-true" : "status-false"}>{row.reasoning ? "yes" : "no"}</dd>
                    </div>
                    <div>
                      <dt>Input Cost</dt>
                      <dd
                        className={
                          canHighlightBestPrice &&
                          typeof row.costInput === "number" &&
                          row.costInput === bestInputCost
                            ? "compare-best"
                            : undefined
                        }
                      >
                        {formatCost(row.costInput)}
                      </dd>
                    </div>
                    <div>
                      <dt>Output Cost</dt>
                      <dd
                        className={
                          canHighlightBestPrice &&
                          typeof row.costOutput === "number" &&
                          row.costOutput === bestOutputCost
                            ? "compare-best"
                            : undefined
                        }
                      >
                        {formatCost(row.costOutput)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section id="models-table" className="table-shell panel" aria-live="polite">
        <div className="table-meta">
          <p className="table-meta-copy">
            {loading
              ? "Loading model registry..."
              : `${totalMatches.toLocaleString("en-US")} matching models • ${selectedRows.length.toLocaleString("en-US")} selected for compare`}
          </p>
          <button
            type="button"
            toolname="refresh_registry"
            tooldescription="Reload the dashboard and fetch the latest models.dev registry snapshot."
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>

        <div className={`table-wrap${loading ? " table-wrap-loading" : ""}`}>
          {loading ? (
            <PixelLoaderGame />
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="pick-col">Pick</th>
                  <th>Provider</th>
                  <th>Model</th>
                  <th>Family</th>
                  <th>Modalities</th>
                  <th>Context</th>
                  <th>Output</th>
                  <th>Reasoning</th>
                  <th>Input Cost</th>
                  <th>Output Cost</th>
                </tr>
              </thead>
              <tbody>
                {error && (
                  <tr>
                    <td colSpan={10} className="placeholder">
                      Unable to load models data: {error}
                    </td>
                  </tr>
                )}

                {!error && visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="placeholder">
                      No models match this filter.
                    </td>
                  </tr>
                )}

                {!error &&
                  visibleRows.map((row) => {
                    const key = modelRowKey(row);
                    return (
                      <tr key={key}>
                        <td className="pick-cell">
                          <input
                            className="pick-toggle"
                            type="checkbox"
                            checked={selectedKeySet.has(key)}
                            onChange={() => toggleCompareModel(row)}
                            aria-label={`Select ${row.modelId} from ${row.providerName} for comparison`}
                          />
                        </td>
                        <td className="provider">{row.providerName}</td>
                        <td className="model">
                          <code>{row.modelId}</code>
                        </td>
                        <td className="family">
                          <code>{row.family}</code>
                        </td>
                        <td>
                          <code>{row.modalitiesLabel}</code>
                        </td>
                        <td className="num">{formatInteger(row.contextLimit)}</td>
                        <td className="num">{formatInteger(row.outputLimit)}</td>
                        <td className={row.reasoning ? "status-true" : "status-false"}>
                          {row.reasoning ? "yes" : "no"}
                        </td>
                        <td className="num">{formatCost(row.costInput)}</td>
                        <td className="num">{formatCost(row.costOutput)}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>

        <footer className="table-footer">
          <p>
            {loading
              ? "Syncing data from models.dev/api.json..."
              : `${shownCount.toLocaleString("en-US")} shown of ${totalMatches.toLocaleString("en-US")} matches (${allRows.length.toLocaleString("en-US")} total)${updatedAt ? ` | Updated ${updatedAt}` : ""}`}
          </p>

          {(hasMoreRows || selectedRows.length > 0) && (
            <div className="footer-actions">
              {selectedRows.length > 0 && (
                <button type="button" onClick={clearCompare}>
                  Clear Compare ({selectedRows.length.toLocaleString("en-US")})
                </button>
              )}
              {hasMoreRows && (
                <button type="button" onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}>
                  Load More (+{increment.toLocaleString("en-US")})
                </button>
              )}
            </div>
          )}
        </footer>
      </section>

      <footer className="site-footer">
        <p>
          by{" "}
          <a href="https://stanislav.black/" target="_blank" rel="noreferrer">
            stanislav.black
          </a>
        </p>
      </footer>
    </main>
  );
}

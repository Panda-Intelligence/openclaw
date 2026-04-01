import type { IncomingMessage } from "node:http";
import { beforeEach, describe, expect, it, vi } from "vitest";

const loadConfigMock = vi.fn();
const loadGatewayModelCatalogMock = vi.fn();

vi.mock("../config/config.js", () => ({
  loadConfig: loadConfigMock,
}));

vi.mock("./server-model-catalog.js", () => ({
  loadGatewayModelCatalog: loadGatewayModelCatalogMock,
}));

function createReq(headers: Record<string, string> = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

describe("resolveOpenAiCompatModelOverride", () => {
  beforeEach(() => {
    loadConfigMock.mockReset();
    loadGatewayModelCatalogMock.mockReset();
    loadConfigMock.mockReturnValue({
      agents: {
        defaults: {
          model: { primary: "openrouter/@preset/free-chat" },
          models: {
            "openrouter/@preset/free-chat": {},
            "openai/text-embedding-3-small": {},
          },
        },
      },
    });
    loadGatewayModelCatalogMock.mockResolvedValue([
      {
        provider: "openrouter",
        id: "@preset/free-chat",
        name: "Free Chat",
      },
      {
        provider: "openai",
        id: "text-embedding-3-small",
        name: "text-embedding-3-small",
      },
    ]);
  });

  it("keeps standard openclaw routing requests untouched", async () => {
    const { resolveOpenAiCompatModelOverride } = await import("./http-utils.js");

    await expect(
      resolveOpenAiCompatModelOverride({
        req: createReq(),
        agentId: "main",
        model: "openclaw/default",
      }),
    ).resolves.toEqual({});
  });

  it("treats provider or preset model ids as request-level overrides", async () => {
    const { resolveOpenAiCompatModelOverride } = await import("./http-utils.js");

    await expect(
      resolveOpenAiCompatModelOverride({
        req: createReq(),
        agentId: "main",
        model: "openrouter/@preset/free-chat",
      }),
    ).resolves.toEqual({
      modelOverride: "openrouter/@preset/free-chat",
    });
  });

  it("lets x-openclaw-model take precedence over the request model", async () => {
    const { resolveOpenAiCompatModelOverride } = await import("./http-utils.js");

    await expect(
      resolveOpenAiCompatModelOverride({
        req: createReq({ "x-openclaw-model": "openai/text-embedding-3-small" }),
        agentId: "main",
        model: "openrouter/@preset/free-chat",
      }),
    ).resolves.toEqual({
      modelOverride: "openai/text-embedding-3-small",
    });
  });
});

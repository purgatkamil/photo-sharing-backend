import { jest } from "@jest/globals";
import path from "path";

const mkdirSyncMock = jest.fn();

await jest.unstable_mockModule("fs", () => ({
  default: { mkdirSync: mkdirSyncMock },
}));

const storage = await import("../../src/services/storage.js");
const {
  ensureDir,
  tokenDir,
  tokenThumbDir,
  buildOriginalUrl,
  buildThumbUrl,
  initStorage,
  DATA_DIR,
  THUMBS_DIR,
} = storage as typeof import("../../src/services/storage.js");

describe("services/storage", () => {
  beforeEach(() => {
    mkdirSyncMock.mockClear();
  });

  it("ensureDir wywołuje fs.mkdirSync z recursive", () => {
    ensureDir("/tmp/testdir");
    expect(mkdirSyncMock).toHaveBeenCalledWith("/tmp/testdir", { recursive: true });
  });

  it("tokenDir zwraca ścieżkę do katalogu stołu", () => {
    expect(tokenDir("table-1")).toBe(path.join(DATA_DIR, "table-1"));
  });

  it("tokenThumbDir zwraca ścieżkę do katalogu miniaturek", () => {
    expect(tokenThumbDir("table-1")).toBe(path.join(THUMBS_DIR, "table-1"));
  });

  it("initStorage tworzy katalogi bazowe", () => {
    initStorage();
    expect(mkdirSyncMock).toHaveBeenCalledWith(DATA_DIR, { recursive: true });
    expect(mkdirSyncMock).toHaveBeenCalledWith(THUMBS_DIR, { recursive: true });
  });

  it("buildOriginalUrl zwraca poprawny URL", () => {
    expect(buildOriginalUrl("table-1", "a.jpg")).toBe("/images/table-1/a.jpg");
  });

  it("buildThumbUrl zwraca poprawny URL", () => {
    expect(buildThumbUrl("table-1", "a.jpg")).toBe("/thumbs/table-1/a.jpg");
  });
});

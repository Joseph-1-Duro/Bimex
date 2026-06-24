import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConectarWallet from "../components/ConectarWallet.jsx";

const mockDetectInstalledAdapters = vi.fn();
const mockSetCurrentAdapter = vi.fn();
const mockLoadPersistedAdapter = vi.fn();
const mockGetAvailableAdapters = vi.fn(() => [
  { id: "freighter", name: "Freighter", icon: null, walletUrl: "https://freighter.app" },
  { id: "xbull", name: "xBull", icon: null, walletUrl: "https://xbull.app" },
  { id: "lobstr", name: "Lobstr", icon: null, walletUrl: "https://lobstr.co" },
]);

vi.mock("../wallet/walletAdapter.js", () => ({
  detectInstalledAdapters: (...args) => mockDetectInstalledAdapters(...args),
  setCurrentAdapter: (...args) => mockSetCurrentAdapter(...args),
  loadPersistedAdapter: (...args) => mockLoadPersistedAdapter(...args),
  clearAdapter: vi.fn(),
  getAdapter: vi.fn(),
  getAvailableAdapters: (...args) => mockGetAvailableAdapters(...args),
}));

vi.mock("../stellar/contrato", () => ({
  CONFIG: {
    NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
  },
}));

const mockAdapter = {
  id: "freighter",
  name: "Freighter",
  isInstalled: vi.fn(),
  isConnected: vi.fn(),
  isAllowed: vi.fn(),
  requestAccess: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAdapter.isInstalled.mockResolvedValue(true);
  mockAdapter.isConnected.mockResolvedValue(false);
  mockAdapter.isAllowed.mockResolvedValue(false);
  mockAdapter.requestAccess.mockResolvedValue(undefined);
  mockAdapter.getNetwork.mockResolvedValue("Test SDF Network ; September 2015");
  mockAdapter.getAddress.mockResolvedValue("");
});

afterEach(() => {
  cleanup();
});

describe("ConectarWallet", () => {
  it("muestra el botón de conexión cuando no hay wallet conectada", () => {
    render(<ConectarWallet autoConectar={false} />);

    expect(screen.getByRole("button", { name: "Conectar Wallet" })).toBeInTheDocument();
  });

  it("muestra la dirección truncada cuando ya existe una sesión autorizada", async () => {
    const address = "GABC1234567890WXYZ";
    const onConectado = vi.fn();
    mockLoadPersistedAdapter.mockReturnValue(mockAdapter);
    mockAdapter.isAllowed.mockResolvedValue(true);
    mockAdapter.getAddress.mockResolvedValue(address);

    render(<ConectarWallet onConectado={onConectado} />);

    expect(await screen.findByText("GABC…WXYZ")).toBeInTheDocument();
    expect(onConectado).toHaveBeenCalledWith(address);
  });

  it("auto-conecta cuando solo una wallet está instalada", async () => {
    const address = "GDEF1234567890QRST";
    const onConectado = vi.fn();
    mockDetectInstalledAdapters.mockResolvedValue([{ id: "freighter", name: "Freighter", icon: null }]);
    mockSetCurrentAdapter.mockReturnValue(mockAdapter);
    mockAdapter.requestAccess.mockResolvedValue(undefined);
    mockAdapter.getNetwork.mockResolvedValue("Test SDF Network ; September 2015");
    mockAdapter.getAddress.mockResolvedValue(address);

    render(<ConectarWallet autoConectar={false} onConectado={onConectado} />);

    await userEvent.click(screen.getByRole("button", { name: "Conectar Wallet" }));

    await waitFor(() => {
      expect(onConectado).toHaveBeenCalledWith(address);
    });
    expect(screen.getByText("GDEF…QRST")).toBeInTheDocument();
  });
});

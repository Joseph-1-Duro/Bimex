import { getStorage } from "../utils/storage.js";
import * as freighterAdapter from "./adapters/freighter.js";
import * as xbullAdapter from "./adapters/xbull.js";
import * as lobstrAdapter from "./adapters/lobstr.js";

const ADAPTERS = [freighterAdapter, xbullAdapter, lobstrAdapter];
const KEY_WALLET_TYPE = "bimex.wallet.type";
const storage = getStorage("local");

let _currentAdapter = null;

export const WALLET_IDS = {
  FREIGHTER: "freighter",
  XBULL: "xbull",
  LOBSTR: "lobstr",
};

export function getAvailableAdapters() {
  return ADAPTERS.map((a) => ({
    id: a.id,
    name: a.name,
    icon: a.icon,
    walletUrl: a.WALLET_URL,
  }));
}

export function getAdapter(id) {
  return ADAPTERS.find((a) => a.id === id) ?? null;
}

export function getCurrentAdapter() {
  return _currentAdapter;
}

export function setCurrentAdapter(id) {
  const adapter = getAdapter(id);
  if (!adapter) throw new Error(`Wallet adapter "${id}" not found`);
  _currentAdapter = adapter;
  storage.setItem(KEY_WALLET_TYPE, id);
  return adapter;
}

export function loadPersistedAdapter() {
  const saved = storage.getItem(KEY_WALLET_TYPE);
  if (saved && getAdapter(saved)) {
    _currentAdapter = getAdapter(saved);
    return _currentAdapter;
  }
  return null;
}

export async function detectInstalledAdapters() {
  const results = await Promise.allSettled(
    ADAPTERS.map(async (a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      installed: await a.isInstalled(),
    }))
  );
  return results
    .filter((r) => r.status === "fulfilled" && r.value.installed)
    .map((r) => r.value);
}

export function clearAdapter() {
  _currentAdapter = null;
  storage.removeItem(KEY_WALLET_TYPE);
}

function requireAdapter() {
  if (!_currentAdapter) {
    throw new Error("No hay una wallet conectada. Conecta una wallet primero.");
  }
  return _currentAdapter;
}

export async function isInstalled() {
  return requireAdapter().isInstalled();
}

export async function isConnected() {
  return requireAdapter().isConnected();
}

export async function isAllowed() {
  return requireAdapter().isAllowed();
}

export async function requestAccess() {
  return requireAdapter().requestAccess();
}

export async function getAddress() {
  return requireAdapter().getAddress();
}

export async function getNetwork() {
  return requireAdapter().getNetwork();
}

export async function signTransaction(xdr, opts) {
  return requireAdapter().signTransaction(xdr, opts);
}

export async function setAllowed(valor) {
  try {
    if (_currentAdapter) {
      await _currentAdapter.setAllowed(valor);
    }
  } catch {
    // ignored during disconnect
  }
}

export async function disconnect() {
  try {
    if (_currentAdapter) {
      await _currentAdapter.disconnect();
    }
  } catch {
    // ignored during disconnect cleanup
  }
  clearAdapter();
}

import * as freighterApi from "@stellar/freighter-api";

export const id = "freighter";
export const name = "Freighter";
export const icon = null;

const WALLET_URL = "https://freighter.app";

export async function isInstalled() {
  try {
    const { isConnected: conectado } = await freighterApi.isConnected();
    return conectado;
  } catch {
    return false;
  }
}

export async function isConnected() {
  try {
    const { isConnected: conectado } = await freighterApi.isConnected();
    return conectado;
  } catch {
    return false;
  }
}

export async function isAllowed() {
  try {
    const { isAllowed: permitido } = await freighterApi.isAllowed();
    return permitido;
  } catch {
    return false;
  }
}

export async function requestAccess() {
  await freighterApi.requestAccess();
}

export async function getAddress() {
  const { address } = await freighterApi.getAddress();
  return address;
}

export async function getNetwork() {
  const { networkPassphrase } = await freighterApi.getNetwork();
  return networkPassphrase;
}

export async function signTransaction(xdr, opts) {
  return freighterApi.signTransaction(xdr, opts);
}

export async function setAllowed(valor) {
  await freighterApi.setAllowed(valor);
}

export async function disconnect() {
  await freighterApi.setAllowed(false);
}

export { WALLET_URL };

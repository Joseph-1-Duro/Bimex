export const id = "xbull";
export const name = "xBull";
export const icon = null;

const WALLET_URL = "https://xbull.app";

function getWallet() {
  if (typeof window !== "undefined" && window.xBull) {
    return window.xBull;
  }
  return null;
}

export async function isInstalled() {
  return !!getWallet();
}

export async function isConnected() {
  const wallet = getWallet();
  if (!wallet) return false;
  try {
    return await wallet.isConnected() ?? false;
  } catch {
    return false;
  }
}

export async function isAllowed() {
  const wallet = getWallet();
  if (!wallet) return false;
  try {
    return await wallet.isConnected() ?? false;
  } catch {
    return false;
  }
}

export async function requestAccess() {
  const wallet = getWallet();
  if (!wallet) throw new Error("xBull no está instalado.");
  const { publicKey } = await wallet.connect();
  if (!publicKey) throw new Error("xBull no devolvió una dirección.");
}

export async function getAddress() {
  const wallet = getWallet();
  if (!wallet) throw new Error("xBull no está instalado.");
  const { publicKey } = await wallet.connect();
  return publicKey;
}

export async function getNetwork() {
  const wallet = getWallet();
  if (!wallet) throw new Error("xBull no está instalado.");
  const { networkPassphrase } = await wallet.getNetworkDetails();
  return networkPassphrase;
}

export async function signTransaction(xdr, opts) {
  const wallet = getWallet();
  if (!wallet) throw new Error("xBull no está instalado.");
  const { networkPassphrase } = opts;
  try {
    const signedXdr = await wallet.sign(xdr, networkPassphrase);
    return { signedTxXdr: signedXdr, error: null };
  } catch (err) {
    return { signedTxXdr: null, error: err };
  }
}

export async function setAllowed() {
}

export async function disconnect() {
  const wallet = getWallet();
  if (!wallet) return;
  try {
    await wallet.disconnect();
  } catch {
    // ignored during disconnect cleanup
  }
}

export { WALLET_URL };

export const id = "lobstr";
export const name = "Lobstr";
export const icon = null;

const WALLET_URL = "https://lobstr.co";

function getWallet() {
  if (typeof window !== "undefined" && window.lobstr) {
    return window.lobstr;
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
    const info = await wallet.getAddress();
    return !!info?.address;
  } catch {
    return false;
  }
}

export async function isAllowed() {
  return isConnected();
}

export async function requestAccess() {
  const wallet = getWallet();
  if (!wallet) throw new Error("Lobstr no está instalado.");
  await wallet.connect();
}

export async function getAddress() {
  const wallet = getWallet();
  if (!wallet) throw new Error("Lobstr no está instalado.");
  const info = await wallet.getAddress();
  return info?.address ?? "";
}

export async function getNetwork() {
  const wallet = getWallet();
  if (!wallet) throw new Error("Lobstr no está instalado.");
  const info = await wallet.getNetwork();
  return info?.networkPassphrase ?? "";
}

export async function signTransaction(xdr, opts) {
  const wallet = getWallet();
  if (!wallet) throw new Error("Lobstr no está instalado.");
  try {
    const signedXdr = await wallet.signTransaction(xdr, opts);
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

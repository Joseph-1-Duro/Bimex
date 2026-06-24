import { useState, useEffect, useCallback, useRef } from "react";
import { CONFIG } from "../stellar/contrato";
import { parsearError } from "../utils/errores.js";
import {
  getAvailableAdapters,
  detectInstalledAdapters,
  setCurrentAdapter,
  loadPersistedAdapter,
} from "../wallet/walletAdapter.js";

const WALLET_ICONS = {
  freighter: null,
  xbull: null,
  lobstr: null,
};

export default function ConectarWallet({ onConectado, autoConectar = true, inNavbar = false }) {
  const [estado,    setEstado]    = useState("inactivo");
  const [direccion, setDireccion] = useState(null);
  const [error,     setError]     = useState("");
  const [wallets,   setWallets]   = useState([]);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const conectandoRef = useRef(false);

  const detectar = useCallback(async () => {
    const instaladas = await detectInstalledAdapters();
    setWallets(instaladas);
    return instaladas;
  }, []);

  useEffect(() => {
    if (!autoConectar) return;
    (async () => {
      try {
        const adaptador = loadPersistedAdapter();
        if (!adaptador) return;
        const permitido = await adaptador.isAllowed();
        if (!permitido) return;
        const address = await adaptador.getAddress();
        if (address) { setDireccion(address); setEstado("conectado"); onConectado?.(address); }
      } catch (err) {
        console.warn("No se pudo restaurar la sesión:", err);
      }
    })();
  }, [autoConectar, onConectado]);

  const conectarConWallet = useCallback(async (walletId) => {
    if (conectandoRef.current) return;
    conectandoRef.current = true;
    setEstado("verificando"); setError(""); setMostrarSelector(false);
    try {
      const adaptador = setCurrentAdapter(walletId);
      const instalado = await adaptador.isInstalled();
      if (!instalado) { setEstado("sin_extension"); return; }
      await adaptador.requestAccess();
      const networkPassphrase = await adaptador.getNetwork();
      if (!networkPassphrase) {
        setError("La wallet no devolvió la red activa. Asegúrate de que esté desbloqueada.");
        setEstado("error");
        return;
      }
      if (networkPassphrase !== CONFIG.NETWORK_PASSPHRASE) { setEstado("red_incorrecta"); return; }
      const address = await adaptador.getAddress();
      if (!address || address.length < 10) {
        setError("No se pudo obtener la dirección de la wallet. Intenta de nuevo.");
        setEstado("error");
        return;
      }
      setDireccion(address); setEstado("conectado"); onConectado?.(address);
    } catch (e) {
      setError(parsearError(e));
      setEstado("error");
    } finally {
      conectandoRef.current = false;
    }
  }, [onConectado]);

  async function abrirSelector() {
    const instaladas = await detectar();
    if (instaladas.length === 1) {
      conectarConWallet(instaladas[0].id);
    } else {
      setMostrarSelector(true);
    }
  }

  function cerrarSelector() {
    setMostrarSelector(false);
    setError("");
  }

  if (estado === "conectado") return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--navy-dim)",
      border: "1.5px solid rgba(30,58,95,0.20)",
      padding: inNavbar ? "6px 14px" : "10px 18px",
      borderRadius: 99,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "var(--green)", flexShrink: 0,
      }} />
      <span style={{ fontFamily: "monospace", fontSize: inNavbar ? 12 : 14, color: "var(--navy)", fontWeight: 600 }}>
        {direccion && direccion.length >= 8 ? `${direccion.slice(0, 4)}…${direccion.slice(-4)}` : direccion}
      </span>
    </div>
  );

  const verificando = estado === "verificando";

  if (inNavbar) {
    return (
      <>
        <button
          onClick={abrirSelector}
          disabled={verificando}
          className="btn btn-primary"
          style={{ padding: "8px 20px", fontSize: "0.84rem", opacity: verificando ? 0.65 : 1 }}
        >
          {verificando ? "Conectando…" : "Conectar"}
        </button>
        {mostrarSelector && (
          <WalletSelector
            wallets={wallets}
            verificando={verificando}
            error={error}
            estado={estado}
            onSelect={conectarConWallet}
            onCerrar={cerrarSelector}
          />
        )}
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
      <button
        onClick={abrirSelector}
        disabled={verificando}
        className="btn btn-primary"
        style={{ padding: "14px 36px", fontSize: "1rem", opacity: verificando ? 0.65 : 1 }}
      >
        {verificando ? "Conectando…" : "Conectar Wallet"}
      </button>

      {mostrarSelector && (
        <WalletSelector
          wallets={wallets}
          verificando={verificando}
          error={error}
          estado={estado}
          onSelect={conectarConWallet}
          onCerrar={cerrarSelector}
        />
      )}
    </div>
  );
}

function WalletSelector({ wallets, verificando, error, estado, onSelect, onCerrar }) {
  const todosLosWallets = getAvailableAdapters();

  return (
    <div style={{
      marginTop: 8,
      display: "flex", flexDirection: "column", gap: 6,
      width: "100%", maxWidth: 300,
    }}>
      {todosLosWallets.map((w) => {
        const instalada = wallets.some((wi) => wi.id === w.id);
        return (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            disabled={verificando}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "10px 14px",
              border: `1.5px solid ${instalada ? "var(--navy)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)",
              background: instalada ? "var(--navy-dim)" : "var(--bg)",
              cursor: verificando ? "not-allowed" : "pointer",
              opacity: verificando ? 0.65 : instalada ? 1 : 0.5,
              textAlign: "left", fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            <span style={{
              width: 28, height: 28, borderRadius: "50%",
              background: instalada ? "var(--green)" : "var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 700, color: instalada ? "#fff" : "var(--muted)",
              flexShrink: 0,
            }}>
              {w.name[0]}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text)" }}>
                {w.name}
              </div>
              <div style={{ fontSize: "0.72rem", color: instalada ? "var(--green)" : "var(--muted)" }}>
                {instalada ? "Instalada" : "No detectada"}
              </div>
            </div>
            {!instalada && (
              <a
                href={w.walletUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: "0.72rem", color: "var(--navy)", fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Instalar
              </a>
            )}
          </button>
        );
      })}

      {estado === "sin_extension" && (
        <p style={{ color: "var(--amber)", fontSize: "0.82rem", margin: 0 }}>
          La wallet seleccionada no está instalada.
        </p>
      )}
      {estado === "red_incorrecta" && (
        <p style={{ color: "var(--amber)", fontSize: "0.82rem", margin: 0 }}>
          Cambia tu wallet a <strong>Testnet</strong>
        </p>
      )}
      {estado === "error" && (
        <p style={{ color: "var(--error, #DC2626)", fontSize: "0.82rem", margin: 0 }}>{error}</p>
      )}

      <button
        onClick={onCerrar}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--muted)", fontSize: "0.78rem", padding: "4px 0",
          textDecoration: "underline", fontFamily: "inherit",
        }}
      >
        Cancelar
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MobileNav from "../../components/MobileNav";
import "../wallet.css";
import "./deposit.css";

type Asset = {
  symbol: string;
  name: string;
  color: string;
};

type Network = {
  id: string;
  name: string;
  short: string;
  logo: string;
};

const ASSET: Asset = {
  symbol: "USDT",
  name: "Tether",
  color: "#26a17b",
};

const NETWORK: Network = {
  id: "bsc",
  name: "BNB Smart Chain",
  short: "BEP-20",
  logo: "bnb",
};

function Logo({
  asset,
  network,
}: {
  asset?: Asset;
  network?: Network;
}) {
  const symbol = asset?.symbol ?? network?.logo ?? "";
  const color = asset?.color ?? "#18324d";

  return (
    <span
      className="deposit-asset-logo"
      style={{ background: color }}
    >
      <span>{symbol.slice(0, 2)}</span>
    </span>
  );
}

export default function DepositPage() {
  const router = useRouter();
  const [showNetworks, setShowNetworks] = useState(false);

  const chooseNetwork = () => {
    router.push(
      `/wallet/deposit/address?asset=${ASSET.symbol}&assetName=${encodeURIComponent(
        ASSET.name
      )}&network=${encodeURIComponent(
        NETWORK.name
      )}&networkShort=${NETWORK.short}&networkId=${NETWORK.id}`
    );
  };

  return (
    <main className="wallet-page">
      <header className="wallet-header">
        <Link href="/wallet" className="wallet-brand">
          <span className="brand-mark">◉</span> ORBITEX
        </Link>

        <Link href="/wallet" className="history-link">
          <ArrowLeft size={18} /> Back to Wallet
        </Link>
      </header>

      <div className="wallet-content deposit-content">
        <div className="wallet-heading">
          <div>
            <span className="wallet-kicker">FUND YOUR ACCOUNT</span>
            <h1>Deposit</h1>
            <p>
              {showNetworks
                ? "Choose the network for your USDT deposit."
                : "Select the asset you want to deposit."}
            </p>
          </div>
        </div>

        <section className="deposit-shell">
          <div
            className={`deposit-selector withdraw-assets ${
              showNetworks ? "mobile-hidden" : ""
            }`}
          >
            <div className="deposit-section-heading">
              <div>
                <span className="wallet-kicker">SELECT ASSET</span>
                <h2>Choose a deposit asset</h2>
              </div>

              <span className="supported-count">
                1 supported asset
              </span>
            </div>

            <div className="deposit-asset-grid">
              <button
                type="button"
                className="deposit-asset-option selected"
                onClick={() => setShowNetworks(true)}
              >
                <Logo asset={ASSET} />

                <span>
                  <strong>{ASSET.symbol}</strong>
                  <small>{ASSET.name}</small>
                </span>

                <Check
                  size={17}
                  className="asset-selected-check"
                />
              </button>
            </div>

            <p className="deposit-helper">
              Currently available: USDT on BNB Smart Chain
              (BEP-20). More assets and networks will be added
              after secure wallet provisioning.
            </p>
          </div>

          <div
            className={`deposit-details withdraw-form ${
              showNetworks ? "mobile-visible" : "mobile-hidden"
            }`}
          >
            <button
              type="button"
              className="mobile-back-button"
              onClick={() => setShowNetworks(false)}
            >
              <ArrowLeft size={17} /> Choose another asset
            </button>

            <div className="selected-asset-heading">
              <Logo asset={ASSET} />

              <div>
                <span className="wallet-kicker">
                  DEPOSIT ASSET
                </span>

                <h2>
                  {ASSET.name} <em>{ASSET.symbol}</em>
                </h2>
              </div>
            </div>

            <p className="deposit-helper">
              Send only USDT using the BNB Smart Chain network.
              Sending through the wrong network can permanently
              lose funds.
            </p>

            <div className="deposit-network-step">
              <label className="deposit-field-label">
                Choose network for USDT
              </label>

              <div className="deposit-network-list">
                <button
                  type="button"
                  className="deposit-network-option selected"
                  onClick={chooseNetwork}
                >
                  <Logo network={NETWORK} />

                  <span>
                    <strong>
                      USDT on {NETWORK.name}
                    </strong>
                    <small>{NETWORK.short} network</small>
                  </span>

                  <Check
                    size={17}
                    className="asset-selected-check"
                  />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <MobileNav />
    </main>
  );
}

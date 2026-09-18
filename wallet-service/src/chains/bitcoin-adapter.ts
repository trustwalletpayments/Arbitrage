import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, type BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

export type BitcoinUtxo = {
  txid: string;
  vout: number;
  valueSats: bigint;
  scriptPubKey: string;
  height: number;
};

type RpcResponse<T> = { result: T; error: { code: number; message: string } | null; id: string };

function rpcUrl() {
  const value = process.env.BITCOIN_RPC_URL?.trim();
  if (!value) throw new Error('BITCOIN_RPC_URL is not configured.');
  return value;
}

async function rpc<T>(method: string, params: unknown[] = []): Promise<T> {
  const response = await fetch(rpcUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 'orbitex-btc', method, params }),
  });
  if (!response.ok) throw new Error(`Bitcoin RPC HTTP ${response.status}.`);
  const body = (await response.json()) as RpcResponse<T>;
  if (body.error) throw new Error(`Bitcoin RPC ${body.error.code}: ${body.error.message}`);
  return body.result;
}

function rootXprv() {
  const xprv = process.env.BITCOIN_XPRV?.trim();
  if (!xprv) throw new Error('BITCOIN_XPRV is not configured.');
  return bip32.fromBase58(xprv, bitcoin.networks.bitcoin);
}

function rootXpub() {
  const xpub = process.env.BITCOIN_XPUB?.trim();
  if (!xpub) throw new Error('BITCOIN_XPUB is not configured.');
  return bip32.fromBase58(xpub, bitcoin.networks.bitcoin);
}

function paymentFromNode(node: BIP32Interface) {
  const payment = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(node.publicKey), network: bitcoin.networks.bitcoin });
  if (!payment.address || !payment.output) throw new Error('Unable to derive Bitcoin P2WPKH address.');
  return { address: payment.address, scriptPubKey: payment.output.toString('hex') };
}

/** BIP84 receive path: m/84'/0'/0'/0/index. */
export function deriveBitcoinDeposit(index: number) {
  if (!Number.isInteger(index) || index < 0) throw new Error('Invalid Bitcoin derivation index.');
  const node = rootXprv().derivePath(`m/84'/0'/0'/0/${index}`);
  return { index, ...paymentFromNode(node), node };
}

/** Public derivation for address provisioning; the API service never needs BTC private keys. */
export function deriveBitcoinDepositAddress(index: number) {
  if (!Number.isInteger(index) || index < 0) throw new Error('Invalid Bitcoin derivation index.');
  const node = rootXpub().derivePath(`0/${index}`);
  return { index, ...paymentFromNode(node) };
}

/** Bitcoin Core observation only; no user private keys are imported into the node. */
export async function scanBitcoinDeposit(address: string, minimumConfirmations = 1): Promise<BitcoinUtxo[]> {
  const result = await rpc<{
    success: boolean;
    height: number;
    txouts: Array<{ txid: string; vout: number; scriptPubKey: { hex: string }; value: number; height: number }>;
  }>('scantxoutset', ['start', [`addr(${address})`]]);
  if (!result.success) throw new Error('Bitcoin UTXO scan did not complete successfully.');
  return result.txouts
    .filter((u) => result.height - u.height + 1 >= minimumConfirmations)
    .map((u) => ({ txid: u.txid, vout: u.vout, valueSats: BigInt(Math.round(u.value * 100_000_000)), scriptPubKey: u.scriptPubKey.hex, height: u.height }));
}

export async function bitcoinTipHeight() {
  return rpc<number>('getblockcount');
}

async function feeRateSatPerVbyte() {
  const configured = Number(process.env.BITCOIN_FEE_RATE_SAT_VB || 0);
  if (Number.isFinite(configured) && configured > 0) return configured;
  const estimate = await rpc<{ feerate?: number }>('estimatesmartfee', [6]);
  if (estimate.feerate && estimate.feerate > 0) return estimate.feerate * 100_000;
  throw new Error('Set BITCOIN_FEE_RATE_SAT_VB because Bitcoin Core did not return a usable fee estimate.');
}

/** Build and sign a native-SegWit sweep. BTC has transaction fees rather than EVM gas. */
export async function buildBitcoinSweep(args: { index: number; treasuryAddress: string; utxos: BitcoinUtxo[]; feeRateSatVb?: number }) {
  if (!args.utxos.length) throw new Error('No confirmed Bitcoin UTXOs to sweep.');
  const derived = deriveBitcoinDeposit(args.index);
  const feeRate = args.feeRateSatVb ?? await feeRateSatPerVbyte();
  const estimatedVbytes = 10 + args.utxos.length * 68 + 31;
  const fee = BigInt(Math.ceil(estimatedVbytes * feeRate));
  const total = args.utxos.reduce((sum, u) => sum + u.valueSats, 0n);
  if (total <= fee) throw new Error('Bitcoin balance is not sufficient to cover the sweep fee.');
  const amount = total - fee;
  if (amount < 546n) throw new Error('Bitcoin sweep output would be dust.');
  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
  for (const utxo of args.utxos) {
    psbt.addInput({ hash: utxo.txid, index: utxo.vout, witnessUtxo: { script: Buffer.from(utxo.scriptPubKey, 'hex'), value: utxo.valueSats } });
  }
  psbt.addOutput({ address: args.treasuryAddress, value: amount });
  for (let i = 0; i < args.utxos.length; i++) psbt.signInput(i, derived.node);
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  return { txHex: tx.toHex(), txid: tx.getId(), amountSats: amount, feeSats: fee, feeRateSatVb: feeRate };
}

export async function broadcastBitcoinSweep(txHex: string) {
  return rpc<string>('sendrawtransaction', [txHex, 0]);
}

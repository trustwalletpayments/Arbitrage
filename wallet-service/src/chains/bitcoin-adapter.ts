import { createHash } from 'node:crypto';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, type BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
const bip32 = BIP32Factory(ecc);

// Orbitex BTC uses native SegWit (BIP-84) on Bitcoin mainnet.
// BITCOIN_ZPUB/BITCOIN_XPUB and BITCOIN_ZPRV/BITCOIN_XPRV are the account-level extended keys at m/84'/0'/0'.
// The application never needs the master seed. Deposit children are derived as 0/index.
const BITCOIN_ACCOUNT_PATH = "m/84'/0'/0'";
const BITCOIN_EXTERNAL_CHAIN = 0;

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ZPUB_VERSION = 0x04b24746;
const XPUB_VERSION = 0x0488b21e;
const ZPRV_VERSION = 0x04b2430c;
const XPRV_VERSION = 0x0488ade4;

function sha256(value: Buffer) {
  return createHash('sha256').update(value).digest();
}

function base58Decode(value: string) {
  let n = 0n;
  for (const char of value) {
    const index = BASE58_ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Invalid extended-key encoding.');
    n = n * 58n + BigInt(index);
  }
  const hex = n === 0n ? '' : n.toString(16).padStart(2, '0');
  const payload = hex ? Buffer.from(hex.length % 2 ? '0' + hex : hex, 'hex') : Buffer.alloc(0);
  let leadingZeros = 0;
  for (const char of value) {
    if (char !== '1') break;
    leadingZeros += 1;
  }
  return Buffer.concat([Buffer.alloc(leadingZeros), payload]);
}

function base58Encode(value: Buffer) {
  let n = 0n;
  for (const byte of value) n = n * 256n + BigInt(byte);
  let encoded = '';
  while (n > 0n) {
    const remainder = Number(n % 58n);
    encoded = BASE58_ALPHABET[remainder] + encoded;
    n /= 58n;
  }
  let leadingZeros = 0;
  for (const byte of value) {
    if (byte !== 0) break;
    leadingZeros += 1;
  }
  return '1'.repeat(leadingZeros) + (encoded || '');
}

function convertSlip132Key(value: string, expectedVersion: number, targetVersion: number) {
  const decoded = base58Decode(value);
  if (decoded.length !== 82) throw new Error('Invalid extended key length.');
  const body = decoded.subarray(0, 78);
  const checksum = decoded.subarray(78);
  const expectedChecksum = sha256(sha256(body)).subarray(0, 4);
  if (!checksum.equals(expectedChecksum)) throw new Error('Invalid extended key checksum.');
  if (body.readUInt32BE(0) !== expectedVersion) throw new Error('Unexpected extended key version.');
  body.writeUInt32BE(targetVersion, 0);
  const nextChecksum = sha256(sha256(body)).subarray(0, 4);
  return base58Encode(Buffer.concat([body, nextChecksum]));
}

function normalizeBitcoinExtendedPublicKey(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith('zpub')) return convertSlip132Key(trimmed, ZPUB_VERSION, XPUB_VERSION);
  if (trimmed.startsWith('xpub')) return trimmed;
  throw new Error('BITCOIN_ZPUB/BITCOIN_XPUB must be a Bitcoin Native SegWit zpub or standard xpub.');
}

function normalizeBitcoinExtendedPrivateKey(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith('zprv')) return convertSlip132Key(trimmed, ZPRV_VERSION, XPRV_VERSION);
  if (trimmed.startsWith('xprv')) return trimmed;
  throw new Error('BITCOIN_ZPRV/BITCOIN_XPRV must be a Bitcoin private extended key.');
}
export type BitcoinUtxo = { txid:string; vout:number; valueSats:bigint; scriptPubKey:string; height:number };
type RpcResponse<T> = { result:T; error:{code:number;message:string}|null; id:string };
function rpcUrl(){const value=process.env.BITCOIN_RPC_URL?.trim();if(!value)throw new Error('BITCOIN_RPC_URL is not configured.');return value;}
async function rpc<T>(method:string,params:unknown[]=[]):Promise<T>{const response=await fetch(rpcUrl(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:'orbitex-btc',method,params})});if(!response.ok)throw new Error(`Bitcoin RPC HTTP ${response.status}.`);const body=(await response.json()) as RpcResponse<T>;if(body.error)throw new Error(`Bitcoin RPC ${body.error.code}: ${body.error.message}`);return body.result;}
function rootXprv(){const raw=process.env.BITCOIN_ZPRV?.trim()||process.env.BITCOIN_XPRV?.trim();if(!raw)throw new Error('BITCOIN_ZPRV or BITCOIN_XPRV is not configured.');return bip32.fromBase58(normalizeBitcoinExtendedPrivateKey(raw),bitcoin.networks.bitcoin);}
function rootXpub(){const raw=process.env.BITCOIN_ZPUB?.trim()||process.env.BITCOIN_XPUB?.trim();if(!raw)throw new Error('BITCOIN_ZPUB or BITCOIN_XPUB is not configured.');return bip32.fromBase58(normalizeBitcoinExtendedPublicKey(raw),bitcoin.networks.bitcoin);}
function paymentFromNode(node:BIP32Interface){const payment=bitcoin.payments.p2wpkh({pubkey:Buffer.from(node.publicKey),network:bitcoin.networks.bitcoin});if(!payment.address||!payment.output)throw new Error('Unable to derive Bitcoin P2WPKH address.');if(!payment.address.startsWith('bc1q'))throw new Error('Derived Bitcoin address is not native SegWit (bc1q).');return{address:payment.address,scriptPubKey:Buffer.from(payment.output).toString('hex')};}
export function deriveBitcoinDeposit(index:number){if(!Number.isInteger(index)||index<0)throw new Error('Invalid Bitcoin derivation index.');const node=rootXprv().derivePath(`${BITCOIN_EXTERNAL_CHAIN}/${index}`);return{index,...paymentFromNode(node),node};}
export function deriveBitcoinDepositAddress(index:number){if(!Number.isInteger(index)||index<0)throw new Error('Invalid Bitcoin derivation index.');const node=rootXpub().derivePath(`${BITCOIN_EXTERNAL_CHAIN}/${index}`);return{index,...paymentFromNode(node)};}
export async function scanBitcoinDeposit(address:string,minimumConfirmations=1):Promise<BitcoinUtxo[]>{
  const endpoint=process.env.BITCOIN_RPC_URL?.trim();
  if(!endpoint)throw new Error('BITCOIN_RPC_URL is not configured.');
  const base=new URL(endpoint);
  if(!base.pathname.endsWith('/'))base.pathname+='/';
  const url=new URL('api/v2/utxo/'+encodeURIComponent(address),base);
  url.searchParams.set('confirmed','false');
  const response=await fetch(url.toString());
  if(!response.ok)throw new Error(`Bitcoin UTXO API HTTP ${response.status}.`);
  const body=await response.json() as Array<{txid:string;vout:number;value:string|number;height:number;confirmations?:number}>;
  if(!Array.isArray(body))throw new Error('Bitcoin UTXO API returned an invalid response.');
  const candidates=body.filter(u=>{
    const confirmations=Number(u.confirmations??0);
    return Number.isInteger(u.vout)&&u.vout>=0&&Number.isInteger(u.height)&&u.height>=0&&confirmations>=minimumConfirmations;
  });
  const result:BitcoinUtxo[]=[];
  for(const u of candidates){
    const rpcResponse=await fetch(endpoint,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:'orbitex-btc-utxo',method:'gettxout',params:[u.txid,u.vout,true]}),
    });
    if(!rpcResponse.ok)throw new Error(`Bitcoin gettxout HTTP ${rpcResponse.status}.`);
    const rpcBody=await rpcResponse.json() as {result:{value:number|string;scriptPubKey:{hex:string}}|null;error:{code:number;message:string}|null};
    if(rpcBody.error)throw new Error(`Bitcoin RPC ${rpcBody.error.code}: ${rpcBody.error.message}`);
    if(!rpcBody.result?.scriptPubKey?.hex)continue;
    result.push({
      txid:u.txid,
      vout:u.vout,
      valueSats:BigInt(String(u.value)),
      scriptPubKey:rpcBody.result.scriptPubKey.hex,
      height:u.height,
    });
  }
  return result;
}
export async function bitcoinTipHeight(){return rpc<number>('getblockcount');}
async function feeRateSatPerVbyte(){const configured=Number(process.env.BITCOIN_FEE_RATE_SAT_VB||0);if(Number.isFinite(configured)&&configured>0)return configured;const estimate=await rpc<{feerate?:number}>('estimatesmartfee',[6]);if(estimate.feerate&&estimate.feerate>0)return estimate.feerate*100_000;throw new Error('Set BITCOIN_FEE_RATE_SAT_VB because Bitcoin Core did not return a usable fee estimate.');}
export async function buildBitcoinSweep(args:{index:number;treasuryAddress:string;utxos:BitcoinUtxo[];feeRateSatVb?:number}){if(!args.utxos.length)throw new Error('No confirmed Bitcoin UTXOs to sweep.');const derived=deriveBitcoinDeposit(args.index);const feeRate=args.feeRateSatVb??await feeRateSatPerVbyte();const estimatedVbytes=10+args.utxos.length*68+31;const fee=BigInt(Math.ceil(estimatedVbytes*feeRate));const total=args.utxos.reduce((sum,u)=>sum+u.valueSats,0n);if(total<=fee)throw new Error('Bitcoin balance is not sufficient to cover the sweep fee.');const amount=total-fee;if(amount<546n)throw new Error('Bitcoin sweep output would be dust.');const psbt=new bitcoin.Psbt({network:bitcoin.networks.bitcoin});for(const utxo of args.utxos)psbt.addInput({hash:utxo.txid,index:utxo.vout,witnessUtxo:{script:Buffer.from(utxo.scriptPubKey,'hex'),value:utxo.valueSats as any}});psbt.addOutput({address:args.treasuryAddress,value:amount as any});for(let i=0;i<args.utxos.length;i++)psbt.signInput(i,derived.node);psbt.finalizeAllInputs();const tx=psbt.extractTransaction();return{txHex:tx.toHex(),txid:tx.getId(),amountSats:amount,feeSats:fee,feeRateSatVb:feeRate};}
export async function broadcastBitcoinSweep(txHex:string){return rpc<string>('sendrawtransaction',[txHex,0]);}
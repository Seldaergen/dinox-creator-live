
import React, { useState } from 'react';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

const network = clusterApiUrl('devnet');
const CREATOR_WALLET = new PublicKey('DXVMtmj9WaZzZzFV1XpXtiorhHkM8qyebgnvTEVp2Ri4');

function App() {
  const [form, setForm] = useState({ name: '', symbol: '', supply: '', decimals: 9 });
  const [tokenAddress, setTokenAddress] = useState('');
  const [walletAddress, setWalletAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const connectWallet = async () => {
    if ('solana' in window) {
      const sol = window.solana;
      if (sol.isPhantom) {
        try {
          const resp = await sol.connect();
          setWalletAddress(resp.publicKey);
          setProvider(sol);
        } catch (err) {
          alert('Cüzdan bağlantısı reddedildi.');
        }
      }
    } else {
      alert('Phantom cüzdanı bulunamadı. Lütfen kurun.');
    }
  };

  const createToken = async () => {
    if (!walletAddress || !provider) return alert('Lütfen önce Phantom cüzdanınızı bağlayın.');

    setLoading(true);
    const connection = new Connection(network, 'confirmed');
    const decimals = parseInt(form.decimals);
    const totalSupply = parseInt(form.supply) * 10 ** decimals;
    const creatorShare = Math.floor(totalSupply * 0.15);
    const userShare = totalSupply - creatorShare;

    try {
      const mint = await createMint(connection, provider, walletAddress, null, decimals);

      const userTokenAccount = await getOrCreateAssociatedTokenAccount(connection, provider, mint, walletAddress);
      const creatorTokenAccount = await getOrCreateAssociatedTokenAccount(connection, provider, mint, CREATOR_WALLET);

      await mintTo(connection, provider, mint, userTokenAccount.address, walletAddress, userShare);
      await mintTo(connection, provider, mint, creatorTokenAccount.address, walletAddress, creatorShare);

      setTokenAddress(mint.toBase58());
      alert('✅ Token başarıyla oluşturuldu!');
    } catch (err) {
      console.error(err);
      alert('🚨 Token oluşturulamadı: ' + err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6">🦖 DinoX Token Creator</h1>
      <button onClick={connectWallet} className="mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded">
        {walletAddress ? '✅ Cüzdan Bağlandı' : '🔌 Phantom Cüzdanı Bağla'}
      </button>
      <div className="space-y-4">
        <input name="name" placeholder="Token Name" onChange={handleChange} className="w-full p-3 bg-gray-800 rounded" />
        <input name="symbol" placeholder="Token Symbol" onChange={handleChange} className="w-full p-3 bg-gray-800 rounded" />
        <input name="supply" placeholder="Total Supply" type="number" onChange={handleChange} className="w-full p-3 bg-gray-800 rounded" />
        <input name="decimals" placeholder="Decimals (default 9)" type="number" value={form.decimals} onChange={handleChange} className="w-full p-3 bg-gray-800 rounded" />
        <button onClick={createToken} disabled={loading} className="w-full p-3 bg-green-600 hover:bg-green-700 rounded">
          {loading ? 'Oluşturuluyor...' : 'Token Oluştur'}
        </button>
      </div>
      {tokenAddress && (
        <div className="mt-6 p-4 bg-gray-700 rounded">
          ✅ Token Oluşturuldu: <br />
          <code className="break-all">{tokenAddress}</code>
        </div>
      )}
    </div>
  );
}

export default App;

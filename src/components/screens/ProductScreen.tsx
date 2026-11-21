import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Product, ProductCategory } from '../../types';
import { Money } from '../../lib/money';
import { Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { KeypadModal } from '../KeypadModal';

interface ProductScreenProps {
  category: ProductCategory;
  onBack: () => void;
}

export const ProductScreen: React.FC<ProductScreenProps> = ({ category }) => {
  const [tab, setTab] = useState<'daftar' | 'terjual'>('daftar');
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newModel, setNewModel] = useState('');
  const [newStock, setNewStock] = useState('10');
  const [newCost, setNewCost] = useState('10');
  const [newPrice, setNewPrice] = useState('15');

  // Keypad state
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [keypadProduct, setKeypadProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, [category]);

  async function loadProducts() {
    const list = await db.products.where('kategori').equals(category).toArray();
    setProducts(list);
  }

  const handleSellOne = async (p: Product) => {
    if (p.sisa <= 0) {
      alert('Stok habis!');
      return;
    }
    const nextSisa = p.sisa - 1;
    const nextTerjual = p.terjual + 1;
    const nextOmset = nextTerjual * p.jual;
    const nextLaba = nextTerjual * (p.jual - p.modal);

    await db.products.update(p.id, {
      sisa: nextSisa,
      terjual: nextTerjual,
      akhir: nextSisa,
      omset: nextOmset,
      laba: nextLaba
    });

    await db.productSales.add({
      id: `sale-${Date.now()}`,
      productId: p.id,
      kategori: category,
      model: p.model,
      modal: p.modal,
      jual: p.jual,
      waktu: Date.now()
    });

    await loadProducts();
  };

  const handleAddProduct = async () => {
    if (!newModel.trim()) return;
    const stock = parseInt(newStock || '0', 10);
    const cost = parseInt(newCost || '0', 10);
    const price = parseInt(newPrice || '0', 10);

    await db.products.add({
      id: `${category.toLowerCase()}-${Date.now()}`,
      kategori: category,
      model: newModel.trim(),
      awal: stock,
      tambah: 0,
      sisa: stock,
      terjual: 0,
      akhir: stock,
      modal: cost,
      jual: price,
      omset: 0,
      laba: 0
    });

    setNewModel('');
    setIsAddModalOpen(false);
    await loadProducts();
  };

  const handleAddStock = async (p: Product, tambahAmount: number) => {
    const nextSisa = p.sisa + tambahAmount;
    const nextTambah = p.tambah + tambahAmount;
    await db.products.update(p.id, {
      sisa: nextSisa,
      tambah: nextTambah,
      akhir: nextSisa
    });
    await loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus produk ini?')) {
      await db.products.delete(id);
      await loadProducts();
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto">
      {/* Category Tabs: Daftar vs Terjual */}
      <div className="bg-[#09275F] p-2 flex gap-2">
        <button
          onClick={() => setTab('daftar')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg btn-press ${
            tab === 'daftar'
              ? 'bg-[#1749B5] text-white shadow-xs'
              : 'bg-white/10 text-white/80 hover:bg-white/15'
          }`}
        >
          Daftar {category}
        </button>
        <button
          onClick={() => setTab('terjual')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg btn-press ${
            tab === 'terjual'
              ? 'bg-[#1749B5] text-white shadow-xs'
              : 'bg-white/10 text-white/80 hover:bg-white/15'
          }`}
        >
          Laporan Terjual
        </button>
      </div>

      {tab === 'daftar' ? (
        <div className="p-3 space-y-3">
          {/* Header Action Button */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#6F7C92] uppercase tracking-wider">
              {products.length} Produk {category}
            </h3>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1749B5] text-white text-xs font-bold rounded-lg shadow-xs btn-press"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk</span>
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-2.5">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-[#E0E7F2] p-3 shadow-xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#09275F]">{p.model}</h4>
                    <div className="text-xs text-[#6F7C92] mt-0.5">
                      Modal: {Money.ribuan(p.modal)} • Jual: <span className="font-bold text-[#1749B5]">{Money.ribuan(p.jual)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="text-slate-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stock Stats Grid */}
                <div className="grid grid-cols-4 gap-1.5 bg-[#F6F8FC] p-2 rounded-lg text-center text-xs font-tabular">
                  <div>
                    <div className="text-[10px] text-[#6F7C92]">Awal</div>
                    <div className="font-bold text-[#182338]">{p.awal + p.tambah}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6F7C92]">Sisa</div>
                    <div className="font-black text-[#1749B5]">{p.sisa}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6F7C92]">Terjual</div>
                    <div className="font-bold text-emerald-700">{p.terjual}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6F7C92]">Laba</div>
                    <div className="font-bold text-emerald-700">{Money.ribuan(p.laba)}</div>
                  </div>
                </div>

                {/* Action Buttons: Jual 1 Unit & Tambah Stok */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setKeypadProduct(p);
                      setIsKeypadOpen(true);
                    }}
                    className="flex-1 py-2 text-xs font-bold text-[#1749B5] bg-[#EBF1FD] rounded-lg border border-[#1749B5]/20 btn-press"
                  >
                    + Stok
                  </button>

                  <button
                    onClick={() => handleSellOne(p)}
                    className="flex-2 py-2 text-xs font-bold text-white bg-[#1749B5] hover:bg-[#09275F] rounded-lg flex items-center justify-center gap-1.5 shadow-xs btn-press"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Jual 1 Unit ({Money.ribuan(p.jual)})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Tab Laporan Terjual */
        <div className="p-3 space-y-2">
          <div className="bg-white rounded-xl border border-[#E0E7F2] p-3 divide-y divide-[#E0E7F2]">
            <div className="grid grid-cols-12 pb-2 text-[11px] font-bold text-[#6F7C92] uppercase">
              <div className="col-span-6">Model</div>
              <div className="col-span-3 text-center">Terjual</div>
              <div className="col-span-3 text-right">Laba</div>
            </div>
            {products.filter(p => p.terjual > 0).map(p => (
              <div key={p.id} className="grid grid-cols-12 py-2 text-xs font-tabular items-center">
                <div className="col-span-6 font-bold text-[#09275F]">{p.model}</div>
                <div className="col-span-3 text-center font-bold text-emerald-700">{p.terjual} unit</div>
                <div className="col-span-3 text-right font-black text-[#1749B5]">{Money.ribuan(p.laba)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Tambah Produk Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 space-y-3 shadow-2xl">
            <h3 className="font-extrabold text-base text-[#182338]">Tambah Produk {category} Baru</h3>
            <div>
              <label className="text-xs font-bold text-[#6F7C92]">Nama / Model Produk:</label>
              <input
                type="text"
                placeholder="Contoh: Kabel Charger Fast"
                value={newModel}
                onChange={e => setNewModel(e.target.value)}
                className="w-full mt-1 p-2.5 border border-[#E0E7F2] rounded-lg text-sm font-semibold focus:ring-1 focus:ring-[#1749B5] outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#6F7C92]">Stok Awal:</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={e => setNewStock(e.target.value)}
                  className="w-full mt-1 p-2 border border-[#E0E7F2] rounded-lg text-sm font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6F7C92]">Modal (k):</label>
                <input
                  type="number"
                  value={newCost}
                  onChange={e => setNewCost(e.target.value)}
                  className="w-full mt-1 p-2 border border-[#E0E7F2] rounded-lg text-sm font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6F7C92]">Jual (k):</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={e => setNewPrice(e.target.value)}
                  className="w-full mt-1 p-2 border border-[#E0E7F2] rounded-lg text-sm font-bold text-center"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-[#6F7C92] bg-slate-100 rounded-lg btn-press"
              >
                Batal
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#1749B5] rounded-lg btn-press"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Stok Cepat */}
      <KeypadModal
        isOpen={isKeypadOpen}
        title={`Tambah Stok ${keypadProduct?.model}`}
        initialValue={5}
        onClose={() => setIsKeypadOpen(false)}
        onConfirm={(val) => {
          if (keypadProduct && val > 0) {
            handleAddStock(keypadProduct, val);
          }
        }}
      />
    </div>
  );
};

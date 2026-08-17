/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ShoppingCart, Camera } from 'lucide-react';
import { Product, CartItem } from './types';
import { Html5QrcodeScanner } from 'html5-qrcode';

const SHEET_ID = '1otN1s4qs_QfF7jfK4uy-uTFOKhflZUXao7vTLrzQBK8';
const PUBLIC_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

interface ProductCardProps {
  item: Product;
  onAddToCart: (item: CartItem) => void;
  key?: React.Key;
}

function ProductCard({ item, onAddToCart }: ProductCardProps) {
  const hasHalf = item.halfPrice !== '-' && item.halfPrice !== '';
  const [choice, setChoice] = useState<'Half' | 'Full'>(hasHalf ? 'Half' : 'Full');

  const handleAdd = () => {
     const price = choice === 'Half' ? parseInt(item.halfPrice) : parseInt(item.fullPrice);
     onAddToCart({ ...item, selectedPortion: choice, selectedPrice: price });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">{item.category}</span>
          <h3 className="text-base font-bold text-gray-800 mt-1">{item.english}</h3>
          <p className="text-xs text-gray-500 font-medium">{item.hindi}</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t flex flex-col gap-2 text-sm">
        {hasHalf ? (
          <div className="flex justify-between items-center text-xs">
            <label className="flex items-center gap-1">
              <input type="radio" checked={choice === 'Half'} onChange={() => setChoice('Half')} />
              <span>Half: ₹{item.halfPrice}</span>
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={choice === 'Full'} onChange={() => setChoice('Full')} />
              <span>Full: ₹{item.fullPrice}</span>
            </label>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Price</span>
            <span className="font-bold text-red-600 text-base">₹{item.fullPrice}</span>
          </div>
        )}
        <button 
          onClick={handleAdd}
          className="w-full mt-2 bg-red-600 text-white py-2 rounded-full hover:bg-red-700 transition flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
export default function App() {
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notification, setNotification] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemStock, setCustomItemStock] = useState('');
  const [customItemQuantity, setCustomItemQuantity] = useState('');
  const [gstPercentage, setGstPercentage] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [paymentMode, setPaymentMode] = useState('Offline');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [barcodeInputValue, setBarcodeInputValue] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const startScanner = () => {
    setShowCamera(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render((decodedText) => {
        setBarcodeInputValue(decodedText);
        // Force DOM update
        const input = document.getElementById('barcodeInput') as HTMLInputElement;
        if(input) input.value = decodedText;

        setShowCamera(false);
        scanner.clear();
        
        // Focus on next input
        setTimeout(() => {
          (document.getElementById('customItemNameInput') as HTMLInputElement)?.focus();
        }, 100);

        // Simulate enter key to trigger search/lookup
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        document.getElementById('barcodeInput')?.dispatchEvent(event);
      }, (error) => {});
      scannerRef.current = scanner;
    }, 100);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const barcode = e.currentTarget.value;
      const savedProducts = JSON.parse(localStorage.getItem('custom_products') || '{}');
      if (savedProducts[barcode]) {
         const product = savedProducts[barcode];
         const newItem: CartItem = {
           id: Date.now(),
           category: 'Custom',
           hindi: '',
           english: product.name,
           portion: 'Custom',
           halfPrice: '-',
           fullPrice: '-',
           selectedPortion: 'Custom',
           selectedPrice: parseInt(product.price) || 0,
           stock: parseInt(product.stock) || 0
         };
         setCart([...cart, newItem]);
         setBarcodeInputValue('');
      } else {
         setScannedBarcode(barcode);
         setBarcodeInputValue(barcode);
         (document.getElementById('customItemNameInput') as HTMLInputElement)?.focus();
      }
    }
  };

  const addCustomItem = async () => {
    if (customItemName && customItemPrice) {
      if (scannedBarcode) {
         const savedProducts = JSON.parse(localStorage.getItem('custom_products') || '{}');
         savedProducts[scannedBarcode] = { name: customItemName, price: customItemPrice, stock: customItemStock };
         localStorage.setItem('custom_products', JSON.stringify(savedProducts));
         setScannedBarcode('');
      }

      const billData = {
          bill_no: barcodeInputValue || Date.now().toString(),
          item_name: customItemName,
          price: customItemPrice,
          qty: customItemQuantity,
          stock: customItemStock,
          gst: gstPercentage
      };

      try {
        await fetch('/api/save-custom-bill', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(billData),
        });
      } catch (error) {
        console.error("Error saving to sheet:", error);
      }

      const newItem: CartItem = {
        id: Date.now(),
        category: 'Custom',
        hindi: '',
        english: customItemName + (customItemQuantity ? ` (${customItemQuantity})` : ''),
        portion: 'Custom',
        halfPrice: '-',
        fullPrice: '-',
        selectedPortion: 'Custom',
        selectedPrice: parseInt(customItemPrice) || 0,
        stock: parseInt(customItemStock) || 0
      };
      setCart([...cart, newItem]);
      setCustomItemName('');
      setCustomItemPrice('');
      setCustomItemStock('');
      setCustomItemQuantity('');
      setGstPercentage('');
      setBarcodeInputValue('');
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.selectedPrice, 0);
  const gstAmount = (subtotal * (parseFloat(gstPercentage) || 0)) / 100;
  const discountAmount = (subtotal * (parseFloat(discountPercentage) || 0)) / 100;
  const totalWithGst = subtotal + gstAmount - discountAmount;

  const shareToWhatsApp = () => {
    const total = totalWithGst;
    const gstInfo = gstPercentage ? `\nGST (${gstPercentage}%): ₹${gstAmount.toFixed(2)}` : '';
    const discountInfo = discountPercentage ? `\nDiscount (${discountPercentage}%): -₹${discountAmount.toFixed(2)}` : '';
    const orderItems = cart.map(item => `${item.english} (${item.selectedPortion}) - ₹${item.selectedPrice}${item.stock ? ` [Stock: ${item.stock}]` : ''}`).join('\n');
    const message = `Order from: ${customerName}\nPhone: ${customerPhone}\nPayment Mode: ${paymentMode}\n\nOrder Details:\n${orderItems}${gstInfo}${discountInfo}\n\nSubtotal: ₹${subtotal}\nTotal: ₹${total.toFixed(2)}`;
    
    const cleanedPhone = customerPhone.replace(/[^0-9]/g, '');
    let formattedPhone = cleanedPhone;
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('0')) {
      formattedPhone = '91' + formattedPhone.slice(1);
    }
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      setSearchTerm(transcript);
    };

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }
  }, [isListening]);

  useEffect(() => {
    const fetchSheetData = async () => {
      try {
        const response = await fetch(PUBLIC_URL);
        const data = await response.text();
        
        const lines = data.split('\n');
        const parsedProducts: Product[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim());

          if (row.length >= 8) {
            parsedProducts.push({
              id: parseInt(row[0]),
              category: row[2] || 'Other',
              hindi: row[3] || '',
              english: row[4] || '',
              portion: row[5] || '-',
              halfPrice: row[6] || '-',
              fullPrice: row[7] || '-'
            });
          }
        }
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Error fetching sheet:', error);
        setError('Sheet load nahi ho paayi. Kripya check karein.');
      } finally {
        setLoading(false);
      }
    };
    fetchSheetData();
  }, []);

  const categories = useMemo(() => ['All', ...new Set(products.map(item => item.category))], [products]);

  const addToCart = (item: CartItem) => {
    setCart([...cart, item]);
    setNotification(`${item.english} add ho gaya!`);
    setTimeout(() => setNotification(null), 2000);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      const matchesCategory = (selectedCategory === 'All' || item.category === selectedCategory);
      const matchesSearch = item.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.hindi.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, products]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-red-700 text-white py-6 px-4 shadow-md text-center relative">
        <h1 className="text-3xl font-bold">Aman Sweet</h1>
        <p className="text-sm text-red-200 mt-1">Live Digital Menu & Catalogue</p>
        
        <button onClick={() => setShowCart(true)} className="absolute right-4 top-6 bg-white text-red-700 p-2 rounded-full shadow-md">
           <ShoppingCart size={20} />
           {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-900 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cart.length}</span>}
        </button>

        <div className="max-w-md mx-auto mt-4 relative">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search item (e.g. Samosa, Chowmein, Pizza)..." 
            className="w-full px-4 py-2.5 rounded-full text-gray-800 focus:outline-none shadow-md border-2 border-red-300 pr-12"
          />
          <button 
            onClick={() => setIsListening(!isListening)}
            className={`absolute right-3 top-2.5 ${isListening ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}
          >
            🎤
          </button>
        </div>
      </header>

      {showCart && (
        <div id="cart-modal" className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowCart(false)}>
          <div className="w-full bg-white h-full p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Cart</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setCart([])} className="text-sm text-red-600 font-bold hover:text-red-800">Clear</button>
                <button onClick={() => setShowCart(false)} className="text-gray-500 font-bold">Close</button>
              </div>
            </div>
            
            <div className='space-y-3 mb-8'>
              {cart.length === 0 ? <p className="text-gray-500">Cart khali hai.</p> : (
                  <>
                      {cart.map((item, index) => (
                          <div key={index} className="flex justify-between border-b pb-2 items-center">
                              <div>
                                  <p className='font-bold'>{item.english}</p>
                                  <p className='text-xs text-gray-500'>({item.selectedPortion})</p>
                              </div>
                              <div className="flex items-center gap-3">
                                  <span className="font-bold">₹{item.selectedPrice}</span>
                                  <button onClick={() => removeFromCart(index)} className="text-red-500 font-bold hover:text-red-700">✕</button>
                              </div>
                          </div>
                      ))}
                      
                      <div className='pt-4 text-xl font-bold flex flex-col gap-2'>
                          <div className='flex justify-between'>
                            <span>Subtotal:</span>
                            <span>₹{subtotal}</span>
                          </div>
                          <div className='flex justify-between items-center text-base'>
                            <span>GST (%):</span>
                            <input type="number" value={gstPercentage} onChange={(e) => setGstPercentage(e.target.value)} className="w-16 border p-1 rounded text-right" />
                          </div>
                          <div className='flex justify-between items-center text-base'>
                            <span>Discount (%):</span>
                            <input type="number" value={discountPercentage} onChange={(e) => setDiscountPercentage(e.target.value)} className="w-16 border p-1 rounded text-right" />
                          </div>
                          <div className='flex justify-between text-2xl border-t pt-2'>
                            <span>Total:</span>
                            <span>₹{totalWithGst.toFixed(2)}</span>
                          </div>
                      </div>
                      
                      <div className='mt-6 space-y-3'>
                          <input type="text" placeholder="Aapka Naam" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border p-2 rounded" />
                          <input type="tel" placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border p-2 rounded" />
                          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full border p-2 rounded">
                            <option value="Offline">Offline Payment</option>
                            <option value="Online">Online Payment</option>
                          </select>
                          <button onClick={shareToWhatsApp} className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">WhatsApp par order bhejein 🛒</button>
                          <button onClick={() => window.print()} className="w-full bg-gray-600 text-white py-2 rounded font-bold hover:bg-gray-700">Print Receipt 🖨️</button>
                      </div>
                  </>
              )}
            </div>

            <div className='bg-gray-100 p-4 rounded-xl mt-4 w-full'>
                <p className='font-bold text-base mb-4'>Naya Bill Banayein (Custom)</p>
                
                <div className="flex gap-2 mb-3">
                  <input type="text" id="barcodeInput" value={barcodeInputValue} onChange={(e) => setBarcodeInputValue(e.target.value)} placeholder="Scan Barcode / QR Code" className="flex-1 border p-2.5 rounded-lg text-sm" onKeyDown={handleBarcodeScan} />
                  <button onClick={startScanner} className="bg-white border border-gray-300 p-2.5 rounded-lg flex items-center gap-1 hover:bg-gray-50 text-sm">
                    <Camera size={16} /> Scan
                  </button>
                </div>
                
                {showCamera && <div id="reader" className="mb-4 w-full"></div>}

                <div className='flex gap-2 mb-3'>
                    <input type="text" id="customItemNameInput" placeholder="Item Name" value={customItemName} onChange={(e) => setCustomItemName(e.target.value)} className="flex-1 border p-2.5 rounded-lg text-sm" />
                    <button onClick={addCustomItem} className="bg-red-600 text-white px-6 rounded-lg font-bold hover:bg-red-700">+</button>
                </div>
                
                <div className='grid grid-cols-4 gap-2'>
                    <input type="number" placeholder="Price" value={customItemPrice} onChange={(e) => setCustomItemPrice(e.target.value)} className="border p-2.5 rounded-lg text-sm w-full" />
                    <input type="text" placeholder="Qty" value={customItemQuantity} onChange={(e) => setCustomItemQuantity(e.target.value)} className="border p-2.5 rounded-lg text-sm w-full" />
                    <input type="number" placeholder="Stock" value={customItemStock} onChange={(e) => setCustomItemStock(e.target.value)} className="border p-2.5 rounded-lg text-sm w-full" />
                    <input type="number" placeholder="GST%" value={gstPercentage} onChange={(e) => setGstPercentage(e.target.value)} className="border p-2.5 rounded-lg text-sm w-full" />
                </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent"></div>
          <p className="text-gray-500 mt-2 font-medium">Google Sheet se menu load ho raha hai...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)} 
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-sm transition ${selectedCategory === cat ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border hover:border-red-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <main className="max-w-6xl mx-auto px-4 pb-12">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">Koi item nahi mila.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((item: Product) => (
                  <ProductCard key={item.id} item={item} onAddToCart={addToCart} />
                ))}
              </div>
            )}
          </main>
        </>
      )}
      
      {notification && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg z-[100]">
          {notification}
        </div>
      )}
    </div>
  );
}

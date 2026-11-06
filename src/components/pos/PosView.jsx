import React, { useState } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  Plus, 
  Smartphone, 
  Coins, 
  CheckCircle2, 
  CreditCard, 
  Receipt, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

export default function PosView({ 
  movimientos = [], 
  onRegisterSale,
  onRefresh 
}) {
  const [metodoPago, setMetodoPago] = useState('YAPE');
  const [customConcepto, setCustomConcepto] = useState('');
  const [customMonto, setCustomMonto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick product catalog
  const fastProducts = [
    { concepto: 'Agua Mineral San Luis 625ml', monto: 2.00, icon: '💧' },
    { concepto: 'Rehidratante Sporade 500ml', monto: 5.00, icon: '⚡' },
    { concepto: 'Batido de Proteína Whey Isolate', monto: 8.00, icon: '🥤' },
    { concepto: 'Pase Diario de Entrenamiento', monto: 5.00, icon: '🎟️' },
    { concepto: 'Bebida Energizante Monster', monto: 9.00, icon: '🔋' },
    { concepto: 'Abono Parcial a Deuda / Membresía', monto: 20.00, icon: '💳' },
  ];

  const handleQuickSale = async (prod) => {
    setIsSubmitting(true);
    try {
      if (onRegisterSale) {
        await onRegisterSale({
          tipo_movimiento: 'INGRESO',
          concepto: prod.concepto,
          monto: prod.monto,
          metodo_pago: metodoPago
        });
      }
    } catch (e) {
      console.error(e);
      alert('Error al registrar venta rápida');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSale = async (e) => {
    e.preventDefault();
    if (!customConcepto.trim() || !customMonto) return;

    setIsSubmitting(true);
    try {
      if (onRegisterSale) {
        await onRegisterSale({
          tipo_movimiento: 'INGRESO',
          concepto: customConcepto.trim(),
          monto: parseFloat(customMonto),
          metodo_pago: metodoPago
        });
      }
      setCustomConcepto('');
      setCustomMonto('');
    } catch (e) {
      console.error(e);
      alert('Error al registrar movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cálculos de cuadre diario
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const hoyMovimientos = movimientos.filter(m => m.fecha_hora?.startsWith(todayStr));

  const totalHoy = hoyMovimientos.reduce((acc, m) => acc + Number(m.monto || 0), 0);
  const digitalHoy = hoyMovimientos
    .filter(m => ['YAPE', 'PLIN'].includes(m.metodo_pago))
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);
  const efectivoHoy = hoyMovimientos
    .filter(m => m.metodo_pago === 'EFECTIVO')
    .reduce((acc, m) => acc + Number(m.monto || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-none border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-none bg-gray-100 text-gray-900">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <span>Punto de Venta Rápido y Cuadre de Caja</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Registro de venta de bebidas, suplementos y pases diarios con arqueo de Yape/Plin vs Efectivo.
          </p>
        </div>

        <div className="text-xs text-gray-400 font-mono">
          Fecha: <strong className="text-gray-800">{format(new Date(), 'dd/MM/yyyy')}</strong>
        </div>
      </div>

      {/* Arqueo de Caja Diario Contiguo (Linear / Apollo Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-gray-200 bg-white rounded-none shadow-xs divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        {/* Total General */}
        <div className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Total Ingresos Hoy
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-gray-950">
            S/ {totalHoy.toFixed(2)}
          </div>
          <span className="text-xs text-gray-500 mt-1 block font-mono">
            {hoyMovimientos.length} transacciones registradas
          </span>
        </div>

        {/* Digital (Yape / Plin) */}
        <div className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Billeteras (Yape / Plin)
            </span>
            <Smartphone className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-gray-950">
            S/ {digitalHoy.toFixed(2)}
          </div>
          <span className="text-xs text-emerald-700 font-medium mt-1 block">
            En cuenta bancaria
          </span>
        </div>

        {/* Efectivo en Gaveta */}
        <div className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Efectivo en Gaveta
            </span>
            <Coins className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-gray-950">
            S/ {efectivoHoy.toFixed(2)}
          </div>
          <span className="text-xs text-amber-800 font-medium mt-1 block">
            Efectivo físico
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Quick Sales Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Payment Method Selector */}
          <div className="bg-white p-3.5 sm:p-4 rounded-none border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-semibold text-gray-700">
              Método de Pago para Venta Rápida:
            </span>
            <div className="flex gap-1.5 font-mono text-xs font-bold bg-gray-100 p-1 rounded-none">
              {['YAPE', 'PLIN', 'EFECTIVO'].map((metodo) => (
                <button
                  key={metodo}
                  type="button"
                  onClick={() => setMetodoPago(metodo)}
                  className={`px-3 py-1 rounded-none transition-all ${
                    metodoPago === metodo
                      ? 'bg-white text-gray-950 shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {metodo}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Buttons Grid (Apollo Style Product Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {fastProducts.map((prod, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleQuickSale(prod)}
                className="bg-white p-3.5 rounded-none border border-gray-200 hover:border-gray-950 hover:shadow-xs transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
              >
                <div>
                  <div className="text-xl mb-1.5">{prod.icon}</div>
                  <h3 className="text-xs font-semibold text-gray-900 group-hover:text-black leading-snug">
                    {prod.concepto}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-gray-950">
                    S/ {prod.monto.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    +{metodoPago}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Custom Sale Form */}
          <form onSubmit={handleCustomSale} className="bg-white p-4 rounded-none border border-gray-200 shadow-xs space-y-3">
            <span className="text-xs font-bold text-gray-700 block">
              Registrar Venta o Ingreso Personalizado
            </span>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs">
              <input
                type="text"
                value={customConcepto}
                onChange={(e) => setCustomConcepto(e.target.value)}
                placeholder="Concepto (ej. Barra Energética, Toalla...)"
                className="md:col-span-7 px-3 py-2 rounded-none border border-gray-200 outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950"
              />
              <input
                type="number"
                step="0.50"
                value={customMonto}
                onChange={(e) => setCustomMonto(e.target.value)}
                placeholder="Monto S/"
                className="md:col-span-3 px-3 py-2 rounded-none border border-gray-200 font-mono font-bold outline-none focus:border-gray-950 focus:ring-1 focus:ring-gray-950"
              />
              <button
                type="submit"
                disabled={isSubmitting || !customConcepto || !customMonto}
                className="md:col-span-2 px-3 py-2 rounded-none bg-gray-950 hover:bg-black text-white font-semibold transition-all active:scale-[0.98]"
              >
                Registrar
              </button>
            </div>
          </form>
        </div>

        {/* Today's Transactions Log (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-none border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-500" />
                <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
                  Movimientos del Día
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-none">
                {hoyMovimientos.length} ventas
              </span>
            </div>

            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {hoyMovimientos.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs italic">
                  Aún no se han registrado movimientos de caja hoy.
                </div>
              ) : (
                hoyMovimientos.map((mov) => (
                  <div 
                    key={mov.id} 
                    className="p-2.5 rounded-none border border-gray-100 hover:bg-gray-50/70 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-gray-950 line-clamp-1">
                        {mov.concepto}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{mov.fecha_hora ? format(new Date(mov.fecha_hora), 'HH:mm') : 'Hoy'}</span>
                        <span className="px-1.5 py-0.2 rounded-none bg-gray-100 text-gray-700 border border-gray-200 font-bold text-[10px]">
                          {mov.metodo_pago}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-gray-950">
                        +S/ {Number(mov.monto).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


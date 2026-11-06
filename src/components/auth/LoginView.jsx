import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  User, 
  Dumbbell, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Boxes, 
  Check, 
  AlertCircle,
  Terminal,
  Activity
} from 'lucide-react';

export default function LoginView({ onLogin, gymName = 'VitalFit Gym Club', alertSummary = null }) {
  const [username, setUsername] = useState('admin@vitalfit.pe');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState('ADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const canvasRef = useRef(null);

  // Efecto dinámico de Fondo Pixeleado con Cubos Negros (Black Pixel Cubes Matrix)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generar grilla de cubos negros y píxeles geométricos
    const cubeSize = 24; // tamaño de cada cubo en px
    const cols = Math.ceil(width / cubeSize);
    const rows = Math.ceil(height / cubeSize);

    // Puntos flotantes / cubos oscuros con comportamiento dinámico
    const cubes = [];
    const numCubes = Math.min(120, Math.floor((cols * rows) * 0.08));

    for (let i = 0; i < numCubes; i++) {
      cubes.push({
        col: Math.floor(Math.random() * cols),
        row: Math.floor(Math.random() * rows),
        size: Math.random() > 0.7 ? 2 : 1, // 1x1 o 2x2 cubos
        opacity: Math.random() * 0.45 + 0.08,
        speed: Math.random() * 0.015 + 0.005,
        phase: Math.random() * Math.PI * 2,
        isIsometric: Math.random() > 0.65 // Algunos renderizados como cubos 3D isométricos negros
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.fillStyle = '#F9FAFB'; // Lienzo base limpio y profesional
      ctx.fillRect(0, 0, width, height);

      // 1. Dibujar sutil malla de cuadrícula de precisión (Hairline grid)
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 0.5;

      // Líneas verticales
      for (let x = 0; x <= width; x += cubeSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Líneas horizontales
      for (let y = 0; y <= height; y += cubeSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Dibujar cubos negros pixelados flotantes
      cubes.forEach((cube) => {
        const x = cube.col * cubeSize;
        const y = cube.row * cubeSize;
        const s = cube.size * cubeSize;

        // Oscilación sutil de opacidad
        const currentOpacity = Math.max(0.04, Math.min(0.85, cube.opacity + Math.sin(time + cube.phase) * 0.2));

        // Interacción con mouse: los cubos cercanos aumentan su densidad negra
        const dist = Math.hypot(x + s / 2 - mouseX, y + s / 2 - mouseY);
        const mouseFactor = dist < 180 ? (1 - dist / 180) * 0.4 : 0;
        const finalOpacity = Math.min(0.9, currentOpacity + mouseFactor);

        if (cube.isIsometric) {
          // Cubo 3D Isométrico negro pixelado
          const w = s * 0.8;
          const h = s * 0.5;
          const cx = x + cubeSize / 2;
          const cy = y + cubeSize / 2;

          // Cara Superior (Top)
          ctx.fillStyle = `rgba(31, 41, 55, ${finalOpacity})`;
          ctx.beginPath();
          ctx.moveTo(cx, cy - h);
          ctx.lineTo(cx + w, cy - h / 2);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx - w, cy - h / 2);
          ctx.closePath();
          ctx.fill();

          // Cara Izquierda (Left)
          ctx.fillStyle = `rgba(17, 24, 39, ${finalOpacity * 1.1})`;
          ctx.beginPath();
          ctx.moveTo(cx - w, cy - h / 2);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx, cy + h);
          ctx.lineTo(cx - w, cy + h / 2);
          ctx.closePath();
          ctx.fill();

          // Cara Derecha (Right)
          ctx.fillStyle = `rgba(3, 7, 18, ${finalOpacity * 1.25})`;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + w, cy - h / 2);
          ctx.lineTo(cx + w, cy + h / 2);
          ctx.lineTo(cx, cy + h);
          ctx.closePath();
          ctx.fill();

          // Borde hairline del cubo
          ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity * 0.25})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else {
          // Cubo / Píxel 2D negro sólido de alta densidad
          ctx.fillStyle = `rgba(3, 7, 18, ${finalOpacity})`;
          ctx.fillRect(x + 1, y + 1, s - 2, s - 2);

          // Sub-píxel de acento blanco sutil en esquina (estilo pixel art)
          if (finalOpacity > 0.4) {
            ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity * 0.4})`;
            ctx.fillRect(x + 2, y + 2, 2, 2);
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa tu usuario y clave.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onLogin) {
        onLogin({
          username: username.trim(),
          role,
          name: role === 'ADMIN' ? 'Administrador General' : 'Recepción Mostrador',
          loggedAt: new Date().toISOString()
        });
      }
    }, 450);
  };

  const handleFillDemo = (type) => {
    if (type === 'ADMIN') {
      setUsername('admin@vitalfit.pe');
      setPassword('admin123');
      setRole('ADMIN');
    } else {
      setUsername('recepcion@vitalfit.pe');
      setPassword('recepcion123');
      setRole('RECEPCION');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 select-none overflow-hidden bg-[#F9FAFB]">
      {/* Canvas de Fondo Pixeleado con Cubos Negros */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-auto"
      />

      {/* Tarjeta de Autenticación Rectangular estilo Apollo / Linear */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-none border border-gray-300 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado de Marca con Icono Pixeleado */}
        <div className="text-center space-y-2">
          {/* Logo con Arte de Píxeles en Cubos Negros */}
          <div className="inline-flex p-3 bg-gray-950 text-white rounded-none shadow-md mb-1 relative group">
            <Dumbbell className="w-6 h-6 stroke-[2.2]" />
            {/* Pequeños cubos decorativos en las esquinas */}
            <span className="absolute -top-1 -left-1 w-2 h-2 bg-gray-950 border border-white"></span>
            <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-gray-950 border border-white"></span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold font-sans text-gray-950 tracking-tight">
            {gymName}
          </h1>

          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
              SISTEMA ERP & CRM • ACCESO DE PERSONAL
            </span>
          </div>

          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Ingresa tus credenciales para acceder a la gestión de membresías, recepción y caja.
          </p>
        </div>

        {/* Mensaje de Error si aplica */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-none text-rose-900 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Rol en Pestañas Rectangulares */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Rol de Operación
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-none border border-gray-200">
              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`py-1.5 text-xs font-semibold rounded-none transition-colors ${
                  role === 'ADMIN'
                    ? 'bg-gray-950 text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                Administrador
              </button>
              <button
                type="button"
                onClick={() => setRole('RECEPCION')}
                className={`py-1.5 text-xs font-semibold rounded-none transition-colors ${
                  role === 'RECEPCION'
                    ? 'bg-gray-950 text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-950'
                }`}
              >
                Recepción & Caja
              </button>
            </div>
          </div>

          {/* Campo Usuario / Correo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Usuario o Correo Institucional
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@vitalfit.pe"
                className="w-full pl-9 pr-3 py-2 rounded-none border border-gray-300 text-xs font-mono text-gray-900 outline-none focus:border-gray-950 focus:ring-0 transition-all placeholder:font-sans placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Clave de Seguridad / PIN
              </label>
              <span className="text-[10px] font-mono text-gray-400">PIN 8 dígitos</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 rounded-none border border-gray-300 text-xs font-mono text-gray-900 outline-none focus:border-gray-950 focus:ring-0 transition-all placeholder:font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                title={showPassword ? 'Ocultar clave' : 'Ver clave'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Botón de Entrada Principal */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-none bg-gray-950 hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-none animate-spin" />
                <span>Iniciando Sesión...</span>
              </>
            ) : (
              <>
                <span>Iniciar Sesión en el Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Accesos Rápidos para Prueba / Demostración */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
            <span className="font-mono text-[10px] uppercase">Relleno Rápido de Prueba:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('ADMIN')}
              className="py-1 px-2 rounded-none border border-gray-200 bg-gray-50 hover:bg-white text-gray-700 text-[11px] font-mono font-semibold transition-colors text-center"
            >
              Demo Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('RECEPCION')}
              className="py-1 px-2 rounded-none border border-gray-200 bg-gray-50 hover:bg-white text-gray-700 text-[11px] font-mono font-semibold transition-colors text-center"
            >
              Demo Recepción
            </button>
          </div>
        </div>

        {/* Pie de Seguridad */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-mono">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sesión Local Segura</span>
          </div>
          <span>v2.4 Enterprise</span>
        </div>
      </div>
    </div>
  );
}


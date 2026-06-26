import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { ToastContainer } from '@/components/ui/Toast'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ToastContainer />
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-2xl font-bold text-white">PosPago</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Bienvenido de vuelta</h1>
          <p className="text-slate-400 mt-1 text-sm">Ingresa a tu cuenta</p>
        </div>

        {/* Formulario */}
        <div className="bg-[#1A1A3E] rounded-2xl border border-white/10 p-6">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}

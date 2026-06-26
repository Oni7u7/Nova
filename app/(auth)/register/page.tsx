import Link from 'next/link'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ToastContainer } from '@/components/ui/Toast'

export default function RegisterPage() {
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
          <h1 className="text-2xl font-bold text-white">Crea tu cuenta</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Cobra en dólares desde tu celular
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-[#1A1A3E] rounded-2xl border border-white/10 p-6">
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

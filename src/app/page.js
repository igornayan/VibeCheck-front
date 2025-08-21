'use client'

import Image from 'next/image';
import Logo from '../../public/vibe-check-logo.png'

export default function LoginForm() {
  return (
    <div className='flex flex-col p-4 pb-16 bg-slate-400 rounded-lg h-full justify-between'>
      <div className="flex flex-col items-center">
        <Image
          src={Logo}
          alt="Logo Vibe Check"
          width={192}
          height={192}
          className="mx-auto mb-4 rounded-lg"
        />

        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Entre na sua conta
          </h1>
          <p className="text-sm text-gray-600">
            Conecte-se usando sua conta do Google
          </p>
        </div>
        
      </div>
        <button
          type="button"
          onClick={() => window.location.href = "http://localhost:8080/login"}
          className="w-full py-3 px-4 rounded-md bg-[#394779] text-white font-medium
                           border border-transparent transition-colors duration-200
                           hover:bg-[#5c6bc0] focus:outline-none focus:ring-2
                           focus:ring-offset-2 focus:ring-[#5c6bc0] focus:ring-offset-white"
        >
          Entrar com Google
        </button>
    </div>
  );
}


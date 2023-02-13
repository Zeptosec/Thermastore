import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

export default function navbar({ isUploading }: any) {
  const [active, setActive] = useState(false);
  const ham = useRef<any>(null);
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  function clicked(e: MouseEvent) {
    if (ham.current && !ham.current.contains(e.target))
      setActive(false);
  }

  useEffect(() => {
    document.addEventListener('mouseup', e => clicked(e));
    return () => {
      document.removeEventListener('mouseup', e => clicked(e));
    }
  }, []);
  const handleLogout = async () => {
    if (isUploading) return;
    await supabase.auth.signOut();
    router.push("/");
  }

  const handleClick = () => {
    if (active) {
      setActive(false);
    } else {
      setActive(true);
    }
  };
  return (
    <nav className='flex select-none items-center z-50 flex-wrap justify-between absolute p-3 w-full'>
      <div className="py-0.5">
        <Link href='/' className={isUploading ? "pointer-events-none" : ""}>
          <div className='inline-flex items-center p-2 '>
            <span className='text-xl text-white font-bold uppercase tracking-wide'>
              Thermastore
            </span>
          </div>
        </Link>
      </div>
      <div className="grid absolute right-3">
        <button ref={ham}
          className=' inline-flex p-3 hover:bg-navhover rounded lg:hidden text-white ml-auto hover:text-white outline-none'
          onClick={handleClick}
        >
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>
        {/*Note that in this div we will use a ternary operator to decide whether or not to display the content of the div  */}
        <div
          className={`${active ? '' : 'hidden'
            }   w-full lg:inline-flex lg:flex-grow lg:w-auto`}
        >
          <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center flex flex-col lg:h-auto items-end'>
            {!user ? <><Link href='/register' className={isUploading ? "pointer-events-none" : ""}>
              <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-navhover hover:text-cyan-300 transition-colors duration-200 '>
                Register
              </div>
            </Link>
              <Link href='/login' className={isUploading ? "pointer-events-none" : ""}>
                <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-navhover hover:text-cyan-300 transition-colors duration-200'>
                  Login
                </div>
              </Link></> : <>
              <div className="lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center">
                {user.email}
              </div>
              <button onClick={handleLogout} disabled={isUploading} className={isUploading ? "pointer-events-none" : ""}>
                <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-navhover hover:text-cyan-300 transition-colors duration-200'>
                  Logout
                </div>
              </button>
              <Link href='/files' className={isUploading ? "pointer-events-none" : ""}>
                <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-navhover hover:text-cyan-300 transition-colors duration-200'>
                  Files
                </div>
              </Link>
              <Link href='/settings' className={isUploading ? "pointer-events-none" : ""}>
                <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-navhover hover:text-cyan-300 transition-colors duration-200'>
                  Settings
                </div>
              </Link>
            </>}
            <Link href='/' className={isUploading ? "pointer-events-none" : ""}>
              <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-navhover hover:text-cyan-300 transition-colors duration-200'>
                Upload
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
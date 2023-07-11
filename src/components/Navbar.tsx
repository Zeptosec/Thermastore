import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { FileActionType, useFileManager } from "@/context/FileManagerContext";
import FileManager from "./FileManager/FileManager";
import IconCloud from "@/icons/IconCloud";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function navbar() {
  const [active, setActive] = useState(false);
  const supabase = useSupabaseClient();
  const ham = useRef<any>(null);
  const router = useRouter();
  const fm = useFileManager();
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
    const upCnt = fm?.state.uploading.filter(w => !w.finished).length;
    if (upCnt && upCnt > 0) return;
    await supabase.auth.signOut();
    localStorage.removeItem('dhook');
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
    <nav className='flex select-none items-center z-50 flex-wrap justify-between absolute p-3 w-full text-quaternary'>
      <div className="w-full absolute top-0 left-0 -z-10">
        <svg preserveAspectRatio="none" className="transition-all absolute" height={90} width="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path id="wave" fill="currentColor" className="text-primary" fillOpacity="1" d="M0,256L48,261.3C96,267,192,277,288,282.7C384,288,480,288,576,272C672,256,768,224,864,213.3C960,203,1056,213,1152,229.3C1248,245,1344,267,1392,277.3L1440,288L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>
      <div className="py-0.5">
        <Link href='/'>
          <div className='inline-flex items-center p-2 gap-2'>
            <IconCloud className="" width={30} colorClass="quaternary" />
            <span className=' text-xl font-bold uppercase tracking-wide'>
              Thermastore
            </span>
          </div>
        </Link>
      </div>
      <div className="lg:flex grid absolute right-3 top-3">
        <div className=" inline-flex p-3 gap-4">
          <div className="relative flex justify-end flex-1">
            <FileManager fm={fm} user={fm ? fm.user : null} />
          </div>
          <button ref={ham}
            className='group rounded lg:hidden text-white ml-auto outline-none'
            onClick={handleClick}
          >
            <svg
              className='w-6 h-6'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                fill="currentColor"
                className="text-quaternary group-hover:text-tertiary transition-colors"
                d='M4 6h16M4 12h16M4 18h16'
              />
            </svg>
          </button>
        </div>

        {/*Note that in this div we will use a ternary operator to decide whether or not to display the content of the div  */}
        <div
          className={`${active ? '' : 'hidden'
            }   w-full lg:inline-flex lg:flex-grow lg:w-auto lg:bg-transparent bg-primary rounded-b-xl p-2 -mt-0.5`}
        >
          <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center flex flex-col lg:h-auto items-end text-quaternary'>
            {!fm?.user ? <><Link href='/register'>
              <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded font-bold items-center justify-center hover:bg-secondary/30 hover:text-tertiary transition-colors duration-200 '>
                Register
              </div>
            </Link>
              <Link href='/login'>
                <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded font-bold items-center justify-center hover:bg-secondary/30 hover:text-tertiary transition-colors duration-200'>
                  Login
                </div>
              </Link></> : <>
              <div className="lg:inline-flex lg:w-auto w-full px-3 py-2 rounded font-bold items-center justify-center">
                {fm.user.email}
              </div>
              <button onClick={handleLogout}>
                <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded font-bold items-center justify-center hover:bg-secondary/30 hover:text-tertiary transition-colors duration-200'>
                  Logout
                </div>
              </button>
              <Link href='/files'>
                <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded font-bold items-center justify-center hover:bg-secondary/30 hover:text-tertiary transition-colors duration-200'>
                  Files
                </div>
              </Link>
              <Link href='/settings'>
                <div className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded font-bold items-center justify-center hover:bg-secondary/30 hover:text-tertiary transition-colors duration-200'>
                  Settings
                </div>
              </Link>
            </>}
          </div>
        </div>
      </div>
    </nav >
  )
}
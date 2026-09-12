import  {useState, useEffect} from 'react';

import {mockLogin} from '../services/AuthMock';

import {useNavigate} from 'react-router-dom';

import {RotaPerfil} from '../constants/RotasPerfil';

import logo from '../assets/fast cooking logo.png';

import { MdEmail } from 'react-icons/md';
import { MdLock } from 'react-icons/md';

function TelaLogin(){
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const[erro, setErro] = useState('');
    const[tentativas, setTentativas] = useState(0);
    const[bloqueado, setBloqueado] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if(erro){
            const timer = setTimeout(() => setErro(''), 4000);
            return () => clearTimeout(timer);
        }
    }, [erro]);
    
    function handleEnter(event){
        event.preventDefault();
        console.log('Tentando Logar com:', email, senha);

        async function performLogin(event){
            event.preventDefault();

            if(bloqueado) return;

            try{
                const dados =  await mockLogin(email, senha);
                console.log('Login bem-sucedido:', dados);

                setErro('');
                setTentativas(0);

                navigate(RotaPerfil[dados.perfil]);

            } catch (error) {
                console.error('Erro ao fazer login:', error.message);

                const novasTentativas = tentativas + 1;
                setTentativas(novasTentativas);
                setErro('Credenciais inválidas. Tentativa ' + novasTentativas + ' de 3.');

                if(novasTentativas >= 3){
                    setBloqueado(true);
                    setErro('Conta bloqueada devido a múltiplas tentativas falhas. Tente novamente mais tarde.');
                }
            }
        }

        performLogin(event);
    }

    return(
        <div className="min-h-screen bg-linear-to-r from-[#F9ECE5] to-[#D4C8C0] flex items-center justify-center">
            <div className="max-w-sm rounded-2xl border border-slate-100 bg-white/50 backdrop-blur-lg p-8 shadow-xl shadow-slate-100/50">

                <img src={logo} alt="Fast Cooking" className=" absolute -top-10 left-1/2 -translate-x-1/2 w-52 h-24" />

                <form onSubmit={handleEnter} className="items-center flex flex-col mt-12">

                    <div className="relative items-center">
                        <MdEmail 
                            size={15} 
                            color='gray' 
                            className="absolute pointer-events-none top-1/2 -translate-y-1/2 left-1"
                            />
                        <input 
                            id="email" 
                            type="email" 
                            placeholder="E-mail" 
                            value={email} onChange={(e)=> setEmail(e.target.value)} 
                            className="border solid border-slate-300 rounded-md p-2 pl-5" required
                        />
                    </div><br /> 
                    

                    <div className="relative items-center">
                        <MdLock 
                            size={15} 
                            color='gray' 
                            className="absolute pointer-events-none top-1/2 -translate-y-1/2 left-1"
                        />
                        <input 
                            id="senha" 
                            type="password" 
                            placeholder="Senha" 
                            value={senha} onChange={(e)=> setSenha(e.target.value)} 
                            className="border solid border-slate-300 rounded-md p-2 pl-5" required
                        />
                    </div><br />    

                    <button type="submit" className="bg-[#9C1C0E] text-white py-2 px-4 rounded-md hover:bg-[#7a160b] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        Entrar
                    </button>

                </form>
            </div>

            {erro && <div className="fixed top-6 right-6 bg-[#9C1C0E] text-white px-4 py-3 rounded-lg shadow-lg animate-[slide-in_0.3s_ease-out]">
                {erro}
            </div>}              
        </div>
    );
}

export default TelaLogin;
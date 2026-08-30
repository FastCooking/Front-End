import  {useState} from 'react';

import {mockLogin} from '../services/AuthMock';

import {useNavigate} from 'react-router-dom';

import {RotaPerfil} from '../constants/RotasPerfil';

function TelaLogin(){
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const[erro, setErro] = useState('');
    const[tentativas, setTentativas] = useState(0);
    const[bloqueado, setBloqueado] = useState(false);

    const navigate = useNavigate();
    
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
        <form onSubmit={handleEnter}>
            <label htmlFor="email">E-mail:</label>
            <input id="email" type="email" value={email} onChange={(e)=> setEmail(e.target.value)} required/>
            <label htmlFor="senha">Senha:</label>
            <input id="senha" type="password" value={senha} onChange={(e)=> setSenha(e.target.value)} required/>
            <button type="submit">Entrar</button>
            {erro && <p style={{color: 'red'}}>{erro}</p>}
        </form>
    );
}

export default TelaLogin;
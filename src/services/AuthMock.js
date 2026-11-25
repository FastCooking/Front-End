// TODO: substituir por chamada real à API assim que o contrato for definido

export function mockLogin(email, senha) {

    return new Promise((resolve, reject) => {

        setTimeout(() => {

            if (email === 'garcom@test.com' && senha === '123456'){resolve({ token: 'token-fake-123', perfil: 'garcom' });
            } 
            else if (email === 'gerente@test.com' && senha === '654321'){resolve({ token: 'token-fake-456', perfil: 'gerente' });
            } 
            else {reject(new Error('Credenciais inválidas'));
            }

        }, 800);
    });
}
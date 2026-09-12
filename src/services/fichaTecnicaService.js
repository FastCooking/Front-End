export async function criarFichaTecnica(fichaTecnica) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/fichas-tecnica`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(fichaTecnica)
    });

    if (!response.ok) {
        throw new Error('Erro ao criar ficha técnica');
    }

    return response.json();
}
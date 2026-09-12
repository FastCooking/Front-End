export async function criarInsumos(dadosInsumos) {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/insumos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosInsumos),
    });

    if (!response.ok) {
        throw new Error('Erro ao criar insumo');
    }

    return response.json();
}

export async function buscarInsumos() {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/insumos`, {
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar insumos');
    }

    return response.json();
}
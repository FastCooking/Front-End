export const CATEGORIAS = [
  "Todos",
  "Pratos Principais",
  "Entradas",
  "Lanches",
  "Pizzas",
  "Bebidas",
  "Sobremesas",
  "Acompanhamentos",
  "Combos"
];

export const PRODUTOS_MOCK = [
  {
    id: 1,
    nome: "X-Bacon Artesanal",
    preco: 34.90,
    categoria: "Lanches",
    descricao: "Hambúrguer artesanal de 180g preparado na chapa com ingredientes frescos, queijo cheddar derretido e fatias crocantes de bacon premium no pão brioche macio.",
    imagem: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Pão brioche",
      "Hambúrguer 180g",
      "Queijo cheddar",
      "Bacon crocante",
      "Alface americana",
      "Tomate fresco",
      "Molho especial da casa"
    ]
  },
  {
    id: 2,
    nome: "Filé Mignon à Grelha",
    preco: 59.90,
    categoria: "Pratos Principais",
    descricao: "Medalhão de filé mignon grelhado na manteiga de ervas, acompanhado de arroz biro-biro e batatas rústicas douradas.",
    imagem: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Filé Mignon 250g",
      "Manteiga de Ervas",
      "Arroz Biro-Biro",
      "Batata Rústica",
      "Molho Rôti",
      "Alho Crocante"
    ]
  },
  {
    id: 3,
    nome: "X-Salada Especial",
    preco: 29.90,
    categoria: "Lanches",
    descricao: "Delicioso hambúrguer bovino grelhado, acompanhado de queijo muçarela derretido, maionese temperada, alface e tomate selecionados.",
    imagem: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Pão com gergelim",
      "Hambúrguer bovino 160g",
      "Queijo muçarela",
      "Alface",
      "Tomate",
      "Maionese temperada",
      "Picles"
    ]
  },
  {
    id: 4,
    nome: "Bruschetta Italiana",
    preco: 24.00,
    categoria: "Entradas",
    descricao: "Fatias de pão italiano tostadas com azeite extravirgem, cobertas com tomates concassé, manjericão fresco e lascas de parmesão.",
    imagem: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Pão Italiano",
      "Tomate Fatiado",
      "Manjericão Fresco",
      "Azeite Extravirgem",
      "Alho",
      "Queijo Parmesão"
    ]
  },
  {
    id: 5,
    nome: "Pizza Calabresa Suprema",
    preco: 58.00,
    categoria: "Pizzas",
    descricao: "Massa artesanal de fermentação natural, molho de tomate pelati, calabresa fatiada crocante, bastante cebola roxa e azeitona preta finalizada com orégano.",
    imagem: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Massa de fermentação natural",
      "Molho de tomate pelati",
      "Queijo muçarela",
      "Calabresa fatiada",
      "Cebola roxa",
      "Azeitonas pretas",
      "Orégano fresquinho"
    ]
  },
  {
    id: 6,
    nome: "Pizza Quatro Queijos",
    preco: 64.90,
    categoria: "Pizzas",
    descricao: "Combinação perfeita dos queijos muçarela, gorgonzola, provolone e catupiry original sobre molho de tomate rústico.",
    imagem: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Massa artesanal",
      "Molho de tomate pelati",
      "Muçarela",
      "Gorgonzola",
      "Provolone",
      "Catupiry",
      "Manjericão fresco"
    ]
  },
  {
    id: 7,
    nome: "Batata Frita Rústica com Cheddar & Bacon",
    preco: 28.50,
    categoria: "Acompanhamentos",
    descricao: "Porção de batatas cortadas rústicas crocantes, cobertas com cheddar cremoso aquecido e pedaços de bacon dourado.",
    imagem: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Batata Rústica 400g",
      "Cheddar Cremoso",
      "Bacon Crocante",
      "Cebolinha Fresca"
    ]
  },
  {
    id: 8,
    nome: "Combo Casal Fast",
    preco: 79.90,
    categoria: "Combos",
    descricao: "2 Hambúrgueres artesanais X-Bacon + 1 Porção de batata frita grande bem crocante + 1 Refrigerante Guaraná 1.5L.",
    imagem: "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "2x Hambúrgueres X-Bacon",
      "1x Batata frita rústica (500g)",
      "1x Guaraná Antarctica 1.5L",
      "Molho especial cheddar potinho"
    ]
  },
  {
    id: 9,
    nome: "Coca-Cola Original 350ml",
    preco: 7.50,
    categoria: "Bebidas",
    descricao: "Lata trincando de gelada 350ml.",
    imagem: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Refrigerante Coca-Cola 350ml lata",
      "Gelo e limão (opcional)"
    ]
  },
  {
    id: 10,
    nome: "Suco Natural de Laranja 500ml",
    preco: 11.00,
    categoria: "Bebidas",
    descricao: "Suco 100% natural espremido na hora sem adição de conservantes.",
    imagem: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Laranjas selecionadas",
      "Gelo",
      "Açúcar (opcional)"
    ]
  },
  {
    id: 11,
    nome: "Grand Gateau de Chocolate",
    preco: 26.90,
    categoria: "Sobremesas",
    descricao: "Bolo quente de chocolate com recheio cremoso e escorrendo, acompanhado de picolé Magnum de baunilha com cobertura de chocolate e morangos frescos.",
    imagem: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Petit Gateau quente de chocolate",
      "Picolé de baunilha com cobertura de chocolate",
      "Morangos frescos picados",
      "Calda quente de chocolate belga",
      "Castanha de caju triturada"
    ]
  },
  {
    id: 12,
    nome: "Pudim de Leite Condensado",
    preco: 14.00,
    categoria: "Sobremesas",
    descricao: "Pudim de leite condensado super lisinho com calda de caramelo dourada clássica receita de família.",
    imagem: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?auto=format&fit=crop&w=800&q=80",
    ingredientes: [
      "Leite condensado",
      "Leite integral",
      "Ovos",
      "Calda de açúcar caramelizada"
    ]
  }
];

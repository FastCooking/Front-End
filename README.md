## Estratégia de Branches

O projeto utiliza uma estratégia de branches para organizar o
desenvolvimento e evitar alterações diretas na branch principal.

### Branches principais

- `main` → versão estável do projeto
- `develop` → integração das funcionalidades em desenvolvimento

### Branches de trabalho

As branches de trabalho devem seguir os seguintes padrões:

- `feature/*` → novas funcionalidades
- `fix/*` → correções de bugs
- `refactor/*` → refatorações
- `test/*` → criação ou alteração de testes
- `devops/*` → infraestrutura e automações
- `docs/*` → documentação

### Exemplos

```text
feature/FE01-cardapio
feature/FE02-carrinho
fix/FE03-calculo-total
refactor/FE04-componente-cardapio
test/FE05-testes-carrinho
devops/DO01-git
docs/README

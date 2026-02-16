
## Calculadora Shopee - Nova Pagina de Ferramentas

### Objetivo

Criar uma nova pagina com uma calculadora de lucro para vendedores da Shopee, baseada nas **novas taxas que entram em vigor em 01/03/2026**. Adicionar um botao de acesso rapido no header da pagina principal (/app).

### Novas Taxas Shopee (Março 2026) - Base do Calculo

**Vendedores CNPJ:**

| Faixa de Valor | Comissao | Subsidio Pix |
|---|---|---|
| Ate R$ 79,99 | 20% + R$ 4,00 | -- |
| R$ 80 a R$ 99,99 | 14% + R$ 16,00 | 5% |
| R$ 100 a R$ 199,99 | 14% + R$ 20,00 | 5% |
| R$ 200 a R$ 499,99 | 14% + R$ 26,00 | 5% |
| Acima de R$ 500 | 14% + R$ 28,00 | 8% |

**Vendedores CPF:**
- Mesma tabela, porem com taxa adicional de R$ 3,00 por item se ultrapassar 450 pedidos em 90 dias.

**Campanhas de Destaque:** +2,5% sobre a comissao.

### Campos da Calculadora (baseado no video)

1. **Preco de Venda** (R$) - obrigatorio
2. **Custo do Produto** (R$) - opcional
3. **Tipo de Vendedor** (CPF / CNPJ) - radio button
4. **Taxa de Imposto** (%) - input com default 0%
5. **Custo de Embalagem** (R$) - input com default R$ 0,00
6. **Participa de Campanha de Destaque?** - checkbox (+2,5%)

### Resultados Exibidos

- Comissao Shopee (valor e %)
- Taxa fixa
- Subsidio Pix (quando aplicavel)
- Imposto calculado
- Custo de embalagem
- **Valor liquido** (destaque)
- **Lucro** (preco venda - custo - taxas)
- **Margem de lucro** (%)
- Indicador visual: verde (margem > 15%), amarelo (5-15%), vermelho (< 5% ou negativo)

### Detalhes Tecnicos

#### Arquivos a Criar

1. **`src/pages/ShopeeCalculator.tsx`** - Pagina principal com a calculadora
   - Header com botao de voltar
   - Formulario com os campos descritos acima
   - Calculo em tempo real (sem botao de calcular)
   - Card de resultados com breakdown detalhado
   - Design responsivo seguindo o padrao do app

2. **`src/utils/shopeeCalculator.ts`** - Logica de calculo isolada
   - Funcao para determinar faixa de comissao com base no valor
   - Funcao para calcular todas as taxas
   - Funcao para calcular lucro e margem

#### Arquivos a Modificar

3. **`src/App.tsx`** - Adicionar rota `/shopee-calculator`
4. **`src/pages/Index.tsx`** - Adicionar botao no header para acessar a calculadora
5. **`src/i18n/locales/pt-BR.ts`** e **`src/i18n/locales/en.ts`** - Adicionar traducoes

#### Estrutura da Pagina

```text
+--------------------------------------------------+
| <- Voltar    Calculadora Shopee 2026              |
+--------------------------------------------------+
|                                                    |
|  [Preco de Venda: R$ _______ ]                    |
|  [Custo do Produto: R$ _______ ]                  |
|                                                    |
|  Tipo: (o) CNPJ  ( ) CPF                         |
|                                                    |
|  [Imposto (%): _______ ]                          |
|  [Embalagem (R$): _______ ]                       |
|  [ ] Campanha de Destaque (+2,5%)                 |
|                                                    |
+--------------------------------------------------+
|  RESULTADO                                         |
|                                                    |
|  Comissao Shopee:      -R$ XX,XX (XX%)            |
|  Taxa Fixa:            -R$ XX,XX                  |
|  Subsidio Pix:         +R$ XX,XX                  |
|  Imposto:              -R$ XX,XX                  |
|  Embalagem:            -R$ XX,XX                  |
|  ─────────────────────────────                    |
|  Valor Liquido:        R$ XX,XX                   |
|  Lucro:                R$ XX,XX                   |
|  Margem:               XX,X%   [INDICADOR]        |
+--------------------------------------------------+
```

#### Botao no Header (/app)

Adicionar um botao com icone de calculadora (Calculator do lucide-react) ao lado dos botoes existentes no header da pagina Index, antes do DonationButton.

#### Rota

- Rota publica: `/shopee-calculator` (nao requer autenticacao)
- Acessivel tanto da pagina /app quanto da landing

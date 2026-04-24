## Objetivo

Deixar a tabela do "Histórico de Processamento" mais arrumada, eliminando quebras de linha em headers longos e encurtando a data (já que o histórico só guarda 30 dias, o ano é redundante).

---

## Mudanças

### 1. `src/i18n/locales/pt-BR.ts` e `src/i18n/locales/en.ts`

Adicionar um bloco `historyTable` com chaves curtas, isolado das demais traduções para não impactar outros componentes que usam `labelCount`, `printFormat`, `processing`:

**pt-BR:**
```ts
historyTable: {
  date: 'Data',
  labels: 'Etq',
  format: 'Formato',
  time: 'Tempo',
  status: 'Status',
},
```

**en:**
```ts
historyTable: {
  date: 'Date',
  labels: 'Labels',
  format: 'Format',
  time: 'Time',
  status: 'Status',
},
```

### 2. `src/components/history/HistoryTable.tsx`

Substituir os headers atuais pelos novos, removendo a lógica de `isMobile ? t('date').substring(0,4) : ...`:

```tsx
<TableHead className="font-medium text-foreground py-1 text-xs">
  {t('historyTable.date')}
</TableHead>
<TableHead className="font-medium text-foreground py-1 text-xs">
  {t('historyTable.labels')}
</TableHead>
<TableHead className="font-medium text-foreground py-1 text-xs">
  {t('historyTable.format')}
</TableHead>
<TableHead className="font-medium text-foreground py-1 text-xs hidden sm:table-cell">
  {t('historyTable.time')}
</TableHead>
<TableHead className="font-medium text-foreground py-1 text-xs hidden md:table-cell">
  {t('historyTable.status')}
</TableHead>
```

### 3. `src/hooks/history/useDateFormatter.ts`

Unificar o formato (desktop e mobile) em **`DD/MM HH:mm`**, removendo o ano:

```ts
const formatDate = useCallback((date: Date) => {
  try {
    const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', '');
  } catch (e) {
    console.error('Error formatting date:', e);
    return String(date);
  }
}, [i18n.language]);
```

---

## Impacto

- Headers mais curtos → sem wrapping, layout mais limpo em desktop e mobile.
- Data sem ano → coluna mais estreita, dá mais espaço para as outras colunas.
- Nenhuma alteração em outros componentes (chaves antigas `labelCount`, `printFormat`, `processing` continuam intactas).

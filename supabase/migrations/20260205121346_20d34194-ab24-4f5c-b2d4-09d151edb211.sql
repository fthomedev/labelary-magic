-- Tabela para registrar erros fatais de processamento
CREATE TABLE public.processing_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contexto do processamento
  processing_type TEXT NOT NULL DEFAULT 'standard',
  label_count_attempted INTEGER,
  
  -- Detalhes do erro
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  
  -- Contexto tecnico
  processing_time_ms INTEGER,
  metadata JSONB
);

-- Habilitar RLS
ALTER TABLE public.processing_errors ENABLE ROW LEVEL SECURITY;

-- Usuarios podem ver apenas seus proprios erros
CREATE POLICY "Users can view their own errors"
  ON public.processing_errors FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios podem inserir seus proprios erros
CREATE POLICY "Users can insert their own errors"
  ON public.processing_errors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index para consultas por usuario e data
CREATE INDEX idx_processing_errors_user_created 
  ON public.processing_errors (user_id, created_at DESC);
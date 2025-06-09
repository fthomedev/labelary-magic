
-- Função para deletar um registro de histórico com diagnósticos
CREATE OR REPLACE FUNCTION public.delete_processing_history_record(record_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _record_exists BOOLEAN := FALSE;
  _record_belongs_to_user BOOLEAN := FALSE;
  _pdf_path TEXT;
  _deleted_count INTEGER := 0;
  result JSON;
BEGIN
  -- Obter o ID do usuário atual
  _user_id := auth.uid();
  
  -- Verificar se temos um usuário autenticado
  IF _user_id IS NULL THEN
    result := json_build_object(
      'success', false, 
      'error', 'User not authenticated',
      'diagnostics', json_build_object(
        'user_authenticated', false
      )
    );
    RETURN result;
  END IF;
  
  -- Verificar se o registro existe (sem filtro de usuário)
  SELECT EXISTS(
    SELECT 1 FROM public.processing_history WHERE id = record_id
  ) INTO _record_exists;
  
  -- Verificar se o registro pertence ao usuário atual
  SELECT EXISTS(
    SELECT 1 FROM public.processing_history 
    WHERE id = record_id AND user_id = _user_id
  ) INTO _record_belongs_to_user;
  
  -- Obter o caminho do PDF antes de deletar
  SELECT pdf_path INTO _pdf_path
  FROM public.processing_history 
  WHERE id = record_id AND user_id = _user_id;
  
  -- Tentar deletar o registro
  IF _record_belongs_to_user THEN
    DELETE FROM public.processing_history 
    WHERE id = record_id AND user_id = _user_id;
    
    GET DIAGNOSTICS _deleted_count = ROW_COUNT;
  END IF;
  
  -- Preparar resultado com diagnósticos
  result := json_build_object(
    'success', _deleted_count > 0,
    'deleted_count', _deleted_count,
    'pdf_path', _pdf_path,
    'diagnostics', json_build_object(
      'user_authenticated', true,
      'user_id', _user_id,
      'record_exists', _record_exists,
      'record_belongs_to_user', _record_belongs_to_user,
      'record_id', record_id
    )
  );
  
  RETURN result;
END;
$$;

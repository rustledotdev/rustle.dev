import React from 'react';
import { useT } from './context';

type TProps = {
  id?: string;
  text?: string;
  values?: Record<string, any>;
  dynamic?: Record<string, any>;
} & React.HTMLAttributes<HTMLSpanElement>;

export function T({ id, text, values, dynamic, ...rest }: TProps) {
  const t = useT();
  const resolvedId = (text ?? id) ?? '';
  const resolvedValues = values ?? dynamic;
  return <span {...rest}>{t(resolvedId, resolvedValues)}</span>;
}

export default T;


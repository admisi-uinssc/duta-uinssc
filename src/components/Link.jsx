import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

export default function Link({ href, to, children, ...rest }) {
  const target = to || href || '/';
  if (
    typeof target === 'string' &&
    (target.startsWith('#') || target.startsWith('http') || target.startsWith('mailto:') || target.startsWith('tel:'))
  ) {
    return (
      <a href={target} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={target} {...rest}>
      {children}
    </RouterLink>
  );
}
